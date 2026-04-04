"""
Filter dropdown APIs for Asset Register hierarchy.
Country -> State -> City (from cm_branch_tlog)
Division -> Branch (from cm_division_tlog, cm_branch_tlog)
Category (from srm_asset_catg_mast by asset_class)
If USER role: divisions returns only their division; branches returns only their branch.
"""
from flask import request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.blueprints.filters import filters_bp
from app.core.auth_scope import get_current_scope
from app.utils.helpers import db_error_message_and_code
from sqlalchemy import text


def _success(data, message='OK'):
    return jsonify({'success': True, 'data': data, 'message': message}), 200


def _error(msg, code=500):
    return jsonify({'success': False, 'message': msg}), code


def _handle_error(e, prefix='Failed to fetch'):
    msg, code = db_error_message_and_code(e)
    if code == 503:
        return _error(msg, code)
    return _error(f'{prefix}: {msg}', code)


@filters_bp.route('/countries', methods=['GET'])
def get_countries():
    """GET /api/v1/filters/countries - distinct country_code from cm_branch_tlog (country_name if column exists)."""
    try:
        # Use only COUNTRY_CODE; cm_branch_tlog may not have COUNTRY_NAME
        result = db.session.execute(text("""
            SELECT DISTINCT b.COUNTRY_CODE
            FROM cm_branch_tlog b
            WHERE b.COUNTRY_CODE IS NOT NULL
            ORDER BY b.COUNTRY_CODE
        """))
        rows = result.fetchall()
        data = [
            {'countryCode': str(r[0]) if r[0] is not None else '', 'countryName': str(r[0]) if r[0] is not None else ''}
            for r in rows
        ]
        return _success(data)
    except Exception as e:
        return _handle_error(e, 'Failed to fetch countries')


@filters_bp.route('/states', methods=['GET'])
def get_states():
    """GET /api/v1/filters/states?country=IN - distinct state_province_code from cm_branch_tlog."""
    country = (request.args.get('country') or '').strip()
    if not country:
        return _success([])
    try:
        result = db.session.execute(text("""
            SELECT DISTINCT b.STATE_PROVINCE_CODE AS state_province_code
            FROM cm_branch_tlog b
            WHERE b.COUNTRY_CODE = :country
            ORDER BY b.STATE_PROVINCE_CODE
        """), {'country': country})
        rows = result.fetchall()
        data = [{'stateCode': str(r[0]) if r[0] is not None else ''} for r in rows]
        return _success(data)
    except Exception as e:
        return _handle_error(e, 'Failed to fetch states')


@filters_bp.route('/cities', methods=['GET'])
def get_cities():
    """GET /api/v1/filters/cities?country=IN&state=MP - distinct city from cm_branch_tlog."""
    country = (request.args.get('country') or '').strip()
    state = (request.args.get('state') or '').strip()
    if not country:
        return _success([])
    try:
        params = {'country': country}
        sql = """
            SELECT DISTINCT b.CITY AS city
            FROM cm_branch_tlog b
            WHERE b.COUNTRY_CODE = :country
        """
        if state:
            sql += " AND b.STATE_PROVINCE_CODE = :state"
            params['state'] = state
        sql += " ORDER BY b.CITY"
        result = db.session.execute(text(sql), params)
        rows = result.fetchall()
        data = [{'city': str(r[0]) if r[0] is not None else ''} for r in rows]
        return _success(data)
    except Exception as e:
        return _handle_error(e, 'Failed to fetch cities')


@filters_bp.route('/divisions', methods=['GET'])
@jwt_required()
def get_divisions():
    """GET /api/v1/filters/divisions. If USER role, return only their division."""
    company_code = (request.args.get('companyCode') or '').strip()
    try:
        scope = get_current_scope()
        params = {}
        sql = """
            SELECT DISTINCT d.DIVISION_CODE AS division_code, d.DIVISION_NAME AS division_name
            FROM cm_division_tlog d
            WHERE 1=1
        """
        if scope and scope.get('role') == 'USER' and scope.get('emp_div'):
            params['emp_div'] = scope['emp_div']
            sql += " AND d.DIVISION_CODE = :emp_div"
        if company_code:
            params['company_code'] = company_code
            sql += " AND d.COMPANY_CODE = :company_code"
        sql += " ORDER BY d.DIVISION_NAME"
        result = db.session.execute(text(sql), params)
        rows = result.fetchall()
        data = [{'divisionCode': str(r[0]) if r[0] is not None else '', 'divisionName': str(r[1]) if r[1] is not None else ''} for r in rows]
        return _success(data)
    except Exception as e:
        return _handle_error(e, 'Failed to fetch divisions')


@filters_bp.route('/branches', methods=['GET'])
@jwt_required()
def get_branches():
    """GET /api/v1/filters/branches. If USER role, return only their branch."""
    division_code = (request.args.get('divisionCode') or '').strip()
    try:
        scope = get_current_scope()
        params = {}
        sql = """
            SELECT DISTINCT b.BRANCH_CODE AS branch_code, b.BRANCH_NAME AS branch_name, b.CITY AS city
            FROM cm_branch_tlog b
            WHERE 1=1
        """
        if scope and scope.get('role') == 'USER':
            if scope.get('emp_div'):
                params['emp_div'] = scope['emp_div']
                sql += " AND b.DIVISION_CODE = :emp_div"
            if scope.get('emp_branch'):
                params['emp_branch'] = scope['emp_branch']
                sql += " AND b.BRANCH_CODE = :emp_branch"
        if division_code:
            params['division_code'] = division_code
            sql += " AND b.DIVISION_CODE = :division_code"
        sql += " ORDER BY b.BRANCH_NAME, b.CITY"
        result = db.session.execute(text(sql), params)
        rows = result.fetchall()
        data = [{
            'branchCode': str(r[0]) if r[0] is not None else '',
            'branchName': str(r[1]) if r[1] is not None else '',
            'city': str(r[2]) if r[2] is not None else '',
        } for r in rows]
        return _success(data)
    except Exception as e:
        return _handle_error(e, 'Failed to fetch branches')


@filters_bp.route('/categories', methods=['GET'])
def get_categories():
    """GET /api/v1/filters/categories?assetClass=70006 - assets_catg_id, asset_catg_name from srm_asset_catg_mast."""
    asset_class = (request.args.get('assetClass') or '').strip()
    if not asset_class:
        return _success([])
    try:
        result = db.session.execute(text("""
            SELECT DISTINCT c.ASSETS_CATG_ID AS assets_catg_id, c.ASSET_CATG_NAME AS asset_catg_name
            FROM srm_asset_catg_mast c
            WHERE c.ASSETS_CLASS_ID = :asset_class
            ORDER BY c.ASSET_CATG_NAME
        """), {'asset_class': asset_class})
        rows = result.fetchall()
        data = [{'categoryId': str(r[0]) if r[0] is not None else '', 'categoryName': str(r[1]) if r[1] is not None else ''} for r in rows]
        return _success(data)
    except Exception as e:
        return _handle_error(e, 'Failed to fetch categories')
