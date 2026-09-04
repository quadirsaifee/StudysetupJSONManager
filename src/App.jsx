import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, FileText, Plus, Trash2, Upload, WandSparkles } from "lucide-react";

const ACCEPTED_FILES = ".pdf,.docx,.doc,.txt";

async function request(path, options = {}) {
  const response = await fetch(path, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || "Something went wrong.");
  return body;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function App() {
  const inputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    request("/api/documents").then(setDocuments).catch((error) => setMessage({ type: "error", text: error.message }));
  }, []);

  async function uploadFiles(event) {
    const files = [...event.target.files];
    if (!files.length) return;
    setBusy(true);
    setMessage(null);
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    try {
      setDocuments(await request("/api/documents", { method: "POST", body: formData }));
      setMessage({ type: "success", text: `${files.length} document${files.length === 1 ? "" : "s"} uploaded.` });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  async function deleteDocument(name) {
    setBusy(true);
    setMessage(null);
    try {
      setDocuments(await request(`/api/documents/${encodeURIComponent(name)}`, { method: "DELETE" }));
      setMessage({ type: "success", text: `${name} removed.` });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function processDocuments() {
    setBusy(true);
    setMessage(null);
    try {
      setResult(await request("/api/process", { method: "POST" }));
      setMessage({ type: "success", text: "Study setup JSON created." });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <div className="brand-mark"><span>ST</span></div>
        <div><p className="eyebrow">Protocol workspace</p><h1>Studysetup JSON Manager</h1></div>
        <div className="status-pill"><span className="status-dot" /> Local workspace</div>
      </header>

      <section className="intro">
        <p className="eyebrow">Document to study setup</p>
        <h2>Turn protocol documents<br /><em>into structured study data.</em></h2>
        <p className="intro-copy">Upload the source materials for your trial. The study setup agent will read the shared protocol folder and return a ready-to-use JSON configuration.</p>
      </section>

      <section className="workspace">
        <div className="section-heading"><div><p className="eyebrow">01 / Source material</p><h3>Protocol documents for study</h3></div><span className="file-count">{documents.length} {documents.length === 1 ? "file" : "files"}</span></div>
        <div className="upload-row">
          <button className="upload-zone" type="button" onClick={() => inputRef.current?.click()} disabled={busy}>
            <span className="upload-icon"><Upload size={20} /></span><span><strong>Upload protocol files</strong><small>PDF, DOCX, DOC or TXT</small></span><Plus className="upload-plus" size={20} />
          </button>
          <input ref={inputRef} type="file" accept={ACCEPTED_FILES} multiple hidden onChange={uploadFiles} />
          <button className="process-button" type="button" onClick={processDocuments} disabled={busy || !documents.length}><WandSparkles size={18} />{busy ? "Working..." : "Process uploaded documents"}</button>
        </div>

        {message && <div className={`notice ${message.type}`}><span>{message.type === "error" ? <AlertCircle size={17} /> : <Check size={17} />}</span>{message.text}</div>}

        <div className="document-list">
          {documents.length ? documents.map((document) => <div className="document-item" key={document.name}><div className="document-icon"><FileText size={19} /></div><div className="document-meta"><strong>{document.name}</strong><span>{formatBytes(document.size)}</span></div><button className="icon-button" title={`Delete ${document.name}`} aria-label={`Delete ${document.name}`} onClick={() => deleteDocument(document.name)} disabled={busy}><Trash2 size={17} /></button></div>) : <div className="empty-state">No protocol documents uploaded yet.</div>}
        </div>
      </section>

      {result && <section className="output-section"><div className="section-heading"><div><p className="eyebrow">02 / Generated output</p><h3>Study setup JSON</h3></div><span className="json-badge">JSON</span></div><pre>{JSON.stringify(result, null, 2)}</pre></section>}
    </main>
  );
}
