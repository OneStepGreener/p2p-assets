"""
Chart drill-down queries: real counts from srm_assets (COUNT(*)).
Scope: if role != ADMIN, restrict to a.div_code, a.branch_code, a.region_code from JWT.
Joins: cm_srm_service_type (service_desc), srm_asset_catg_mast (category name), srm_asset_subcatg_mast (subcategory name).
Fallbacks: NULL asset_group => Uncategorized/UNCAT; NULL asset_subgroup => Uncategorized/UNCAT.
"""
from sqlalchemy import text
from sqlalchemy.orm import Session


def _scope_conditions(scope):
    """Return (sql_fragment, bind_dict) for role-based filter. Empty if ADMIN or no scope."""
    if not scope or scope.get("role") == "ADMIN":
        return "", {}
    return (
        " AND a.DIV_CODE = :emp_div AND a.BRANCH_CODE = :emp_branch AND a.REGION_CODE = :emp_region",
        {
            "emp_div": scope.get("emp_div") or "",
            "emp_branch": scope.get("emp_branch") or "",
            "emp_region": scope.get("emp_region") or "",
        },
    )


def get_services(session: Session, scope, top_n=20):
    """
    Level 1: service_code, service_desc, assetCount from srm_assets.
    Optional: top_n (e.g. 20) + Others; 0 = return all.
    """
    scope_sql, scope_bind = _scope_conditions(scope)
    bind = dict(scope_bind)

    # Base aggregate: all services with counts from srm_assets
    base_sql = f"""
        SELECT
            a.ASSET_CLASS AS service_code,
            NVL(s.SERVICE_DESC, 'Unknown') AS service_desc,
            COUNT(*) AS asset_count
        FROM srm_assets a
        LEFT JOIN cm_srm_service_type s ON s.SERVICE_CODE = a.ASSET_CLASS
        WHERE 1=1
        {scope_sql}
        GROUP BY a.ASSET_CLASS, s.SERVICE_DESC
        ORDER BY asset_count DESC, service_desc
    """
    result = session.execute(text(base_sql), bind)
    rows = result.fetchall()
    items = [
        {"serviceCode": str(r[0]) if r[0] is not None else "", "serviceDesc": (r[1] or "Unknown"), "assetCount": int(r[2] or 0)}
        for r in rows
    ]
    if top_n > 0 and len(items) > top_n:
        top_items = items[:top_n]
        others_count = sum(i["assetCount"] for i in items[top_n:])
        if others_count > 0:
            top_items.append({"serviceCode": "__OTHERS__", "serviceDesc": "Others", "assetCount": others_count})
        return top_items
    return items


def get_categories(session: Session, scope, service_code: str, top_n=10):
    """
    Level 2: categoryId, categoryName, assetCount for given serviceCode.
    Fallback: NULL asset_group => categoryName='Uncategorized', categoryId='UNCAT'.
    TopN + Others applied in Python.
    """
    scope_sql, scope_bind = _scope_conditions(scope)
    bind = dict(scope_bind)
    bind["service_code"] = service_code.strip()

    sql = text(f"""
        SELECT
            NVL(a.ASSET_GROUP, 'UNCAT') AS category_id,
            NVL(c.ASSET_CATG_NAME, 'Uncategorized') AS category_name,
            COUNT(*) AS asset_count
        FROM srm_assets a
        LEFT JOIN srm_asset_catg_mast c
            ON c.ASSETS_CLASS_ID = a.ASSET_CLASS AND c.ASSETS_CATG_ID = a.ASSET_GROUP
        WHERE a.ASSET_CLASS = :service_code
        {scope_sql}
        GROUP BY a.ASSET_GROUP, c.ASSET_CATG_NAME
        ORDER BY asset_count DESC, category_name
    """)
    result = session.execute(sql, bind)
    rows = result.fetchall()
    items = [
        {"categoryId": str(r[0]) if r[0] is not None else "UNCAT", "categoryName": (r[1] or "Uncategorized"), "assetCount": int(r[2] or 0)}
        for r in rows
    ]
    if top_n > 0 and len(items) > top_n:
        top_items = items[:top_n]
        others_count = sum(i["assetCount"] for i in items[top_n:])
        if others_count > 0:
            top_items.append({"categoryId": "__OTHERS__", "categoryName": "Others", "assetCount": others_count})
        return top_items
    return items


def get_subcategories(session: Session, scope, service_code: str, category_id: str, top_n=15):
    """
    Level 3: subCategoryId, subCategoryName, assetCount for given serviceCode + categoryId.
    Fallback: NULL asset_subgroup => 'Uncategorized' / 'UNCAT'.
    TopN + Others.
    """
    scope_sql, scope_bind = _scope_conditions(scope)
    bind = dict(scope_bind)
    bind["service_code"] = service_code.strip()
    bind["category_id"] = category_id.strip()

    # When category_id is __OTHERS__, we cannot filter by single category; return empty or aggregate all "others" rows.
    # Per spec we filter by a.asset_group = :category_id, so __OTHERS__ would match no rows. Return [].
    if category_id == "__OTHERS__":
        return []

    sql = text(f"""
        SELECT
            NVL(a.ASSET_SUBGROUP, 'UNCAT') AS sub_category_id,
            NVL(sc.ASSET_SUBCATG_NAME, 'Uncategorized') AS sub_category_name,
            COUNT(*) AS asset_count
        FROM srm_assets a
        LEFT JOIN srm_asset_subcatg_mast sc
            ON sc.ASSETS_CLASS_ID = a.ASSET_CLASS
            AND sc.ASSETS_CATG_ID = a.ASSET_GROUP
            AND sc.ASSET_SUBCATG_ID = a.ASSET_SUBGROUP
        WHERE a.ASSET_CLASS = :service_code AND a.ASSET_GROUP = :category_id
        {scope_sql}
        GROUP BY a.ASSET_SUBGROUP, sc.ASSET_SUBCATG_NAME
        ORDER BY asset_count DESC, sub_category_name
    """)
    result = session.execute(sql, bind)
    rows = result.fetchall()
    items = [
        {"subCategoryId": str(r[0]) if r[0] is not None else "UNCAT", "subCategoryName": (r[1] or "Uncategorized"), "assetCount": int(r[2] or 0)}
        for r in rows
    ]
    if top_n > 0 and len(items) > top_n:
        top_items = items[:top_n]
        others_count = sum(i["assetCount"] for i in items[top_n:])
        if others_count > 0:
            top_items.append({"subCategoryId": "__OTHERS__", "subCategoryName": "Others", "assetCount": others_count})
        return top_items
    return items
