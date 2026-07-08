import os
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.dependencies import get_db, get_current_user
from app.models.models import User, Resume
from app.schemas.resume import ResumeResponse
from app.services.pdf_parser import PDFParserService
import uuid

router = APIRouter(
    prefix="/resumes",
    tags=["Resumes"]
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a resume PDF, extract its text using PyMuPDF, and save to the database.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    try:
        file_bytes = await file.read()
        extracted_text = PDFParserService.extract_text(file_bytes)
        
        # Save file physically (optional, but requested in structure)
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        with open(file_path, "wb") as f:
            f.write(file_bytes)
            
        # Save to database
        db_resume = Resume(
            user_id=current_user.id,
            file_path=file_path,
            file_name=file.filename,
            extracted_text=extracted_text
        )
        db.add(db_resume)
        db.commit()
        db.refresh(db_resume)
        
        return db_resume
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/", response_model=list[ResumeResponse])
def get_user_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve all uploaded resumes for the authenticated user.
    """
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).all()
    return resumes
