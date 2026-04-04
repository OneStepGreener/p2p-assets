from app.extensions import db
from contextlib import contextmanager


@contextmanager
def get_db_session():
    """Context manager for database session"""
    try:
        yield db.session
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    finally:
        db.session.close()


def init_db():
    """Initialize database tables"""
    db.create_all()


def drop_db():
    """Drop all database tables"""
    db.drop_all()
