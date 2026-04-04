"""
Allocation routes - API endpoints for asset transfers from SRM_ASSET_TRANSFERS.
"""
from flask import request, jsonify
from flask_restx import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.blueprints.allocations import allocations_bp, allocations_ns
from app.blueprints.allocations.services import AllocationService
from app.utils.helpers import build_response


def _transfer_params():
    """Parse query params for asset transfers."""
    return {
        'search': request.args.get('search', '').strip() or None,
        'status': request.args.get('status', '').strip() or None,
        'fromDate': request.args.get('fromDate', '').strip() or None,
        'toDate': request.args.get('toDate', '').strip() or None,
        'page': request.args.get('page', '1'),
        'pageSize': request.args.get('pageSize', '20'),
    }


@allocations_ns.route('')
@allocations_ns.doc('get_asset_transfers')
class AssetTransfersList(Resource):
    """GET /api/v1/allocations - Asset transfers list with pagination."""

    @jwt_required()
    def get(self):
        """Get paginated asset transfers from SRM_ASSET_TRANSFERS."""
        try:
            params = _transfer_params()
            result = AllocationService.get_asset_transfers(params)
            resp = build_response(
                data=result['data'],
                message='Asset transfers retrieved successfully',
                status_code=200
            )
            resp['page'] = result['page']
            resp['pageSize'] = result['pageSize']
            resp['totalRows'] = result['totalRows']
            return resp, 200
        except Exception as e:
            return build_response(
                message=f'Failed to retrieve asset transfers: {str(e)}',
                status_code=500
            ), 500


@allocations_ns.route('/count')
@allocations_ns.doc('get_transfer_count')
class TransferCount(Resource):
    """Get count of asset transfers."""

    @jwt_required()
    def get(self):
        """Get asset transfer count."""
        try:
            params = _transfer_params()
            count = AllocationService.get_transfer_count(params)
            return build_response(
                data={'count': count},
                message='Transfer count retrieved successfully',
                status_code=200
            ), 200
        except Exception as e:
            return build_response(
                message=f'Failed to retrieve transfer count: {str(e)}',
                status_code=500
            ), 500


@allocations_ns.route('/<string:transfer_id>')
@allocations_ns.doc('get_transfer_by_id')
class TransferById(Resource):
    """Get a single transfer by ID."""

    @jwt_required()
    def get(self, transfer_id):
        """Get transfer details by ID."""
        try:
            transfer = AllocationService.get_transfer_by_id(transfer_id)
            if not transfer:
                return build_response(
                    message='Transfer not found',
                    status_code=404
                ), 404
            return build_response(
                data=transfer,
                message='Transfer retrieved successfully',
                status_code=200
            ), 200
        except Exception as e:
            return build_response(
                message=f'Failed to retrieve transfer: {str(e)}',
                status_code=500
            ), 500


@allocations_ns.route('/movements/<string:asset_tag_id>')
@allocations_ns.doc('get_asset_movements')
class AssetMovements(Resource):
    """Get movement history for a specific asset."""

    @jwt_required()
    def get(self, asset_tag_id):
        """Get all transfers for a specific asset."""
        try:
            movements = AllocationService.get_asset_movement_history(asset_tag_id)
            return build_response(
                data=movements,
                message='Asset movements retrieved successfully',
                status_code=200
            ), 200
        except Exception as e:
            return build_response(
                message=f'Failed to retrieve asset movements: {str(e)}',
                status_code=500
            ), 500


@allocations_ns.route('/<string:transfer_id>/approve')
@allocations_ns.doc('approve_transfer')
class ApproveTransfer(Resource):
    """Approve a transfer (set APPROVED_BY)."""

    @jwt_required()
    def post(self, transfer_id):
        try:
            current_user = get_jwt_identity() or ''
            transfer = AllocationService.approve_transfer(transfer_id, current_user)
            return build_response(
                data=transfer,
                message='Transfer approved successfully',
                status_code=200
            ), 200
        except Exception as e:
            return build_response(
                message=f'Failed to approve transfer: {str(e)}',
                status_code=500
            ), 500


# Blueprint routes (alternative to namespace)
@allocations_bp.route('', methods=['GET'])
@jwt_required()
def get_asset_transfers():
    """Get paginated asset transfers."""
    try:
        params = _transfer_params()
        result = AllocationService.get_asset_transfers(params)
        return jsonify({
            'success': True,
            'data': result['data'],
            'page': result['page'],
            'pageSize': result['pageSize'],
            'totalRows': result['totalRows'],
            'message': 'Asset transfers retrieved successfully'
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to retrieve asset transfers: {str(e)}'
        }), 500


@allocations_bp.route('/count', methods=['GET'])
@jwt_required()
def get_transfer_count():
    """Get asset transfer count."""
    try:
        params = _transfer_params()
        count = AllocationService.get_transfer_count(params)
        return jsonify({
            'success': True,
            'data': {'count': count},
            'message': 'Transfer count retrieved successfully'
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to retrieve transfer count: {str(e)}'
        }), 500


@allocations_bp.route('/movements/<string:asset_tag_id>', methods=['GET'])
@jwt_required()
def get_asset_movements(asset_tag_id):
    """Get movement history for a specific asset."""
    try:
        movements = AllocationService.get_asset_movement_history(asset_tag_id)
        return jsonify({
            'success': True,
            'data': movements,
            'message': 'Asset movements retrieved successfully'
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to retrieve asset movements: {str(e)}'
        }), 500


@allocations_bp.route('/<string:transfer_id>/approve', methods=['POST'])
@jwt_required()
def approve_transfer(transfer_id):
    """Approve a transfer (set APPROVED_BY)."""
    try:
        current_user = get_jwt_identity() or ''
        transfer = AllocationService.approve_transfer(transfer_id, current_user)
        return jsonify({
            'success': True,
            'data': transfer,
            'message': 'Transfer approved successfully'
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to approve transfer: {str(e)}'
        }), 500
