from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import secrets

from .database import Base


def generate_zone_id() -> str:
    """Generate a Route53-style zone ID like Z1ABC2DEF3GHI4."""
    return "Z" + secrets.token_hex(8).upper()[:14]


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(100), nullable=True)
    account_id = Column(String(20), default="123456789012")
    created_at = Column(DateTime, default=datetime.utcnow)


class HostedZone(Base):
    __tablename__ = "hosted_zones"

    id = Column(Integer, primary_key=True, autoincrement=True)
    zone_id = Column(String(32), unique=True, nullable=False, index=True, default=generate_zone_id)
    name = Column(String(255), nullable=False)
    type = Column(String(20), default="Public")
    record_count = Column(Integer, default=0)
    description = Column(String(500), nullable=True)
    comment = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    records = relationship("DNSRecord", back_populates="hosted_zone", cascade="all, delete-orphan")


class DNSRecord(Base):
    __tablename__ = "dns_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    hosted_zone_id = Column(Integer, ForeignKey("hosted_zones.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(10), nullable=False)
    value = Column(Text, nullable=False)
    ttl = Column(Integer, default=300)
    routing_policy = Column(String(20), default="Simple")
    alias = Column(Boolean, default=False)
    weight = Column(Integer, nullable=True)
    region = Column(String(50), nullable=True)
    set_identifier = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    hosted_zone = relationship("HostedZone", back_populates="records")
