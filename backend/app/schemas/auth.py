from typing import Optional
from pydantic import BaseModel


class UserBase(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    role: str = "AUTHORITY"
    department: Optional[str] = "Municipal Corporation Road Dept"


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
