from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.models.models import User, Report
from pydantic import BaseModel

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)

class ReportResponse(BaseModel):
    id: int
    report_type: str
    report_url: str
    model_config = {"from_attributes": True}

@router.get("/", response_model=list[ReportResponse])
def get_user_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch all generated reports for the current user.
    """
    reports = db.query(Report).filter(Report.user_id == current_user.id).all()
    return reports

@router.post("/generate/{report_type}", response_model=ReportResponse)
def generate_report(
    report_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Trigger the generation of a specific report (ats, job_match, interview).
    """
    # In a real scenario, this triggers a PDF generation worker and uploads to a CDN.
    mock_url = f"https://cdn.example.com/reports/{current_user.id}_{report_type}.pdf"
    
    db_report = Report(
        user_id=current_user.id,
        report_type=report_type,
        report_url=mock_url
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    
    return db_report
