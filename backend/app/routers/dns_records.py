import re
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..models import User, HostedZone, DNSRecord
from ..schemas import (
    DNSRecordCreate, DNSRecordUpdate, DNSRecordResponse,
    DNSRecordListResponse, BulkDeleteRequest, BulkDeleteResponse,
    ImportResult, MessageResponse,
)
from ..auth import get_current_user
import logging
router = APIRouter(prefix="/api/hosted-zones/{zone_id}/records", tags=["DNS Records"])


def _get_zone(zone_id: str, db: Session) -> HostedZone:
    """Helper to get a hosted zone or raise 404."""
    zone = db.query(HostedZone).filter(HostedZone.zone_id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hosted zone not found")
    return zone


def _update_record_count(zone: HostedZone, db: Session) -> None:
    """Update the record count for a hosted zone."""
    zone.record_count = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone.id).count()
    db.flush()


@router.get("", response_model=DNSRecordListResponse)
def list_records(
    zone_id: str,
    search: Optional[str] = Query(None, description="Search by record name"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    type_filter: Optional[str] = Query(None, description="Filter by record type"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List DNS records for a hosted zone with search, pagination, and type filter."""
    zone = _get_zone(zone_id, db)
    query = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone.id)

    if search:
        query = query.filter(DNSRecord.name.ilike(f"%{search}%"))

    if type_filter:
        query = query.filter(DNSRecord.type == type_filter)

    total = query.count()
    records = query.order_by(DNSRecord.type, DNSRecord.name).offset((page - 1) * page_size).limit(page_size).all()

    return DNSRecordListResponse(
        records=[DNSRecordResponse.model_validate(r) for r in records],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{record_id}", response_model=DNSRecordResponse)
def get_record(
    zone_id: str,
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single DNS record by ID."""
    zone = _get_zone(zone_id, db)
    record = db.query(DNSRecord).filter(
        DNSRecord.id == record_id,
        DNSRecord.hosted_zone_id == zone.id,
    ).first()

    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="DNS record not found")
    return record


@router.post("", response_model=DNSRecordResponse, status_code=status.HTTP_201_CREATED)
def create_record(
    zone_id: str,
    record_data: DNSRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new DNS record in the hosted zone."""
    zone = _get_zone(zone_id, db)

    valid_types = {"A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"}
    if record_data.type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid record type. Must be one of: {', '.join(sorted(valid_types))}",
        )

    record = DNSRecord(
        hosted_zone_id=zone.id,
        name=record_data.name,
        type=record_data.type,
        value=record_data.value,
        ttl=record_data.ttl,
        routing_policy=record_data.routing_policy,
        alias=record_data.alias,
        weight=record_data.weight,
        region=record_data.region,
        set_identifier=record_data.set_identifier,
    )
    db.add(record)
    _update_record_count(zone, db)
    db.commit()
    db.refresh(record)
    return record


@router.put("/{record_id}", response_model=DNSRecordResponse)
def update_record(
    zone_id: str,
    record_id: int,
    record_data: DNSRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing DNS record."""
    zone = _get_zone(zone_id, db)
    record = db.query(DNSRecord).filter(
        DNSRecord.id == record_id,
        DNSRecord.hosted_zone_id == zone.id,
    ).first()

    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="DNS record not found")

    # Disallow changes to immutable fields (name, type)
    immutable_fields = {"name", "type"}
    update_data = record_data.model_dump(exclude_unset=True)
    # If any immutable field is present, raise a clear error
    for key in update_data.keys():
        if key in immutable_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Field '{key}' cannot be modified"
            )
    # Apply allowed updates
    for key, value in update_data.items():
        setattr(record, key, value)
    logger = logging.getLogger("uvicorn.error")
    logger.info(f"Updating record {record.id} with data: {update_data}")
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    db.refresh(record)
    return record


@router.delete("/{record_id}", response_model=MessageResponse)
def delete_record(
    zone_id: str,
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a DNS record."""
    zone = _get_zone(zone_id, db)
    record = db.query(DNSRecord).filter(
        DNSRecord.id == record_id,
        DNSRecord.hosted_zone_id == zone.id,
    ).first()

    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="DNS record not found")

    db.delete(record)
    _update_record_count(zone, db)
    db.commit()
    return MessageResponse(message=f"Record {record_id} deleted successfully")


@router.post("/bulk-delete", response_model=BulkDeleteResponse)
def bulk_delete_records(
    zone_id: str,
    bulk_data: BulkDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete multiple DNS records at once."""
    zone = _get_zone(zone_id, db)

    deleted_count = db.query(DNSRecord).filter(
        DNSRecord.id.in_(bulk_data.record_ids),
        DNSRecord.hosted_zone_id == zone.id,
    ).delete(synchronize_session="fetch")

    _update_record_count(zone, db)
    db.commit()
    return BulkDeleteResponse(message=f"Deleted {deleted_count} records", deleted_count=deleted_count)


@router.post("/import", response_model=ImportResult)
async def import_records(
    zone_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Import DNS records from a BIND zone file."""
    zone = _get_zone(zone_id, db)

    content = await file.read()
    text = content.decode("utf-8", errors="ignore")

    imported_count = 0
    errors = []
    default_ttl = 300
    origin = zone.name

    for line_num, line in enumerate(text.splitlines(), 1):
        line = line.strip()

        # Skip empty lines and comments
        if not line or line.startswith(";"):
            continue

        # Handle $TTL directive
        if line.upper().startswith("$TTL"):
            try:
                default_ttl = int(line.split()[1])
            except (IndexError, ValueError):
                errors.append(f"Line {line_num}: Invalid $TTL directive")
            continue

        # Handle $ORIGIN directive
        if line.upper().startswith("$ORIGIN"):
            try:
                origin = line.split()[1]
            except IndexError:
                errors.append(f"Line {line_num}: Invalid $ORIGIN directive")
            continue

        # Skip other directives
        if line.startswith("$"):
            continue

        # Parse record line: name [TTL] [class] type value
        try:
            record = parse_bind_record(line, default_ttl, origin)
            if record:
                db_record = DNSRecord(
                    hosted_zone_id=zone.id,
                    name=record["name"],
                    type=record["type"],
                    value=record["value"],
                    ttl=record["ttl"],
                )
                db.add(db_record)
                imported_count += 1
        except Exception as e:
            errors.append(f"Line {line_num}: {str(e)}")

    _update_record_count(zone, db)
    db.commit()

    return ImportResult(imported=imported_count, errors=errors)


def parse_bind_record(line: str, default_ttl: int, origin: str) -> Optional[dict]:
    """Parse a single BIND zone file record line."""
    valid_types = {"A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"}

    parts = line.split()
    if len(parts) < 3:
        return None

    idx = 0
    name = parts[idx]
    idx += 1

    # Check for optional TTL (numeric)
    ttl = default_ttl
    if idx < len(parts) and parts[idx].isdigit():
        ttl = int(parts[idx])
        idx += 1

    # Skip optional class (IN, CH, etc.)
    if idx < len(parts) and parts[idx].upper() in ("IN", "CH", "HS", "ANY"):
        idx += 1

    # Record type
    if idx >= len(parts):
        return None
    record_type = parts[idx].upper()
    idx += 1

    if record_type not in valid_types:
        return None

    # Value is the rest of the line
    value = " ".join(parts[idx:])
    if not value:
        return None

    # Handle @ as origin
    if name == "@":
        name = origin

    return {
        "name": name,
        "type": record_type,
        "value": value,
        "ttl": ttl,
    }
