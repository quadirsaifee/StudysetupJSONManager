Studysetup JSON Manager

This project has two parts:
1) Frontend React app (Vite)
2) Backend FastAPI app

--------------------------------------------------
START BACKEND
--------------------------------------------------
Open PowerShell in the project root:

cd D:\Projects\Python\StudysetupJSONManager
py -m uvicorn backend.main:app --host 127.0.0.1 --port 8001

If the Python env is not set, install dependencies first:

cd D:\Projects\Python\StudysetupJSONManager
py -m pip install -r backend\requirements.txt

Then run:

py -m uvicorn backend.main:app --host 127.0.0.1 --port 8001

Backend URL:
http://127.0.0.1:8001

--------------------------------------------------
START FRONTEND
--------------------------------------------------
Open a new PowerShell window in the project root:

cd D:\Projects\Python\StudysetupJSONManager
cmd /c "set PATH=C:\Program Files\nodejs;%PATH% && npm install && npm run dev -- --host 0.0.0.0"

This starts the Vite app.

Frontend URL:
http://localhost:5173/

--------------------------------------------------
IMPORTANT NOTES
--------------------------------------------------
- The backend saves uploaded files into:
  D:\Projects\Python\ClinicalTrialStudySetup\Protocol documents

- The backend calls the existing clinical trial API:
  http://127.0.0.1:8000/agent

- Accepted upload file types:
  .pdf, .docx, .doc, .txt

- Duplicate filenames will overwrite the existing file.

--------------------------------------------------
STOPPING APPS
--------------------------------------------------
Press Ctrl + C in each terminal window to stop the running app.

To stop ports manually if they are still listening:

netstat -ano | findstr :5173
netstat -ano | findstr :8001

taskkill /PID <PID> /F

Example:

taskkill /PID 12345 /F

To verify whether the ports are still active:

Test-NetConnection -ComputerName 127.0.0.1 -Port 5173
Test-NetConnection -ComputerName 127.0.0.1 -Port 8001

If either test fails, the port is no longer active.
