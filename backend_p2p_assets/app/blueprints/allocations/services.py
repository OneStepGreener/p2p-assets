"""
Allocation service for business logic.
"""
from app.extensions import db
from app.blueprints.allocations import queries as allocation_queries


class AllocationService:
    """Allocation service for asset transfers."""

    @staticmethod
    def get_asset_transfers(params):
        """Get paginated asset transfers from SRM_ASSET_TRANSFERS."""
        try:
            rows, total_rows = allocation_queries.get_asset_transfers_page(db.session, params)
            page = max(1, int(params.get('page') or 1))
            page_size = max(1, min(100, int(params.get('pageSize') or 20)))
            return {
                'data': rows,
                'page': page,
                'pageSize': page_size,
                'totalRows': total_rows,
            }
        except Exception as e:
            print(f"Error getting asset transfers: {str(e)}")
            raise

    @staticmethod
    def get_transfer_count(params=None):
        """Get count of asset transfers."""
        try:
            return allocation_queries.get_transfer_count(db.session, params)
        except Exception as e:
            print(f"Error getting transfer count: {str(e)}")
            return 0

    @staticmethod
    def get_transfer_by_id(transfer_id):
        """Get a single transfer by ID."""
        try:
            return allocation_queries.get_transfer_by_id(db.session, transfer_id)
        except Exception as e:
            print(f"Error getting transfer by ID: {str(e)}")
            return None

    @staticmethod
    def get_asset_movement_history(asset_tag_id):
        """Get movement history for a specific asset."""
        try:
            return allocation_queries.get_transfers_by_asset(db.session, asset_tag_id)
        except Exception as e:
            print(f"Error getting asset movement history: {str(e)}")
            return []

    @staticmethod
    def approve_transfer(transfer_id, approved_by):
        """Approve a single transfer by setting APPROVED_BY and audit fields."""
        try:
            allocation_queries.approve_transfer(db.session, transfer_id, approved_by)
            db.session.commit()
            return allocation_queries.get_transfer_by_id(db.session, transfer_id)
        except Exception as e:
            db.session.rollback()
            print(f"Error approving transfer: {str(e)}")
            raise
