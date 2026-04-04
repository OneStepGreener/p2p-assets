"""
Asset Register queries - srm_assets as single source of truth.
Category/subcategory from srm_assets.ASSET_GROUP_DESC / ASSET_SUBGROUP_DESC.
Label joins only for division name (DEPT_NAME) and branch/location (LOCATION_NAME).
All SQL uses bind variables; ROW_NUMBER() pagination.
Oracle returns numeric columns as Decimal; we convert to float for JSON.
"""
from datetime import datetime
from decimal import Decimal
from sqlalchemy import text

try:
    from app.config import Config
except ImportError:
    Config = None

# Allowed sort columns (whitelist to avoid SQL injection)
SORT_COLUMNS = {
    'asset_tag_id', 'item_name', 'asset_creation_date', 'asset_total_cost',
    'asset_cost', 'put_to_use_date', 'asset_status', 'company_code',
    'div_code', 'region_code', 'acntr_code', 'branch_code', 'asset_class', 'asset_group',
    'asset_subgroup', 'supplier_code', 'po_no', 'inv_no', 'grn_no',
}
# API sortBy -> Oracle column name
SORT_BY_MAP = {
    'assetid': 'asset_tag_id',
    'assetname': 'item_name',
    'acquisitiondate': 'asset_creation_date',
    'cost': 'asset_total_cost',
    'status': 'asset_status',
}


def _val_text(v):
    if v is None or (isinstance(v, str) and v.strip() == ''):
        return '-'
    if isinstance(v, datetime):
        return v.strftime('%Y-%m-%d')
    return str(v)


def _val_num(v):
    if v is None:
        return 0
    if isinstance(v, Decimal):
        return float(v)
    try:
        return float(v)
    except (TypeError, ValueError):
        return 0


def _to_json_safe(v):
    """Convert a value to a JSON-serializable type (Oracle Decimal, datetime, etc.)."""
    if v is None:
        return None
    if isinstance(v, Decimal):
        return float(v)
    if isinstance(v, datetime):
        return v.strftime('%Y-%m-%d')
    return v


