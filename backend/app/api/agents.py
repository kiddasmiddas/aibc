import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.agent import AgentTemplate, ProjectAgent
from app.models.enums import AgentType
from app.models.project import Project
from app.models.user import User
from app.schemas.project import AddAgentRequest

router = APIRouter(tags=["agents"])

from app.models.enums import PlanType
from app.services.usage import _get_user_plan

# ── Text models per plan tier ──────────────────────────────────────
PLAN_MODELS: dict[PlanType, list[dict]] = {
    PlanType.free: [
        {"id": "openai/gpt-4o-mini", "name": "GPT-4o Mini", "provider": "OpenAI", "description": "Быстрая и экономичная"},
        {"id": "deepseek/deepseek-chat-v3-0324", "name": "DeepSeek V3", "provider": "DeepSeek", "description": "Бюджетная альтернатива"},
        {"id": "google/gemini-2.5-flash-preview", "name": "Gemini 2.5 Flash", "provider": "Google", "description": "Быстрая от Google"},
    ],
    PlanType.basic: [
        {"id": "openai/gpt-5-mini", "name": "GPT-5 Mini", "provider": "OpenAI", "description": "Быстрая модель нового поколения"},
        {"id": "anthropic/claude-opus-4", "name": "Claude Opus 4", "provider": "Anthropic", "description": "Мощная от Anthropic"},
        {"id": "anthropic/claude-sonnet-4", "name": "Claude Sonnet 4", "provider": "Anthropic", "description": "Сбалансированная"},
        {"id": "deepseek/deepseek-chat-v3-0324", "name": "DeepSeek V3", "provider": "DeepSeek", "description": "Бюджетная альтернатива"},
    ],
    PlanType.pro: [
        {"id": "openai/gpt-5.2", "name": "GPT-5.2", "provider": "OpenAI", "description": "Продвинутая модель OpenAI"},
        {"id": "anthropic/claude-opus-4-5", "name": "Claude Opus 4.5", "provider": "Anthropic", "description": "Топовая от Anthropic"},
        {"id": "anthropic/claude-sonnet-4-5", "name": "Claude Sonnet 4.5", "provider": "Anthropic", "description": "Быстрая и мощная"},
        {"id": "google/gemini-2.5-pro-preview", "name": "Gemini 2.5 Pro", "provider": "Google", "description": "Топовая от Google"},
        {"id": "deepseek/deepseek-chat-v3-0324", "name": "DeepSeek V3", "provider": "DeepSeek", "description": "Бюджетная альтернатива"},
    ],
    PlanType.ultra: [
        {"id": "openai/gpt-5.4", "name": "GPT-5.4", "provider": "OpenAI", "description": "Самая мощная модель OpenAI"},
        {"id": "anthropic/claude-opus-4-6", "name": "Claude Opus 4.6", "provider": "Anthropic", "description": "Самая мощная от Anthropic"},
        {"id": "anthropic/claude-sonnet-4-6", "name": "Claude Sonnet 4.6", "provider": "Anthropic", "description": "Быстрая нового поколения"},
        {"id": "deepseek/deepseek-v3.2-thinking", "name": "DeepSeek V3.2 Thinking", "provider": "DeepSeek", "description": "Reasoning от DeepSeek"},
        {"id": "google/gemini-3-pro", "name": "Gemini 3 Pro", "provider": "Google", "description": "Новейшая от Google"},
    ],
}

# ── Image generation models per plan tier ──────────────────────────
PLAN_IMAGE_MODELS: dict[PlanType, list[dict]] = {
    PlanType.free: [
        {"id": "openai/dall-e-2", "name": "DALL-E 2", "provider": "OpenAI", "description": "Базовая генерация изображений"},
    ],
    PlanType.basic: [
        {"id": "openai/dall-e-2", "name": "DALL-E 2", "provider": "OpenAI", "description": "Базовая генерация"},
        {"id": "openai/dall-e-3", "name": "DALL-E 3", "provider": "OpenAI", "description": "Продвинутая генерация"},
    ],
    PlanType.pro: [
        {"id": "openai/dall-e-3", "name": "DALL-E 3", "provider": "OpenAI", "description": "Продвинутая генерация"},
        {"id": "openai/gpt-image-1", "name": "GPT Image 1", "provider": "OpenAI", "description": "Новейшая генерация от OpenAI"},
    ],
    PlanType.ultra: [
        {"id": "openai/dall-e-3", "name": "DALL-E 3", "provider": "OpenAI", "description": "Продвинутая генерация"},
        {"id": "openai/gpt-image-1", "name": "GPT Image 1", "provider": "OpenAI", "description": "Новейшая генерация от OpenAI"},
    ],
}


