from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
import os
import shutil
from app.dependencies import get_db, get_current_user
from app.models.models import User, FileRecord, Resume, CoverLetter

router = APIRouter(
    prefix="/files",
    tags=["File Manager"]
)

class FileResponse(BaseModel):
    id: str  # Can be resume_id, cover_letter_id, or file_record_id
    filename: str
    file_size: int
    file_type: str
    category: str  # 'resume', 'cover_letter', 'certificate', 'report'
    created_at: datetime

    class Config:
        from_attributes = True

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/", response_model=List[FileResponse])
def list_my_files(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all user files including resumes, cover letters, and reports."""
    files_list = []
    
    # 1. Fetch Resumes
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).all()
    for res in resumes:
        sz = 0
        if res.file_path and os.path.exists(res.file_path):
            sz = os.path.getsize(res.file_path)
        else:
            sz = len(res.extracted_text or "") * 2  # approximate bytes
        files_list.append({
            "id": f"resume_{res.id}",
            "filename": res.file_name or "resume.pdf",
            "file_size": sz,
            "file_type": "application/pdf",
            "category": "resume",
            "created_at": res.created_at or datetime.now()
        })
        
    # 2. Fetch Custom File Records
    custom_records = db.query(FileRecord).filter(FileRecord.user_id == current_user.id).all()
    for rec in custom_records:
        files_list.append({
            "id": f"custom_{rec.id}",
            "filename": rec.filename,
            "file_size": rec.file_size,
            "file_type": rec.file_type,
            "category": rec.category,
            "created_at": rec.created_at
        })
        
    return files_list

@router.post("/upload", response_model=FileResponse)
def upload_custom_file(
    category: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload custom certificates, portfolios, or references."""
    unique_filename = f"{current_user.id}_{datetime.now().timestamp()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    sz = os.path.getsize(file_path)
    
    db_file = FileRecord(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        file_size=sz,
        file_type=file.content_type or "application/octet-stream",
        category=category
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    
    return {
        "id": f"custom_{db_file.id}",
        "filename": db_file.filename,
        "file_size": db_file.file_size,
        "file_type": db_file.file_type,
        "category": db_file.category,
        "created_at": db_file.created_at
    }

@router.put("/{file_id}/rename")
def rename_user_file(
    file_id: str,
    new_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rename an uploaded file or resume."""
    if not new_name.strip():
        raise HTTPException(status_code=400, detail="Invalid filename")
        
    if file_id.startswith("resume_"):
        resume_id = int(file_id.split("_")[1])
        res = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
        if not res:
            raise HTTPException(status_code=404, detail="File not found")
        res.file_name = new_name
        db.commit()
    elif file_id.startswith("custom_"):
        record_id = int(file_id.split("_")[1])
        rec = db.query(FileRecord).filter(FileRecord.id == record_id, FileRecord.user_id == current_user.id).first()
        if not rec:
            raise HTTPException(status_code=404, detail="File not found")
        rec.filename = new_name
        db.commit()
    else:
        raise HTTPException(status_code=400, detail="Invalid file ID")
        
    return {"status": "success", "message": "File renamed successfully"}

@router.delete("/{file_id}")
def delete_user_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Permanently delete a file."""
    if file_id.startswith("resume_"):
        resume_id = int(file_id.split("_")[1])
        res = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
        if not res:
            raise HTTPException(status_code=404, detail="File not found")
        if res.file_path and os.path.exists(res.file_path):
            try:
                os.remove(res.file_path)
            except:
                pass
        db.delete(res)
        db.commit()
    elif file_id.startswith("custom_"):
        record_id = int(file_id.split("_")[1])
        rec = db.query(FileRecord).filter(FileRecord.id == record_id, FileRecord.user_id == current_user.id).first()
        if not rec:
            raise HTTPException(status_code=404, detail="File not found")
        if rec.file_path and os.path.exists(rec.file_path):
            try:
                os.remove(rec.file_path)
            except:
                pass
        db.delete(rec)
        db.commit()
    else:
        raise HTTPException(status_code=400, detail="Invalid file ID")
        
    return {"status": "success", "message": "File deleted successfully"}
