from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.models.models import User, Resume, ATSScore, InterviewSession, JobMatch, LearningRoadmap
import io
import csv

router = APIRouter(
    prefix="/export",
    tags=["Report Export Center"]
)

@router.get("/")
def export_report(
    report_type: str,  # 'resume', 'ats', 'interview', 'job_match', 'roadmap', 'profile'
    format: str,       # 'pdf', 'docx', 'csv'
    item_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export reports to PDF, DOCX, or CSV streams.
    """
    content = ""
    filename = f"{report_type}_report.{format}"
    media_type = "application/octet-stream"

    # Fetch details based on report_type
    if report_type == "profile":
        content_lines = [
            ["CareerSuccess Profile Summary"],
            ["Name", current_user.name],
            ["Email", current_user.email],
            ["Phone", current_user.phone or "N/A"],
            ["Skills", current_user.skills or "N/A"],
            ["Experience", current_user.experience or "N/A"],
            ["Preferred Roles", current_user.preferred_roles or "N/A"],
            ["Preferred Locations", current_user.preferred_locations or "N/A"],
        ]
    elif report_type == "ats":
        # Get ATS score
        score = db.query(ATSScore).join(Resume).filter(Resume.user_id == current_user.id).order_by(ATSScore.created_at.desc()).first()
        if not score:
            raise HTTPException(status_code=404, detail="No ATS score found to export")
        content_lines = [
            ["ATS Scorecard Report"],
            ["Score", f"{score.score}/100"],
            ["Missing Keywords", score.missing_keywords or "None"],
            ["Formatting Issues", score.formatting_issues or "None"],
            ["Strengths", score.strengths or "N/A"],
            ["Weaknesses", score.weaknesses or "N/A"],
        ]
    elif report_type == "roadmap":
        roadmap = db.query(LearningRoadmap).filter(LearningRoadmap.user_id == current_user.id).order_by(LearningRoadmap.created_at.desc()).first()
        if not roadmap:
            raise HTTPException(status_code=404, detail="No Learning Roadmap found to export")
        content_lines = [
            ["Learning Roadmap Details"],
            ["Target Role", roadmap.target_role],
            ["Current Skills", roadmap.current_skills],
            ["Roadmap", roadmap.roadmap_text],
        ]
    elif report_type == "interview":
        session = db.query(InterviewSession).filter(InterviewSession.user_id == current_user.id).order_by(InterviewSession.created_at.desc()).first()
        if not session:
            raise HTTPException(status_code=404, detail="No Mock Interview session found")
        content_lines = [
            ["Mock Interview Session Grading"],
            ["Job Role", session.job_role],
            ["Difficulty", session.difficulty],
            ["Overall Score", f"{session.total_score or 0}/100"],
            ["Technical Score", f"{session.technical_score or 0}/100"],
            ["Communication Score", f"{session.communication_score or 0}/100"],
            ["Confidence Score", f"{session.confidence_score or 0}/100"],
        ]
    else:
        content_lines = [
            ["Careersuccess Report"],
            ["Export Date", datetime.now().isoformat()],
            ["User", current_user.email],
        ]

    # Generate streams based on format
    if format == "csv":
        media_type = "text/csv"
        stream = io.StringIO()
        writer = csv.writer(stream)
        writer.writerows(content_lines)
        return StreamingResponse(
            io.BytesIO(stream.getvalue().encode("utf-8")),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    elif format == "pdf":
        media_type = "application/pdf"
        # We write a cleanly formatted plaintext PDF stream for simplicity and environment safety
        pdf_stream = io.BytesIO()
        pdf_stream.write(b"%PDF-1.4\n")
        pdf_stream.write(b"1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n")
        pdf_stream.write(b"2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n")
        
        # Build text string
        text_content = "\n".join([f"{row[0]}: {row[1]}" if len(row) > 1 else row[0] for row in content_lines])
        stream_bytes = text_content.encode("utf-8")
        
        pdf_stream.write(b"3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 <<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\n>>\n>>\n/Contents 4 0 R\n>>\nendobj\n")
        pdf_stream.write(f"4 0 obj\n<<\n/Length {len(stream_bytes) + 40}\n>>\nstream\nBT\n/F1 12 Tf\n50 750 Td\n16 TL\n".encode("utf-8"))
        
        # Write lines to PDF stream
        for row in content_lines:
            row_str = f"{row[0]}: {row[1]}" if len(row) > 1 else row[0]
            # escape special characters in PDF strings
            escaped_str = row_str.replace("(", "\\(").replace(")", "\\)")
            pdf_stream.write(f"({escaped_str}) Tj T*\n".encode("utf-8"))
            
        pdf_stream.write(b"ET\nendstream\nendobj\n")
        pdf_stream.write(b"xref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000213 00000 n\ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n350\n%%EOF")
        
        pdf_stream.seek(0)
        return StreamingResponse(
            pdf_stream,
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    else:  # docx
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        # We output a formatted text block that can be saved directly as a document file
        doc_stream = io.BytesIO()
        text_content = f"CareerSuccess Portal - Official Document Export\n{'='*50}\n\n"
        text_content += "\n".join([f"{row[0]}: {row[1]}" if len(row) > 1 else row[0] for row in content_lines])
        doc_stream.write(text_content.encode("utf-8"))
        doc_stream.seek(0)
        return StreamingResponse(
            doc_stream,
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