def _build_where_and_params(params):
    """Build WHERE clause fragments and param dict. Only add conditions when param is present.
    Location filters (country, state, city) require join to cm_branch_tlog br - caller must include it.
    If params has 'scope' with role=USER, restrict to emp_div, emp_branch, emp_region."""
    conditions = ["1=1"]
    bind = {}

    scope = params.get("scope")
    if scope and scope.get("role") == "USER":
        bind["emp_div"] = scope.get("emp_div") or ""
        bind["emp_branch"] = scope.get("emp_branch") or ""
        bind["emp_region"] = scope.get("emp_region") or ""
        conditions.append("a.DIV_CODE = :emp_div AND a.BRANCH_CODE = :emp_branch AND a.REGION_CODE = :emp_region")

    if params.get('search'):
        bind['search_pat'] = '%' + str(params['search']).strip() + '%'
        conditions.append(
            "(a.ASSET_TAG_ID LIKE :search_pat OR a.ITEM_NAME LIKE :search_pat "
            "OR a.SUPPLIER_CODE LIKE :search_pat OR a.PO_NO LIKE :search_pat "
            "OR a.INV_NO LIKE :search_pat OR a.GRN_NO LIKE :search_pat)"
        )
    if params.get('companyCode'):
        bind['company_code'] = str(params['companyCode']).strip()
        conditions.append("a.COMPANY_CODE = :company_code")
    if params.get('country'):
        bind['country'] = str(params['country']).strip()
        conditions.append("br.COUNTRY_CODE = :country")
    if params.get('state'):
        bind['state'] = str(params['state']).strip()
        conditions.append("br.STATE_PROVINCE_CODE = :state")
    if params.get('city'):
        bind['city'] = str(params['city']).strip()
        conditions.append("br.CITY = :city")
    if params.get('divCode') or params.get('divisionCode'):
        code = (params.get('divisionCode') or params.get('divCode') or '').strip()
        if code:
            bind['div_code'] = code
            conditions.append("a.DIV_CODE = :div_code")
    if params.get('regionCode'):
        bind['region_code'] = str(params['regionCode']).strip()
        conditions.append("a.REGION_CODE = :region_code")
    if params.get('branchCode'):
        bind['branch_code'] = str(params['branchCode']).strip()
        conditions.append("a.BRANCH_CODE = :branch_code")
    if params.get('serviceCode'):
        bind['service_code'] = str(params['serviceCode']).strip()
        conditions.append("a.ASSET_CLASS = :service_code")
    if params.get('categoryId'):
        bind['category_id'] = str(params['categoryId']).strip()
        conditions.append("a.ASSET_GROUP = :category_id")
    if params.get('subcategoryId'):
        bind['subcategory_id'] = str(params['subcategoryId']).strip()
        conditions.append("a.ASSET_SUBGROUP = :subcategory_id")
    if params.get('status'):
        status_val = str(params['status']).strip()
        if status_val.upper() == 'ACTIVE':
            # Show all active assets: match config ASSET_STATUS_ACTIVE_VALUES ('1', 'ACTIVE') plus 'Active'
            active_values = getattr(Config, 'ASSET_STATUS_ACTIVE_VALUES', ['1', 'ACTIVE']) if Config else ['1', 'ACTIVE']
            active_values = [v.strip() for v in active_values if v and v.strip()]
            if 'Active' not in active_values:
                active_values.append('Active')
            placeholders = []
            for idx, val in enumerate(active_values):
                key = f"active_status_{idx}"
                bind[key] = val
                placeholders.append(f":{key}")
            conditions.append(f"a.ASSET_STATUS IN ({', '.join(placeholders)})")
        else:
            bind['asset_status'] = status_val
            conditions.append("a.ASSET_STATUS = :asset_status")
    if params.get('fromDate'):
        bind['from_date'] = str(params['fromDate']).strip()[:10]
        conditions.append("TRUNC(a.ASSET_CREATION_DATE) >= TO_DATE(:from_date, 'YYYY-MM-DD')")
    if params.get('toDate'):
        bind['to_date'] = str(params['toDate']).strip()[:10]
        conditions.append("TRUNC(a.ASSET_CREATION_DATE) <= TO_DATE(:to_date, 'YYYY-MM-DD')")

    return " AND ".join(conditions), bind


def _order_clause(sort_by, sort_dir):
    sort_dir = (sort_dir or 'asc').lower()
    if sort_dir not in ('asc', 'desc'):
        sort_dir = 'asc'
    raw = (sort_by or 'asset_creation_date').lower().replace('-', '_').replace(' ', '')
    col = SORT_BY_MAP.get(raw) or (raw if raw in SORT_COLUMNS else 'asset_creation_date')
    if col not in SORT_COLUMNS:
        col = 'asset_creation_date'
    return f"a.{col.upper()} {sort_dir}"


def _aggregate_from_assets(session, params, select_expr):
    """Run aggregate (COUNT/SUM) on srm_assets with same filters as register. Uses LEFT JOIN br for location filters."""
    where_sql, bind = _build_where_and_params(params)
    sql = text(f"""
        SELECT {select_expr}
        FROM srm_assets a
        LEFT JOIN cm_branch_tlog br
            ON br.COMPANY_CODE = a.COMPANY_CODE AND br.DIVISION_CODE = a.DIV_CODE AND br.BRANCH_CODE = a.BRANCH_CODE
        WHERE {where_sql}
    """)
    row = session.execute(sql, bind).fetchone()
    return row[0] if row is not None else (0 if 'COUNT' in select_expr.upper() else 0.0)


def get_filtered_count(session, params):
    """Count of assets matching register filters (and role scope)."""
    val = _aggregate_from_assets(session, params, "COUNT(*) AS cnt")
    return int(val) if val is not None else 0


def get_filtered_total_cost(session, params):
    """Sum of asset_total_cost for assets matching register filters (and role scope)."""
    val = _aggregate_from_assets(session, params, "SUM(NVL(a.ASSET_TOTAL_COST, a.ASSET_COST)) AS total_cost")
    if val is None:
        return 0.0
    return float(val)


