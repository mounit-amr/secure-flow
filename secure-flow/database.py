import os
import redis
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE", "   ")
engine = create_engine(DATABASE_URL)
Sessionlocal = sessionmaker(autocommit = False, autoflush= False, bind = engine)
Base = declarative_base()

redis_client = redis.Redis(
    host = os.getenv("REDIS_host", " "),
    port = int(os.getenv("redis_port",  123 )),
    db = 0,
    decode_responses=True#test
)

def get_db():
    db = Sessionlocal()
    try:
        yield db
    finally:
        db.close()