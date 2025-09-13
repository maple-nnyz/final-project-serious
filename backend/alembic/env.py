from logging.config import fileConfig
import sys
import os
from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# เพิ่ม path เพื่อให้ import app ได้
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Import Base จาก models/db
from backend.app.database import Base

# Alembic Config object
config = context.config

# โหลดค่า DATABASE_URL จาก .env ถ้าจำเป็น
from dotenv import load_dotenv
load_dotenv()

config.set_main_option('sqlalchemy.url', os.getenv("DATABASE_URL"))

# ตั้ง metadata
target_metadata = Base.metadata

# ตั้ง logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url, target_metadata=target_metadata, literal_binds=True, dialect_opts={"paramstyle": "named"}
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