@router.get("/models", response_model=dict)
async def get_models(
    agent_type: str | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    plan = await _get_user_plan(db, user.id)

    if agent_type == "designer":
        return {"data": PLAN_IMAGE_MODELS.get(plan, PLAN_IMAGE_MODELS[PlanType.free])}

    return {"data": PLAN_MODELS.get(plan, PLAN_MODELS[PlanType.free])}


@router.get("/agents/catalog", response_model=dict)
async def get_catalog(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AgentTemplate).where(AgentTemplate.is_active.is_(True)).order_by(AgentTemplate.type)
    )
    templates = result.scalars().all()

    return {
        "data": [
            {
                "id": str(t.id),
                "type": t.type.value,
                "name": t.name,
                "description": t.description,
                "icon": t.icon,
                "capabilities": t.capabilities,
            }
            for t in templates
        ]
    }


@router.post("/projects/{project_id}/agents", response_model=dict)
async def add_agent(
    project_id: uuid.UUID,
    body: AddAgentRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify project ownership
    stmt = select(Project).where(Project.id == project_id, Project.user_id == user.id)
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail={"code": "not_found", "message": "Project not found"})

    # Check duplicate
    existing = await db.execute(
        select(ProjectAgent).where(
            ProjectAgent.project_id == project_id,
            ProjectAgent.agent_type == body.agent_type,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail={"code": "agent_exists", "message": "Agent already added to project"},
        )

    # Find template
    tmpl_result = await db.execute(
        select(AgentTemplate).where(AgentTemplate.type == body.agent_type)
    )
    template = tmpl_result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=400, detail={"code": "invalid_agent", "message": "Agent type not found"})

    agent = ProjectAgent(
        project_id=project_id,
        agent_template_id=template.id,
        agent_type=body.agent_type,
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)

    return {
        "data": {
            "id": str(agent.id),
            "agent_type": agent.agent_type.value,
            "status": agent.status.value,
        }
    }


@router.patch("/projects/{project_id}/agents/{agent_type}/complete", response_model=dict)
async def mark_agent_complete(
    project_id: uuid.UUID,
    agent_type: AgentType,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Project).where(Project.id == project_id, Project.user_id == user.id)
    result = await db.execute(stmt)
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail={"code": "not_found", "message": "Project not found"})

    agent_result = await db.execute(
        select(ProjectAgent).where(
            ProjectAgent.project_id == project_id,
            ProjectAgent.agent_type == agent_type,
        )
    )
    agent = agent_result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail={"code": "not_found", "message": "Agent not found in project"})

    agent.task_completed = True
    await db.commit()

    # Check if all agents completed
    all_agents = await db.execute(
        select(ProjectAgent).where(ProjectAgent.project_id == project_id)
    )
    agents = all_agents.scalars().all()
    total = len(agents)
    completed = sum(1 for a in agents if a.task_completed)

    return {
        "data": {
            "agent_type": agent_type.value,
            "task_completed": True,
            "progress": {"completed": completed, "total": total, "all_done": completed == total},
        }
    }


@router.delete("/projects/{project_id}/agents/{agent_type}", response_model=dict)
async def remove_agent(
    project_id: uuid.UUID,
    agent_type: AgentType,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify project ownership
    stmt = select(Project).where(Project.id == project_id, Project.user_id == user.id)
    result = await db.execute(stmt)
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail={"code": "not_found", "message": "Project not found"})

    agent_result = await db.execute(
        select(ProjectAgent).where(
            ProjectAgent.project_id == project_id,
            ProjectAgent.agent_type == agent_type,
        )
    )
    agent = agent_result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail={"code": "not_found", "message": "Agent not found in project"})

    await db.delete(agent)
    await db.commit()

    return {"data": {"message": "Agent removed"}}
