import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import HTMLResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.project import Project
from app.services.auth import verify_token
from app.services.site_builder import get_site

router = APIRouter(prefix="/projects/{project_id}/site", tags=["sites"])

NO_SITE_HTML = (
    "<html><body style='display:flex;align-items:center;justify-content:center;"
    "height:100vh;font-family:sans-serif;color:#999'>"
    "<p>Сайт ещё не создан. Попросите веб-разработчика создать его.</p>"
    "</body></html>"
)


@router.get("")
async def serve_site(
    project_id: uuid.UUID,
    token: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    # Verify token from query param
    if not token:
        return HTMLResponse(NO_SITE_HTML)
    user_id = verify_token(token, token_type="access")
    if user_id is None:
        return HTMLResponse(NO_SITE_HTML)

    # Verify project belongs to user
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user_id)
    )
    if not result.scalar_one_or_none():
        return HTMLResponse(NO_SITE_HTML)

    html = await get_site(project_id)
    if html is None:
        return HTMLResponse(NO_SITE_HTML)
    return HTMLResponse(
        html,
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
        },
    )