def get_filtered_net_book_value(session, params):
    """Sum of (asset_total_cost - dep_amount_total) for assets matching register filters (and role scope)."""
    val = _aggregate_from_assets(
        session,
        params,
        "SUM(GREATEST(NVL(NVL(a.ASSET_TOTAL_COST, a.ASSET_COST), 0) - NVL(a.DEP_AMOUNT_TOTAL, 0), 0)) AS net_book_value",
    )
    if val is None:
        return 0.0
    return float(val)


def _normalize_row_keys(keys, row):
    """Build dict with uppercase keys so lookups work regardless of Oracle/driver casing."""
    return {str(k).upper(): v for k, v in zip(keys, row)}


def _row_to_register_item(row, keys):
    """Convert a result row (dict) to API shape with assetId, assetName, ..., raw.
    Expects row to have uppercase keys (e.g. ASSET_TAG_ID, ITEM_NAME)."""
    def fmt_date(v):
        if v is None:
            return None
        if isinstance(v, datetime):
            return v.strftime('%Y-%m-%d')
        return str(v)

    cost = _val_num(row.get('ASSET_COST'))
    total_cost = _val_num(row.get('ASSET_TOTAL_COST')) or cost
    accum_dep = _val_num(row.get('ACCUM_DEP_AMOUNT')) or _val_num(row.get('DEP_AMOUNT_TOTAL'))
    net_book = max(total_cost - accum_dep, 0)

    raw = {}
    for k in keys:
        if k in ('COST', 'NET_BOOK_VALUE', 'CATEGORY_NAME', 'SUBCATEGORY_NAME', 'LOCATION_NAME', 'DEPT_NAME', 'RN',
                 'BRANCH_NAME', 'CITY', 'STATE_PROVINCE_CODE', 'COUNTRY_CODE'):
            continue
        v = row.get(k)
        if v is not None:
            raw[k] = _to_json_safe(v)

    category_name = row.get('CATEGORY_NAME') or row.get('ASSET_GROUP_DESC')
    subcategory_name = row.get('SUBCATEGORY_NAME') or row.get('ASSET_SUBGROUP_DESC')
    acq_date = fmt_date(row.get('ASSET_CREATION_DATE'))
    put_to_use = fmt_date(row.get('PUT_TO_USE_DATE'))
    return {
        'assetId': _val_text(row.get('ASSET_TAG_ID')),
        'assetName': _val_text(row.get('ITEM_NAME')),
        'divisionName': _val_text(row.get('DEPT_NAME')),
        'branchName': _val_text(row.get('BRANCH_NAME')),
        'city': _val_text(row.get('CITY')),
        'state': _val_text(row.get('STATE_PROVINCE_CODE')),
        'country': _val_text(row.get('COUNTRY_CODE')),
        'regionCode': _val_text(row.get('REGION_CODE')),
        'categoryName': _val_text(category_name),
        'subcategoryName': _val_text(subcategory_name),
        'locationName': _val_text(row.get('LOCATION_NAME')),
        'departmentName': _val_text(row.get('DEPT_NAME')),
        'status': _val_text(row.get('ASSET_STATUS')),
        'currentUser': _val_text(row.get('AUD_USER')),
        'vendor': _val_text(row.get('SUPPLIER_CODE')),
        'acquisitionDate': acq_date if acq_date else '-',
        'putToUseDate': put_to_use if put_to_use else '-',
        'poNo': _val_text(row.get('PO_NO')),
        'invNo': _val_text(row.get('INV_NO')),
        'cost': cost,
        'totalCost': total_cost,
        'accumDep': accum_dep,
        'netBookValue': net_book,
        'warrantyExpiry': '-',
        'amcExpiry': '-',
        'raw': raw,
    }


