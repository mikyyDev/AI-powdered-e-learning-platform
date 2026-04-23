from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, TokenOut, UserOut, RefreshTokenIn
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenOut, status_code=201)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    return await auth_service.register_user(data, db)


@router.post("/login", response_model=TokenOut)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    return await auth_service.login_user(data, db)


@router.post("/refresh", response_model=TokenOut)
async def refresh(data: RefreshTokenIn, db: AsyncSession = Depends(get_db)):
    return await auth_service.refresh_tokens(data.refresh_token, db)


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    return user
