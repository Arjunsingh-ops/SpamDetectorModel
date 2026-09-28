"""Enterprise Management CLI for Database Seeding, Diagnostics, and Call Simulation."""

import sys
import uuid
from app.core.database import SessionLocal, Base, engine, check_database_connection
from app.core.security import get_password_hash
from app.core.logging import logger
from app.models.user import User
from app.models.phone_number import PhoneNumber
from app.integrations.telephony.simulator import TelephonySimulator


def seed_database():
    """Seed initial enterprise users, DIDs, and call records."""
    logger.info("Initializing enterprise database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Admin User
        admin = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin:
            admin = User(
                id=uuid.uuid4(),
                email="admin@example.com",
                full_name="Enterprise Chief Administrator",
                role="admin",
                is_active=True,
                hashed_password=get_password_hash("admin123"),
            )
            db.add(admin)
            db.flush()
            logger.info(f"Created Admin User: {admin.email}")

        # 2. Receptionist User
        receptionist = db.query(User).filter(User.email == "receptionist@example.com").first()
        if not receptionist:
            receptionist = User(
                id=uuid.uuid4(),
                email="receptionist@example.com",
                full_name="Pooja Sharma",
                role="receptionist",
                is_active=True,
                hashed_password=get_password_hash("reception123"),
            )
            db.add(receptionist)
            db.flush()
            logger.info(f"Created Receptionist User: {receptionist.email}")

        # 3. Primary Virtual Reception Phone Number
        phone = db.query(PhoneNumber).filter(PhoneNumber.phone_number == "+911140001234").first()
        if not phone:
            phone = PhoneNumber(
                id=uuid.uuid4(),
                owner_id=admin.id,
                phone_number="+911140001234",
                label="Cyber City HQ Reception",
                forward_to_number="+919876543210",
                provider="mock",
                is_active=True,
            )
            db.add(phone)
            logger.info(f"Created Phone DID: {phone.phone_number}")

        # 4. Stage 6 Recipients & Directory Seeding
        from app.models.recipient import Recipient, RecipientGroup
        sales_grp = db.query(RecipientGroup).filter(RecipientGroup.name == "Sales").first()
        if not sales_grp:
            sales_grp = RecipientGroup(id=uuid.uuid4(), name="Sales", description="Product sales & enterprise inquiries")
            support_grp = RecipientGroup(id=uuid.uuid4(), name="Support", description="Technical support & billing issues")
            db.add_all([sales_grp, support_grp])
            db.flush()

        r1 = db.query(Recipient).filter(Recipient.phone_number == "+919876543210").first()
        if not r1:
            r1 = Recipient(
                id=uuid.uuid4(),
                display_name="Vikram Mehta",
                department="Sales",
                role_title="Enterprise Sales Director",
                phone_number="+919876543210",
                availability_status="available",
                routing_priority=1,
                is_active=True,
            )
            r2 = Recipient(
                id=uuid.uuid4(),
                display_name="Ananya Rao",
                department="Support",
                role_title="Head of Customer Success",
                phone_number="+919811122233",
                availability_status="available",
                routing_priority=1,
                is_active=True,
            )
            r3 = Recipient(
                id=uuid.uuid4(),
                display_name="Rajesh Verma",
                department="Executive",
                role_title="VP Operations",
                phone_number="+919999988888",
                availability_status="away",
                routing_priority=1,
                backup_recipient_id=r1.id,
                is_active=True,
            )
            db.add_all([r1, r2, r3])
            logger.info("Seeded Stage 6 Recipient Directory (Vikram Mehta, Ananya Rao, Rajesh Verma)")

        db.commit()
        logger.info("Enterprise database successfully seeded!")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


def simulate_call():
    """Run local telephony call simulation."""
    res = TelephonySimulator.run_simulation()
    print("=" * 60)
    print("TELEPHONY CALL LIFECYCLE SIMULATION RESULTS")
    print("=" * 60)
    print(f"Success: {res.get('success')}")
    print(f"Call ID: {res.get('call_id')}")
    print(f"Provider Call SID: {res.get('provider_call_id')}")
    print(f"Final Status: {res.get('final_status')}")
    print(f"Duration: {res.get('duration_seconds')}s")
    print("=" * 60)


def check_system():
    """Run interactive diagnostic check."""
    is_connected, latency, dialect = check_database_connection()
    print("=" * 60)
    print("AI CALL AGENT - ENTERPRISE DIAGNOSTIC REPORT")
    print("=" * 60)
    print(f"Database Status: {'CONNECTED' if is_connected else 'DISCONNECTED'}")
    print(f"Dialect: {dialect}")
    print(f"Latency: {latency} ms")
    print("=" * 60)


def run_spam_evaluation():
    """Run synthetic evaluation benchmark for Stage 5 spam classification engine."""
    from app.spam.evaluation.metrics import SpamEvaluator
    evaluator = SpamEvaluator()
    results = evaluator.evaluate()
    
    print("=" * 60)
    print("STAGE 5 SPAM DETECTION & SCREENING EVALUATION BENCHMARK")
    print("=" * 60)
    print(f"Total Evaluated Samples: {results.get('total_samples')}")
    print(f"Precision:              {results.get('precision', 0) * 100:.2f}%")
    print(f"Recall:                 {results.get('recall', 0) * 100:.2f}%")
    print(f"F1-Score:               {results.get('f1_score', 0) * 100:.2f}%")
    print(f"False Positive Rate:    {results.get('false_positive_rate', 0) * 100:.2f}%")
    print(f"False Negative Rate:    {results.get('false_negative_rate', 0) * 100:.2f}%")
    print(f"Avg Processing Latency: {results.get('average_latency_ms', 0):.2f} ms")
    print("-" * 60)
    print("CONFUSION MATRIX:")
    print(f"  {results.get('confusion_matrix')}")
    print("-" * 60)
    print("LATENCY BY LANGUAGE:")
    for lang, lat in results.get("latency_by_language_ms", {}).items():
        print(f"  - {lang}: {lat:.2f} ms")
    print("=" * 60)


if __name__ == "__main__":
    command = sys.argv[1] if len(sys.argv) > 1 else "check"
    if command == "seed":
        seed_database()
    elif command == "simulate-call":
        simulate_call()
    elif command == "evaluate-spam":
        run_spam_evaluation()
    else:
        check_system()

