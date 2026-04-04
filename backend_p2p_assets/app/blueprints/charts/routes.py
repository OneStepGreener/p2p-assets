"""
Chart drill-down API: services (Level 1), categories (Level 2), subcategories (Level 3).
All endpoints JWT-protected; role scope applied (USER = restrict to emp_div, emp_branch, emp_region).
"""
from flask import request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.blueprints.charts import charts_bp
from app.core.auth_scope import get_current_scope
from app.blueprints.charts.queries import get_services, get_categories, get_subcategories
from app.utils.helpers import db_error_message_and_code


def _success(data, message="OK"):
    return jsonify({"success": True, "data": data, "message": message}), 200


def _error(msg, code=500):
    return jsonify({"success": False, "message": msg}), code


def _handle_error(e, prefix="Chart"):
    msg, code = db_error_message_and_code(e)
    if code == 503:
        return _error(msg, code)
    return _error(f"{prefix}: {msg}", code)


@charts_bp.route("/services", methods=["GET"])
@jwt_required()
def chart_services():
    """
    GET /api/v1/charts/services?topN=20
    Returns [{ serviceCode, serviceDesc, assetCount }].
    TopN=0 means return all; default 20 + Others.
    """
    try:
        scope = get_current_scope()
        top_n = request.args.get("topN", type=int)
        if top_n is None:
            top_n = 20
        items = get_services(db.session, scope, top_n=top_n)
        return _success(items)
    except Exception as e:
        return _handle_error(e, "Services")


@charts_bp.route("/categories", methods=["GET"])
@jwt_required()
def chart_categories():
    """
    GET /api/v1/charts/categories?serviceCode=70002&topN=10
    Returns [{ categoryId, categoryName, assetCount }]. Top 10 + Others.
    """
    try:
        service_code = (request.args.get("serviceCode") or "").strip()
        if not service_code:
            return _error("serviceCode is required", 400)
        scope = get_current_scope()
        top_n = request.args.get("topN", type=int)
        if top_n is None:
            top_n = 10
        items = get_categories(db.session, scope, service_code, top_n=top_n)
        return _success(items)
    except Exception as e:
        return _handle_error(e, "Categories")


@charts_bp.route("/subcategories", methods=["GET"])
@jwt_required()
def chart_subcategories():
    """
    GET /api/v1/charts/subcategories?serviceCode=70002&categoryId=A0002&topN=15
    Returns [{ subCategoryId, subCategoryName, assetCount }]. Top 15 + Others.
    """
    try:
        service_code = (request.args.get("serviceCode") or "").strip()
        category_id = (request.args.get("categoryId") or "").strip()
        if not service_code:
            return _error("serviceCode is required", 400)
        if not category_id:
            return _error("categoryId is required", 400)
        scope = get_current_scope()
        top_n = request.args.get("topN", type=int)
        if top_n is None:
            top_n = 15
        items = get_subcategories(db.session, scope, service_code, category_id, top_n=top_n)
        return _success(items)
    except Exception as e:
        return _handle_error(e, "Subcategories")