def get_asset_register_page(session, params):
    """
    Returns (list[dict], total_rows).
    Each dict has assetId, assetName, categoryName, subcategoryName, locationName,
    departmentName, status, currentUser, vendor, acquisitionDate, cost, netBookValue,
    warrantyExpiry, amcExpiry, raw.
    """
    where_sql, bind = _build_where_and_params(params)
    page = max(1, int(params.get('page') or 1))
    page_size = max(1, min(100, int(params.get('pageSize') or 20)))
    offset = (page - 1) * page_size
    order_sql = _order_clause(params.get('sortBy'), params.get('sortDir'))

    bind['offset'] = offset
    bind['end_row'] = offset + page_size

    # Count query (same filters; join br when location filters used)
    count_sql = text(f"""
        SELECT COUNT(*) AS cnt
        FROM srm_assets a
        LEFT JOIN cm_branch_tlog br
            ON br.COMPANY_CODE = a.COMPANY_CODE AND br.DIVISION_CODE = a.DIV_CODE AND br.BRANCH_CODE = a.BRANCH_CODE
        WHERE {where_sql}
    """)
    count_result = session.execute(count_sql, bind)
    count_row = count_result.fetchone()
    total_rows = int(count_row[0]) if count_row else 0

    # Main query: srm_assets as single source; category/subcategory from ASSET_GROUP_DESC/ASSET_SUBGROUP_DESC;
    # division/branch joins only for DEPT_NAME and LOCATION_NAME.
    main_sql = text(f"""
        SELECT * FROM (
            SELECT
                a.ASSET_TAG_ID,
                a.ITEM_NAME,
                a.ASSET_CREATION_DATE,
                a.ASSET_CLASS,
                a.ASSET_GROUP,
                a.ASSET_SUBGROUP,
                a.COMPANY_CODE,
                a.DIV_CODE,
                a.REGION_CODE,
                a.ACNTR_CODE,
                a.BRANCH_CODE,
                a.ASSET_STATUS,
                a.SUPPLIER_CODE,
                a.SUPPLIER_PAN,
                a.ASSET_REF_ID,
                a.PO_NO, a.PO_DATE, a.INV_NO, a.INV_DATE, a.GRN_NO, a.GRN_DATE,
                a.ITEM_CODE,
                a.ASSET_COST,
                a.ASSET_TOTAL_COST,
                a.DEP_AMOUNT_TOTAL,
                a.ACCUM_DEP_AMOUNT,
                a.DEP_END_DATE,
                a.SALE_STATUS,
                a.SALE_AMOUNT,
                a.PUT_TO_USE_DATE,
                a.AUD_USER,
                a.AUD_DATE,
                a.ASSET_GROUP_DESC,
                a.ASSET_SUBGROUP_DESC,
                NVL(NVL(a.ASSET_TOTAL_COST, a.ASSET_COST), 0) AS COST,
                GREATEST(NVL(NVL(a.ASSET_TOTAL_COST, a.ASSET_COST), 0) - NVL(a.DEP_AMOUNT_TOTAL, 0), 0) AS NET_BOOK_VALUE,
                a.ASSET_GROUP_DESC AS CATEGORY_NAME,
                a.ASSET_SUBGROUP_DESC AS SUBCATEGORY_NAME,
                div.DIVISION_NAME AS DEPT_NAME,
                br.BRANCH_NAME,
                br.CITY,
                br.STATE_PROVINCE_CODE,
                br.COUNTRY_CODE,
                NVL(br.BRANCH_NAME, br.CITY) AS LOCATION_NAME,
                ROW_NUMBER() OVER (ORDER BY {order_sql}) AS rn
            FROM srm_assets a
            LEFT JOIN cm_division_tlog div
                ON div.COMPANY_CODE = a.COMPANY_CODE AND div.DIVISION_CODE = a.DIV_CODE
            LEFT JOIN cm_branch_tlog br
                ON br.COMPANY_CODE = a.COMPANY_CODE AND br.DIVISION_CODE = a.DIV_CODE
                AND br.BRANCH_CODE = a.BRANCH_CODE
            WHERE {where_sql}
        ) t
        WHERE t.rn > :offset AND t.rn <= :end_row
    """)

    result = session.execute(main_sql, bind)
    keys = result.keys()
    rows = []
    raw_keys = [
        'ASSET_TAG_ID', 'ITEM_NAME', 'ASSET_CREATION_DATE', 'ASSET_CLASS', 'ASSET_GROUP', 'ASSET_SUBGROUP',
        'COMPANY_CODE', 'DIV_CODE', 'REGION_CODE', 'ACNTR_CODE', 'BRANCH_CODE', 'ASSET_STATUS', 'SUPPLIER_CODE',
        'SUPPLIER_PAN', 'ASSET_REF_ID', 'PO_NO', 'PO_DATE', 'INV_NO', 'INV_DATE', 'GRN_NO', 'GRN_DATE',
        'ITEM_CODE', 'ASSET_COST', 'ASSET_TOTAL_COST', 'DEP_AMOUNT_TOTAL', 'ACCUM_DEP_AMOUNT', 'DEP_END_DATE',
        'SALE_STATUS', 'SALE_AMOUNT', 'PUT_TO_USE_DATE', 'AUD_USER', 'AUD_DATE', 'ASSET_GROUP_DESC', 'ASSET_SUBGROUP_DESC',
    ]
    for row in result:
        d = _normalize_row_keys(keys, row)
        rows.append(_row_to_register_item(d, raw_keys))
    return rows, total_rows


