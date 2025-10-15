from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from .database import Base

class UserRole(Enum):
    student = "student"
    sponsor = "sponsor"
    admin = "admin"

class MessageType(Enum):
    text = "text"
    audio = "audio"

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True)
    full_name = Column(String)
    email = Column(String, unique=True)
    role = Column(Enum(UserRole), default=UserRole.student)
    profile_image_url = Column(Text)
    language_preference = Column(String, default="ur")
    created_at = Column(DateTime, default=datetime.now(timezone.utc))

class Chat(Base):
    __tablename__ = "chats"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    sponsor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.now(timezone.utc))

class Message(Base):
    __tablename__ = "messages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_id = Column(UUID(as_uuid=True), ForeignKey("chats.id"))
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    message_type = Column(Enum(MessageType), default=MessageType.text)
    text_original = Column(Text)
    text_translated = Column(Text)
    audio_url = Column(Text)
    language_original = Column(String, default="ur")
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
