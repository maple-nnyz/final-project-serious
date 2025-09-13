# app/models.py
from .database import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid, datetime

class QuizSubmission(Base):
    __tablename__ = "quiz_submissions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_id = Column(String, nullable=False)
    user_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    answers = relationship("QuizAnswer", back_populates="submission", cascade="all, delete-orphan")

class QuizAnswer(Base):
    __tablename__ = "quiz_answers"
    id = Column(Integer, primary_key=True, autoincrement=True)
    submission_id = Column(UUID(as_uuid=True), ForeignKey("quiz_submissions.id"), nullable=False)
    qid = Column(String, nullable=False)
    choice_index = Column(Integer, nullable=False)
    choice_text = Column(Text, nullable=True)
    submission = relationship("QuizSubmission", back_populates="answers")

class Item(Base):
    __tablename__ = "items"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(120), nullable=False)
    description = Column(Text, nullable=True)
