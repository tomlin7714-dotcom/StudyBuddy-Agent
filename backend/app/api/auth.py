import hashlib
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db, UserRecord
from app.core.config import get_settings
from app.models.schemas import RegisterRequest, LoginRequest, AuthResponse

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()
settings = get_settings()


# ── Simple token store (JWT-lite: HMAC(user_id:timestamp)) ──

def _make_token(user_id: str) -> str:
    ts = int(datetime.utcnow().timestamp())
    payload = f"{user_id}:{ts}"
    sig = hashlib.sha256(f"{payload}:{settings.jwt_secret}".encode()).hexdigest()[:16]
    return f"{payload}:{sig}"


def _verify_token(token: str) -> str | None:
    try:
        parts = token.split(":")
        if len(parts) != 3:
            return None
        user_id, ts_str, sig = parts
        payload = f"{user_id}:{ts_str}"
        expected = hashlib.sha256(f"{payload}:{settings.jwt_secret}".encode()).hexdigest()[:16]
        if not secrets.compare_digest(sig, expected):
            return None
        # Optional: check expiry (7 days)
        ts = int(ts_str)
        if datetime.utcnow() - datetime.utcfromtimestamp(ts) > timedelta(days=7):
            return None
        return user_id
    except Exception:
        return None


# ── Dependency: extract current user from Authorization header ──

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> str:
    user_id = _verify_token(credentials.credentials)
    if not user_id:
        raise HTTPException(status_code=401, detail="无效或过期的 token")
    result = await db.execute(select(UserRecord).where(UserRecord.id == user_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=401, detail="用户不存在")
    return user_id


# ── Routes ──

@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(UserRecord).where(UserRecord.username == req.username)
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="用户名已存在")

    h = hashlib.sha256(f"{req.username}:{req.password}:{settings.jwt_secret}".encode()).hexdigest()

    user = UserRecord(username=req.username, password_hash=h)
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = _make_token(user.id)
    return AuthResponse(token=token, user_id=user.id, username=user.username)


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(UserRecord).where(UserRecord.username == req.username)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    h = hashlib.sha256(f"{req.username}:{req.password}:{settings.jwt_secret}".encode()).hexdigest()
    if not secrets.compare_digest(h, user.password_hash):
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    token = _make_token(user.id)
    return AuthResponse(token=token, user_id=user.id, username=user.username)
