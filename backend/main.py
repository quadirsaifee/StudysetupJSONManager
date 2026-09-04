from __future__ import annotations

import os
from pathlib import Path

import httpx
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware


PROJECT_ROOT = Path(
    os.getenv("CLINICAL_TRIAL_PROJECT", r"D:\Projects\Python\ClinicalTrialStudySetup")
).resolve()
PROTOCOL_FOLDER = Path(
    os.getenv("PROTOCOL_DOCUMENTS_FOLDER", str(PROJECT_ROOT / "Protocol documents"))
).resolve()
AGENT_API_URL = os.getenv("AGENT_API_URL", "http://127.0.0.1:8000/agent")
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt"}

app = FastAPI(title="Studysetup JSON Manager", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def ensure_protocol_folder() -> None:
    PROTOCOL_FOLDER.mkdir(parents=True, exist_ok=True)


def document_details(path: Path) -> dict[str, str | int]:
    return {"name": path.name, "size": path.stat().st_size}


@app.get("/api/documents")
def list_documents() -> list[dict[str, str | int]]:
    ensure_protocol_folder()
    return [
        document_details(path)
        for path in sorted(PROTOCOL_FOLDER.iterdir(), key=lambda item: item.name.lower())
        if path.is_file() and path.suffix.lower() in ALLOWED_EXTENSIONS
    ]


@app.post("/api/documents")
async def upload_documents(files: list[UploadFile] = File(...)) -> list[dict[str, str | int]]:
    ensure_protocol_folder()
    if not files:
        raise HTTPException(status_code=400, detail="Select at least one document.")

    for upload in files:
        filename = Path(upload.filename or "").name
        extension = Path(filename).suffix.lower()
        if not filename or extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail="Only PDF, DOCX, DOC, and TXT documents are supported.",
            )
        destination = PROTOCOL_FOLDER / filename
        destination.write_bytes(await upload.read())
        await upload.close()

    return list_documents()


@app.delete("/api/documents/{filename}")
def delete_document(filename: str) -> list[dict[str, str | int]]:
    safe_name = Path(filename).name
    path = PROTOCOL_FOLDER / safe_name
    if safe_name != filename or path.suffix.lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid document name.")
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Document not found.")
    path.unlink()
    return list_documents()


@app.post("/api/process")
async def process_documents() -> dict:
    ensure_protocol_folder()
    if not list_documents():
        raise HTTPException(status_code=400, detail="Upload at least one protocol document first.")

    try:
        async with httpx.AsyncClient(timeout=300) as client:
            response = await client.post(
                AGENT_API_URL,
                json={"input_folder": str(PROTOCOL_FOLDER)},
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as exc:
        detail = exc.response.json().get("detail", exc.response.text)
        raise HTTPException(status_code=502, detail=f"Agent API error: {detail}") from exc
    except (httpx.RequestError, ValueError) as exc:
        raise HTTPException(status_code=502, detail=f"Could not process documents: {exc}") from exc


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
