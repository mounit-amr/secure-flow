import sys
import threading
import time
from pathlib import Path
import uvicorn
import webview
PROJECT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_DIR))
sys.path.insert(0, str(BACKEND_DIR))

from backend.main import app

def run_backend():
    uvicorn.run(app, host="127.0.0.1", port=8005, log_level="error")

if __name__ == "__main__":
    server_thread = threading.Thread(target=run_backend, daemon=True)
    server_thread.start()
    time.sleep(0.5)

    webview.create_window(
        title="Secure Payment Gateway Terminal",
        url="http://127.0.0.1:8005",
        width=1200,
        height=850,
        resizable=True
    )
    webview.start()