def get_asset_register_export(session, params):
    """Generator of same-shaped dicts as get_asset_register_page (no pagination)."""
    where_sql, bind = _build_where_and_params(params)
    order_sql = _order_clause(params.get('sortBy'), params.get('sortDir'))

    export_sql = text(f"""
        SELECT
            a.ASSET_TAG_ID,
            a.ITEM_NAME,
            a.ASSET_CREATION_DATE,
            a.ASSET_CLASS,
            a.ASSET_GROUP,
            a.ASSET_SUBGROUP,
            a.COMPANY_CODE,
            a.DIV_CODE,
            a.REGION_CODE,
            a.ACNTR_CODE,
            a.BRANCH_CODE,
            a.ASSET_STATUS,
            a.SUPPLIER_CODE,
            a.SUPPLIER_PAN,
            a.ASSET_REF_ID,
            a.PO_NO, a.PO_DATE, a.INV_NO, a.INV_DATE, a.GRN_NO, a.GRN_DATE,
            a.ITEM_CODE,
            a.ASSET_COST,
            a.ASSET_TOTAL_COST,
            a.DEP_AMOUNT_TOTAL,
            a.ACCUM_DEP_AMOUNT,
            a.DEP_END_DATE,
            a.SALE_STATUS,
            a.SALE_AMOUNT,
            a.PUT_TO_USE_DATE,
            a.AUD_USER,
            a.AUD_DATE,
            a.ASSET_GROUP_DESC,
            a.ASSET_SUBGROUP_DESC,
            NVL(NVL(a.ASSET_TOTAL_COST, a.ASSET_COST), 0) AS COST,
            GREATEST(NVL(NVL(a.ASSET_TOTAL_COST, a.ASSET_COST), 0) - NVL(a.DEP_AMOUNT_TOTAL, 0), 0) AS NET_BOOK_VALUE,
            a.ASSET_GROUP_DESC AS CATEGORY_NAME,
            a.ASSET_SUBGROUP_DESC AS SUBCATEGORY_NAME,
            div.DIVISION_NAME AS DEPT_NAME,
            br.BRANCH_NAME,
            br.CITY,
            br.STATE_PROVINCE_CODE,
            br.COUNTRY_CODE,
            NVL(br.BRANCH_NAME, br.CITY) AS LOCATION_NAME
        FROM srm_assets a
        LEFT JOIN cm_division_tlog div
            ON div.COMPANY_CODE = a.COMPANY_CODE AND div.DIVISION_CODE = a.DIV_CODE
        LEFT JOIN cm_branch_tlog br
            ON br.COMPANY_CODE = a.COMPANY_CODE AND br.DIVISION_CODE = a.DIV_CODE
            AND br.BRANCH_CODE = a.BRANCH_CODE
        WHERE {where_sql}
        ORDER BY {order_sql}
    """)

    result = session.execute(export_sql, bind)
    keys = result.keys()
    raw_keys = [
        'ASSET_TAG_ID', 'ITEM_NAME', 'ASSET_CREATION_DATE', 'ASSET_CLASS', 'ASSET_GROUP', 'ASSET_SUBGROUP',
        'COMPANY_CODE', 'DIV_CODE', 'REGION_CODE', 'ACNTR_CODE', 'BRANCH_CODE', 'ASSET_STATUS', 'SUPPLIER_CODE',
        'SUPPLIER_PAN', 'ASSET_REF_ID', 'PO_NO', 'PO_DATE', 'INV_NO', 'INV_DATE', 'GRN_NO', 'GRN_DATE',
        'ITEM_CODE', 'ASSET_COST', 'ASSET_TOTAL_COST', 'DEP_AMOUNT_TOTAL', 'ACCUM_DEP_AMOUNT', 'DEP_END_DATE',
        'SALE_STATUS', 'SALE_AMOUNT', 'PUT_TO_USE_DATE', 'AUD_USER', 'AUD_DATE', 'ASSET_GROUP_DESC', 'ASSET_SUBGROUP_DESC',
    ]
    for row in result:
        d = _normalize_row_keys(keys, row)
        yield _row_to_register_item(d, raw_keys)


