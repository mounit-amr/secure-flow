import os
from typing import Generator

from dotenv import load_dotenv
load_dotenv()

import redis
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("DATABASE") or "sqlite:///./secureflow.db"

if DATABASE_URL and DATABASE_URL.startswith("postgresql"):
    try:
        import socket
        from urllib.parse import urlparse
        parsed = urlparse(DATABASE_URL)
        host = parsed.hostname or "localhost"
        port = parsed.port or 5432
        with socket.create_connection((host, port), timeout=1.0):
            pass
        if DATABASE_URL.startswith("postgresql://"):
            DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
    except Exception:
        DATABASE_URL = "sqlite:///./secureflow.db"

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

try:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args=connect_args)
    if DATABASE_URL.startswith("postgresql"):
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            column_check = connection.execute(
                text(
                    "SELECT EXISTS (" 
                    "SELECT 1 FROM information_schema.columns "
                    "WHERE table_name = 'accounts' AND column_name = 'security_pin'"
                    ")"
                )
            ).scalar()
            if not column_check:
                connection.execute(text("ALTER TABLE accounts ADD COLUMN security_pin VARCHAR"))
                connection.commit()
except Exception:
    DATABASE_URL = "sqlite:///./secureflow.db"
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args={"check_same_thread": False})

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
    "socket_connect_timeout": 2,
    "socket_timeout": 2,
}
if redis_password:
    redis_kwargs["password"] = redis_password

try:
    import socket
    with socket.create_connection((redis_host, redis_port), timeout=0.5):
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