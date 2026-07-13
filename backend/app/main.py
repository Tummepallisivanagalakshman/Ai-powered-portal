from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import time
from app.database import SessionLocal
from app.models.models import SystemLog

# Initialize FastAPI App
app = FastAPI(
    title="AI Career Success Portal - Python Backend",
    description="Production-Ready FastAPI Backend handling AI artifact persistence, ATS analysis, and Jobs.",
    version="1.0.0"
)

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://127.0.0.1:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_request_performance(request: Request, call_next):
    start_time = time.time()
    error_msg = None
    try:
        response = await call_next(request)
        status_code = response.status_code
        return response
    except Exception as e:
        error_msg = str(e)
        status_code = 500
        raise e
    finally:
        process_time = time.time() - start_time
        # We log API execution logs in system_logs table
        if request.url.path.startswith("/api"):
            db = SessionLocal()
            try:
                # Do not log system logs insertions to avoid recursive infinite loop
                if not request.url.path.endswith("/admin/system-health") and not request.url.path.endswith("/admin/audit-logs"):
                    log_record = SystemLog(
                        path=request.url.path,
                        method=request.method,
                        status_code=status_code,
                        response_time=process_time,
                        error_message=error_msg
                    )
                    db.add(log_record)
                    db.commit()
            except Exception as log_err:
                print(f"Failed to log system metric: {log_err}")
            finally:
                db.close()

@app.get("/api/health")
async def health_check():
    """
    Basic health check to ensure the API is running.
    """
    return {"status": "ok", "message": "Python backend is live."}

# Register Core AI/Tracker Routers
from app.routers import (
    auth, users, resume, ats, jobs,
    chatbot, dashboard, reports,
    job_tracker, roadmap, interview,
    cover_letter, ai_proxy, admin, notifications,
    calendar, companies, bookmarks, feedback,
    files, export, search, analytics
)

app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(resume.router, prefix="/api")
app.include_router(ats.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(chatbot.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(job_tracker.router, prefix="/api")
app.include_router(roadmap.router, prefix="/api")
app.include_router(interview.router, prefix="/api")
app.include_router(cover_letter.router, prefix="/api")
app.include_router(ai_proxy.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(calendar.router, prefix="/api")
app.include_router(companies.router, prefix="/api")
app.include_router(bookmarks.router, prefix="/api")
app.include_router(feedback.router, prefix="/api")
app.include_router(files.router, prefix="/api")
app.include_router(export.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
