from pydantic import BaseModel, Field

# Config for ORM mode (pydantic v1)
from typing import Optional, List
from datetime import datetime


# ─── Auth Schemas ───────────────────────────────────────────────────────────

class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    class Config:
        orm_mode = True

    id: int
    username: str
    email: Optional[str] = None
    account_id: Optional[str] = "123456789012"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ─── Hosted Zone Schemas ───────────────────────────────────────────────────

class HostedZoneCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Domain name (e.g. example.com.)")
    type: str = Field(default="Public", description="Public or Private")
    description: Optional[str] = Field(None, max_length=500)
    comment: Optional[str] = Field(None, max_length=500)


class HostedZoneUpdate(BaseModel):
    description: Optional[str] = Field(None, max_length=500)
    comment: Optional[str] = Field(None, max_length=500)


class HostedZoneResponse(BaseModel):
    class Config:
        orm_mode = True

    id: int
    zone_id: str
    name: str
    type: str
    record_count: int
    description: Optional[str] = None
    comment: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class HostedZoneListResponse(BaseModel):
    hosted_zones: List[HostedZoneResponse]
    total: int
    page: int
    page_size: int


# ─── DNS Record Schemas ────────────────────────────────────────────────────

class DNSRecordCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    type: str = Field(..., description="Record type: A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA")
    value: str = Field(..., min_length=1)
    ttl: int = Field(default=300, ge=0, le=2147483647)
    routing_policy: str = Field(default="Simple")
    alias: bool = Field(default=False)
    weight: Optional[int] = None
    region: Optional[str] = None
    set_identifier: Optional[str] = None


class DNSRecordUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    type: Optional[str] = None
    value: Optional[str] = Field(None, min_length=1)
    ttl: Optional[int] = Field(None, ge=0, le=2147483647)
    routing_policy: Optional[str] = None
    alias: Optional[bool] = None
    weight: Optional[int] = None
    region: Optional[str] = None
    set_identifier: Optional[str] = None


class DNSRecordResponse(BaseModel):
    class Config:
        orm_mode = True

    id: int
    hosted_zone_id: int
    name: str
    type: str
    value: str
    ttl: int
    routing_policy: Optional[str] = "Simple"
    alias: bool = False
    weight: Optional[int] = None
    region: Optional[str] = None
    set_identifier: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class DNSRecordListResponse(BaseModel):
    records: List[DNSRecordResponse]
    total: int
    page: int
    page_size: int


# ─── Bulk & Import Schemas ─────────────────────────────────────────────────

class BulkDeleteRequest(BaseModel):
    record_ids: List[int]


class BulkDeleteResponse(BaseModel):
    message: str
    deleted_count: int


class ImportResult(BaseModel):
    imported: int
    errors: List[str]


class MessageResponse(BaseModel):
    message: str
