from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse, PlainTextResponse
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..models import User, HostedZone, DNSRecord, generate_zone_id
from ..schemas import (
    HostedZoneCreate, HostedZoneUpdate, HostedZoneResponse,
    HostedZoneListResponse, MessageResponse,
)
from ..auth import get_current_user

router = APIRouter(prefix="/api/hosted-zones", tags=["Hosted Zones"])


@router.get("", response_model=HostedZoneListResponse)
def list_hosted_zones(
    search: Optional[str] = Query(None, description="Search by zone name"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    type_filter: Optional[str] = Query(None, description="Filter by type: Public or Private"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all hosted zones with search, pagination, and type filter."""
    query = db.query(HostedZone)

    if search:
        query = query.filter(HostedZone.name.ilike(f"%{search}%"))

    if type_filter and type_filter in ("Public", "Private"):
        query = query.filter(HostedZone.type == type_filter)

    total = query.count()
    zones = query.order_by(HostedZone.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return HostedZoneListResponse(
        hosted_zones=[HostedZoneResponse.model_validate(z) for z in zones],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{zone_id}", response_model=HostedZoneResponse)
def get_hosted_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single hosted zone by zone_id."""
    zone = db.query(HostedZone).filter(HostedZone.zone_id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hosted zone not found")
    return zone


@router.post("", response_model=HostedZoneResponse, status_code=status.HTTP_201_CREATED)
def create_hosted_zone(
    zone_data: HostedZoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new hosted zone with default NS and SOA records."""
    # Ensure domain name ends with dot
    domain_name = zone_data.name if zone_data.name.endswith(".") else zone_data.name + "."

    zone = HostedZone(
        zone_id=generate_zone_id(),
        name=domain_name,
        type=zone_data.type,
        description=zone_data.description,
        comment=zone_data.comment,
    )
    db.add(zone)
    db.flush()

    # Create default NS record
    ns_record = DNSRecord(
        hosted_zone_id=zone.id,
        name=domain_name,
        type="NS",
        value="ns-001.awsdns-01.com.\nns-002.awsdns-02.net.\nns-003.awsdns-03.org.\nns-004.awsdns-04.co.uk.",
        ttl=172800,
    )
    db.add(ns_record)

    # Create default SOA record
    soa_record = DNSRecord(
        hosted_zone_id=zone.id,
        name=domain_name,
        type="SOA",
        value=f"ns-001.awsdns-01.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400",
        ttl=900,
    )
    db.add(soa_record)

    zone.record_count = 2
    db.commit()
    db.refresh(zone)
    return zone


@router.put("/{zone_id}", response_model=HostedZoneResponse)
def update_hosted_zone(
    zone_id: str,
    zone_data: HostedZoneUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a hosted zone's description and comment."""
    zone = db.query(HostedZone).filter(HostedZone.zone_id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hosted zone not found")

    if zone_data.description is not None:
        zone.description = zone_data.description
    if zone_data.comment is not None:
        zone.comment = zone_data.comment

    db.commit()
    db.refresh(zone)
    return zone


@router.delete("/{zone_id}", response_model=MessageResponse)
def delete_hosted_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a hosted zone and all its records."""
    zone = db.query(HostedZone).filter(HostedZone.zone_id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hosted zone not found")

    db.delete(zone)
    db.commit()
    return MessageResponse(message=f"Hosted zone {zone_id} deleted successfully")


@router.get("/{zone_id}/export")
def export_hosted_zone(
    zone_id: str,
    format: str = Query("json", description="Export format: json or bind"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export a hosted zone and its records in JSON or BIND format."""
    zone = db.query(HostedZone).filter(HostedZone.zone_id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hosted zone not found")

    records = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone.id).all()

    if format == "bind":
        bind_output = generate_bind_zone(zone, records)
        return PlainTextResponse(
            content=bind_output,
            media_type="text/plain",
            headers={"Content-Disposition": f'attachment; filename="{zone.name}zone"'},
        )
    else:
        export_data = {
            "zone_id": zone.zone_id,
            "name": zone.name,
            "type": zone.type,
            "description": zone.description,
            "comment": zone.comment,
            "records": [
                {
                    "name": r.name,
                    "type": r.type,
                    "value": r.value,
                    "ttl": r.ttl,
                    "routing_policy": r.routing_policy,
                    "alias": r.alias,
                }
                for r in records
            ],
        }
        return JSONResponse(
            content=export_data,
            headers={"Content-Disposition": f'attachment; filename="{zone.name}json"'},
        )


def generate_bind_zone(zone: HostedZone, records: list) -> str:
    """Generate a BIND-format zone file from a hosted zone and its records."""
    lines = [
        f"; BIND zone file for {zone.name}",
        f"; Exported from Route53 Clone",
        f"",
        f"$ORIGIN {zone.name}",
        f"$TTL 300",
        f"",
    ]
    for record in records:
        values = record.value.split("\n")
        for value in values:
            value = value.strip()
            if value:
                lines.append(f"{record.name}\t{record.ttl}\tIN\t{record.type}\t{value}")

    return "\n".join(lines) + "\n"
