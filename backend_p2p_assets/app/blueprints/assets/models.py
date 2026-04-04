from datetime import datetime
from app.extensions import db


class SRMAsset(db.Model):
    """SRM Assets table model"""
    __tablename__ = 'srm_assets'
    
    # Note: Adjust column names based on your actual table schema
    # These are common column names - update as needed
    id = db.Column(db.String(50), primary_key=True)
    # Add other columns based on your actual table structure
    # Example common columns:
    # name = db.Column(db.String(255))
    # status = db.Column(db.String(50))
    # created_at = db.Column(db.DateTime)
    
    def __repr__(self):
        return f'<SRMAsset {self.id}>'
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            # Add other fields as needed
        }
