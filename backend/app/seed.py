from sqlalchemy.orm import Session
from .models import User, HostedZone, DNSRecord, generate_zone_id
from .auth import hash_password


def seed_database(db: Session) -> None:
    """Seed the database with a default admin user and sample hosted zones with records."""
    # Check if data already exists
    if db.query(User).first() is not None:
        return

    # ─── Create admin user ──────────────────────────────────────────────
    admin = User(
        username="admin",
        password_hash=hash_password("admin123"),
        email="admin@aws-route53.local",
        account_id="123456789012",
    )
    db.add(admin)
    db.flush()

    # ─── Hosted Zone 1: example.com ─────────────────────────────────────
    zone1 = HostedZone(
        zone_id=generate_zone_id(),
        name="example.com.",
        type="Public",
        description="Primary domain for example.com",
        comment="Production domain",
    )
    db.add(zone1)
    db.flush()

    zone1_records = [
        DNSRecord(hosted_zone_id=zone1.id, name="example.com.", type="NS", value="ns-1234.awsdns-01.org.\nns-5678.awsdns-02.co.uk.\nns-9012.awsdns-03.net.\nns-3456.awsdns-04.com.", ttl=172800),
        DNSRecord(hosted_zone_id=zone1.id, name="example.com.", type="SOA", value="ns-1234.awsdns-01.org. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400", ttl=900),
        DNSRecord(hosted_zone_id=zone1.id, name="example.com.", type="A", value="192.0.2.1", ttl=300),
        DNSRecord(hosted_zone_id=zone1.id, name="www.example.com.", type="CNAME", value="example.com.", ttl=300),
        DNSRecord(hosted_zone_id=zone1.id, name="example.com.", type="MX", value="10 mail.example.com.\n20 mail2.example.com.", ttl=300),
        DNSRecord(hosted_zone_id=zone1.id, name="example.com.", type="TXT", value='"v=spf1 include:_spf.google.com ~all"', ttl=300),
        DNSRecord(hosted_zone_id=zone1.id, name="example.com.", type="AAAA", value="2001:0db8:85a3:0000:0000:8a2e:0370:7334", ttl=300),
        DNSRecord(hosted_zone_id=zone1.id, name="mail.example.com.", type="A", value="192.0.2.10", ttl=300),
        DNSRecord(hosted_zone_id=zone1.id, name="_dmarc.example.com.", type="TXT", value='"v=DMARC1; p=reject; rua=mailto:dmarc@example.com"', ttl=300),
    ]
    db.add_all(zone1_records)
    zone1.record_count = len(zone1_records)

    # ─── Hosted Zone 2: myapp.io ────────────────────────────────────────
    zone2 = HostedZone(
        zone_id=generate_zone_id(),
        name="myapp.io.",
        type="Public",
        description="Application domain",
        comment="Staging and production",
    )
    db.add(zone2)
    db.flush()

    zone2_records = [
        DNSRecord(hosted_zone_id=zone2.id, name="myapp.io.", type="NS", value="ns-111.awsdns-11.com.\nns-222.awsdns-22.net.\nns-333.awsdns-33.org.\nns-444.awsdns-44.co.uk.", ttl=172800),
        DNSRecord(hosted_zone_id=zone2.id, name="myapp.io.", type="SOA", value="ns-111.awsdns-11.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400", ttl=900),
        DNSRecord(hosted_zone_id=zone2.id, name="myapp.io.", type="A", value="203.0.113.50", ttl=60),
        DNSRecord(hosted_zone_id=zone2.id, name="api.myapp.io.", type="A", value="203.0.113.51", ttl=60),
        DNSRecord(hosted_zone_id=zone2.id, name="staging.myapp.io.", type="CNAME", value="myapp-staging.herokuapp.com.", ttl=300),
        DNSRecord(hosted_zone_id=zone2.id, name="myapp.io.", type="CAA", value='0 issue "letsencrypt.org"', ttl=300),
    ]
    db.add_all(zone2_records)
    zone2.record_count = len(zone2_records)

    # ─── Hosted Zone 3: internal.corp (Private) ────────────────────────
    zone3 = HostedZone(
        zone_id=generate_zone_id(),
        name="internal.corp.",
        type="Private",
        description="Internal corporate DNS",
        comment="VPC: vpc-abc123",
    )
    db.add(zone3)
    db.flush()

    zone3_records = [
        DNSRecord(hosted_zone_id=zone3.id, name="internal.corp.", type="NS", value="ns-512.awsdns-00.net.\nns-1024.awsdns-00.org.", ttl=172800),
        DNSRecord(hosted_zone_id=zone3.id, name="internal.corp.", type="SOA", value="ns-512.awsdns-00.net. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400", ttl=900),
        DNSRecord(hosted_zone_id=zone3.id, name="db.internal.corp.", type="A", value="10.0.1.50", ttl=60),
        DNSRecord(hosted_zone_id=zone3.id, name="cache.internal.corp.", type="A", value="10.0.1.51", ttl=60),
        DNSRecord(hosted_zone_id=zone3.id, name="app.internal.corp.", type="A", value="10.0.2.10", ttl=60),
        DNSRecord(hosted_zone_id=zone3.id, name="_sip._tcp.internal.corp.", type="SRV", value="10 60 5060 sipserver.internal.corp.", ttl=300),
    ]
    db.add_all(zone3_records)
    zone3.record_count = len(zone3_records)

    db.commit()
    print("Database seeded successfully with admin user and 3 hosted zones.")