def insert_idle_asset(session, asset_ref_id, idle_reason):
    """Copy full asset row from srm_assets into srm_idle_assets plus IDLE_REASON, IDLE_MARKED_DATE.
    Matches by ASSET_TAG_ID (asset_ref_id from frontend = assetId = ASSET_TAG_ID)."""
    session.execute(
        text("""
            INSERT INTO srm_idle_assets (
                ASSET_TAG_ID, ITEM_NAME, ASSET_CREATION_DATE, ASSET_CLASS, ASSET_GROUP, ASSET_SUBGROUP,
                COMPANY_CODE, DIV_CODE, REGION_CODE, ACNTR_CODE, BRANCH_CODE, ASSET_STATUS,
                SUPPLIER_CODE, SUPPLIER_PAN, ASSET_REF_ID, PO_NO, PO_DATE, INV_NO, INV_DATE,
                GRN_NO, GRN_DATE, ITEM_CODE, ASSET_COST, ASSET_TOTAL_COST, DEP_AMOUNT_TOTAL,
                ACCUM_DEP_AMOUNT, DEP_END_DATE, SALE_STATUS, SALE_AMOUNT, PUT_TO_USE_DATE,
                AUD_USER, AUD_DATE, ASSET_GROUP_DESC, ASSET_SUBGROUP_DESC,
                IDLE_REASON, IDLE_MARKED_DATE
            )
            SELECT
                a.ASSET_TAG_ID, a.ITEM_NAME, a.ASSET_CREATION_DATE, a.ASSET_CLASS, a.ASSET_GROUP, a.ASSET_SUBGROUP,
                a.COMPANY_CODE, a.DIV_CODE, a.REGION_CODE, a.ACNTR_CODE, a.BRANCH_CODE, a.ASSET_STATUS,
                a.SUPPLIER_CODE, a.SUPPLIER_PAN, a.ASSET_REF_ID, a.PO_NO, a.PO_DATE, a.INV_NO, a.INV_DATE,
                a.GRN_NO, a.GRN_DATE, a.ITEM_CODE, a.ASSET_COST, a.ASSET_TOTAL_COST, a.DEP_AMOUNT_TOTAL,
                a.ACCUM_DEP_AMOUNT, a.DEP_END_DATE, a.SALE_STATUS, a.SALE_AMOUNT, a.PUT_TO_USE_DATE,
                a.AUD_USER, a.AUD_DATE, a.ASSET_GROUP_DESC, a.ASSET_SUBGROUP_DESC,
                :idle_reason, SYSDATE
            FROM srm_assets a
            WHERE a.ASSET_TAG_ID = :asset_ref_id
        """),
        {"asset_ref_id": str(asset_ref_id).strip(), "idle_reason": str(idle_reason).strip()},
    )


def update_asset_status_to_idle(session, asset_ref_id):
    """Set ASSET_STATUS = 'Idle' in srm_assets so the asset appears in Idle filter and idle count."""
    session.execute(
        text(
            "UPDATE srm_assets SET ASSET_STATUS = 'Idle' WHERE ASSET_TAG_ID = :asset_ref_id"
        ),
        {"asset_ref_id": str(asset_ref_id).strip()},
    )


def update_asset_status_to_active(session, asset_ref_id):
    """Set ASSET_STATUS = 'Active' in srm_assets so the asset appears in Active filter."""
    session.execute(
        text(
            "UPDATE srm_assets SET ASSET_STATUS = 'Active' WHERE ASSET_TAG_ID = :asset_ref_id"
        ),
        {"asset_ref_id": str(asset_ref_id).strip()},
    )
