import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from app.database.connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    role = Column(String(20), default="AUTHORITY", nullable=False)  # ADMIN, AUTHORITY, OPERATOR
    department = Column(String(100), default="Municipal Corporation Road Dept")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
