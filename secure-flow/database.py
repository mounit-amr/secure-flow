import os
from typing import Generator

import redis
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("DATABASE") or "sqlite:///./secureflow.db"
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

redis_host = os.getenv("REDIS_HOST") or os.getenv("REDIS_host") or "localhost"
redis_port = int(os.getenv("REDIS_PORT") or os.getenv("redis_port") or "6379")
redis_db = int(os.getenv("REDIS_DB") or "0")
redis_password = os.getenv("REDIS_PASSWORD")

redis_kwargs = {
    "host": redis_host,
    "port": redis_port,
    "db": redis_db,
    "decode_responses": True,
}
if redis_password:
    redis_kwargs["password"] = redis_password

try:
    redis_client = redis.Redis(**redis_kwargs)
    redis_client.ping()
except Exception:
    redis_client = None


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()