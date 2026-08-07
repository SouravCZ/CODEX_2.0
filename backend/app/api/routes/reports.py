from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.session import get_db
from api.models.user import User
from api.schemas.schemas import ReportNarrativeResponse
from api.routes.auth import get_current_user
from api.services.report_generator import generate_report

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/generate", response_model=ReportNarrativeResponse)
def generate_narrative(
    report: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate the narrative prose for a check-in report.

    The client re-sends the stored CheckinResponse payload (reports live in the
    browser's localStorage). The AI provider key never leaves this server.
    """
    return generate_report(report)
