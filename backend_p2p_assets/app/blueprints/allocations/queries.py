"""
Allocation queries - SRM_ASSET_TRANSFERS as the data source.
"""
from datetime import datetime
from decimal import Decimal
from sqlalchemy import text


def _to_json_safe(v):
    """Convert a value to a JSON-serializable type."""
    if v is None:
        return None
    if isinstance(v, Decimal):
        return float(v)
    if isinstance(v, datetime):
        return v.strftime('%Y-%m-%d')
    return v


def _normalize_row_keys(keys, row):
    """Build dict with uppercase keys."""
    return {str(k).upper(): v for k, v in zip(keys, row)}


def get_asset_transfers_page(session, params):
    """
    Returns (list[dict], total_rows) for asset transfers with pagination.
    """
    conditions = ["1=1"]
    bind = {}

    if params.get('search'):
        bind['search_pat'] = '%' + str(params['search']).strip() + '%'
        conditions.append(
            "(t.ASSET_TAG_ID LIKE :search_pat OR t.FROM_LOCATION LIKE :search_pat "
            "OR t.TO_LOCATION LIKE :search_pat OR t.TRANSFER_REASON LIKE :search_pat)"
        )
    if params.get('status'):
        bind['status'] = str(params['status']).strip()
        conditions.append("t.TRANSFER_STATUS = :status")
    if params.get('fromDate'):
        bind['from_date'] = str(params['fromDate']).strip()[:10]
        conditions.append("TRUNC(t.TRANSFER_DATE) >= TO_DATE(:from_date, 'YYYY-MM-DD')")
    if params.get('toDate'):
        bind['to_date'] = str(params['toDate']).strip()[:10]
        conditions.append("TRUNC(t.TRANSFER_DATE) <= TO_DATE(:to_date, 'YYYY-MM-DD')")

    where_sql = " AND ".join(conditions)

    page = max(1, int(params.get('page') or 1))
    page_size = max(1, min(100, int(params.get('pageSize') or 20)))
    offset = (page - 1) * page_size

    bind['offset'] = offset
    bind['end_row'] = offset + page_size

    count_sql = text(f"""
        SELECT COUNT(*) AS cnt
        FROM srm_asset_transfers t
        WHERE {where_sql}
    """)
    count_result = session.execute(count_sql, bind)
    count_row = count_result.fetchone()
    total_rows = int(count_row[0]) if count_row else 0

    # Select explicit columns and derive frontend fields:
    # - FROM_LOCATION / TO_LOCATION from branch codes
    # - FROM_DEPARTMENT / TO_DEPARTMENT from ACNTR codes
    # - REQUESTED_BY from TRANSFERRED_BY
    # - CREATED_DATE / UPDATED_DATE from AUD_DATE (or TRANSFER_DATE fallback)
    main_sql = text(f"""
        SELECT * FROM (
            SELECT
                t.TRANSFER_ID,
                t.ASSET_TAG_ID,
                t.ASSET_REF_ID,
                t.ITEM_NAME,
                t.LEG_SEQ,
                t.FROM_COMPANY_CODE,
                t.FROM_DIV_CODE,
                t.FROM_REGION_CODE,
                t.FROM_ACNTR_CODE,
                t.FROM_BRANCH_CODE,
                t.TO_COMPANY_CODE,
                t.TO_DIV_CODE,
                t.TO_REGION_CODE,
                t.TO_ACNTR_CODE,
                t.TO_BRANCH_CODE,
                t.TRANSFER_DATE,
                t.TRANSFER_REASON,
                t.TRANSFER_REMARKS,
                t.TRANSFER_REF_NO,
                t.TRANSFERRED_BY,
                t.APPROVED_BY,
                t.RECEIVED_BY,
                t.ASSET_CONDITION,
                t.ASSET_STATUS_AT_TXN,
                t.ACCUM_DEP_AT_TXN,
                t.BOOK_VALUE_AT_TXN,
                t.TRANSFER_STATUS,
                t.AUD_USER,
                t.AUD_DATE,
                -- Derived fields for frontend Allocation tab
                t.FROM_BRANCH_CODE AS FROM_LOCATION,
                t.TO_BRANCH_CODE   AS TO_LOCATION,
                t.FROM_ACNTR_CODE  AS FROM_DEPARTMENT,
                t.TO_ACNTR_CODE    AS TO_DEPARTMENT,
                t.TRANSFER_DATE    AS CREATED_DATE,
                NVL(t.AUD_DATE, t.TRANSFER_DATE) AS UPDATED_DATE,
                ROW_NUMBER() OVER (ORDER BY t.TRANSFER_DATE DESC, t.TRANSFER_ID DESC) AS rn
            FROM srm_asset_transfers t
            WHERE {where_sql}
        ) sub
        WHERE sub.rn > :offset AND sub.rn <= :end_row
    """)

    result = session.execute(main_sql, bind)
    keys = result.keys()
    rows = []
    for row in result:
        d = _normalize_row_keys(keys, row)
        rows.append(_row_to_transfer_item(d))
    return rows, total_rows


def _row_to_transfer_item(row):
    """Convert a result row to API shape."""
    def fmt_date(v):
        if v is None:
            return None
        if isinstance(v, datetime):
            return v.strftime('%Y-%m-%d')
        return str(v)

    def safe_str(v):
        if v is None:
            return '-'
        return str(v)

    return {
        'transferId': safe_str(row.get('TRANSFER_ID')),
        'assetTagId': safe_str(row.get('ASSET_TAG_ID')),
        'fromLocation': safe_str(row.get('FROM_LOCATION')),
        'toLocation': safe_str(row.get('TO_LOCATION')),
        'fromDepartment': safe_str(row.get('FROM_DEPARTMENT')),
        'toDepartment': safe_str(row.get('TO_DEPARTMENT')),
        'transferDate': fmt_date(row.get('TRANSFER_DATE')),
        'transferStatus': safe_str(row.get('TRANSFER_STATUS')),
        'transferReason': safe_str(row.get('TRANSFER_REASON')),
        'approvedBy': safe_str(row.get('APPROVED_BY')),
        'requestedBy': safe_str(row.get('TRANSFERRED_BY')),
        'createdDate': fmt_date(row.get('CREATED_DATE')),
        'updatedDate': fmt_date(row.get('UPDATED_DATE')),
    }


def get_transfer_count(session, params=None):
    """Get count of asset transfers with optional filters."""
    conditions = ["1=1"]
    bind = {}

    if params:
        if params.get('status'):
            bind['status'] = str(params['status']).strip()
            conditions.append("t.TRANSFER_STATUS = :status")

    where_sql = " AND ".join(conditions)

    sql = text(f"""
        SELECT COUNT(*) AS cnt
        FROM srm_asset_transfers t
        WHERE {where_sql}
    """)
    row = session.execute(sql, bind).fetchone()
    return int(row[0]) if row else 0


def get_transfer_by_id(session, transfer_id):
    """Get a single transfer by ID."""
    sql = text("""
        SELECT * FROM srm_asset_transfers WHERE TRANSFER_ID = :transfer_id
    """)
    result = session.execute(sql, {'transfer_id': transfer_id})
    keys = result.keys()
    row = result.fetchone()
    if row:
        d = _normalize_row_keys(keys, row)
        return _row_to_transfer_item(d)
    return None


def get_transfers_by_asset(session, asset_tag_id):
    """Get all transfers for a specific asset (movement history)."""
    sql = text("""
        SELECT
            t.TRANSFER_ID,
            t.ASSET_TAG_ID,
            t.ASSET_REF_ID,
            t.ITEM_NAME,
            t.LEG_SEQ,
            t.FROM_COMPANY_CODE,
            t.FROM_DIV_CODE,
            t.FROM_REGION_CODE,
            t.FROM_ACNTR_CODE,
            t.FROM_BRANCH_CODE,
            t.TO_COMPANY_CODE,
            t.TO_DIV_CODE,
            t.TO_REGION_CODE,
            t.TO_ACNTR_CODE,
            t.TO_BRANCH_CODE,
            t.TRANSFER_DATE,
            t.TRANSFER_REASON,
            t.TRANSFER_REMARKS,
            t.TRANSFER_REF_NO,
            t.TRANSFERRED_BY,
            t.APPROVED_BY,
            t.RECEIVED_BY,
            t.ASSET_CONDITION,
            t.ASSET_STATUS_AT_TXN,
            t.ACCUM_DEP_AT_TXN,
            t.BOOK_VALUE_AT_TXN,
            t.TRANSFER_STATUS,
            t.AUD_USER,
            t.AUD_DATE,
            t.FROM_BRANCH_CODE AS FROM_LOCATION,
            t.TO_BRANCH_CODE   AS TO_LOCATION,
            t.FROM_ACNTR_CODE  AS FROM_DEPARTMENT,
            t.TO_ACNTR_CODE    AS TO_DEPARTMENT,
            t.TRANSFER_DATE    AS CREATED_DATE,
            NVL(t.AUD_DATE, t.TRANSFER_DATE) AS UPDATED_DATE
        FROM srm_asset_transfers t
        WHERE t.ASSET_TAG_ID = :asset_tag_id
        ORDER BY t.TRANSFER_DATE DESC, t.TRANSFER_ID DESC
    """)
    result = session.execute(sql, {'asset_tag_id': asset_tag_id})
    keys = result.keys()
    rows = []
    for row in result:
        d = _normalize_row_keys(keys, row)
        rows.append(_row_to_transfer_item(d))
    return rows


def approve_transfer(session, transfer_id, approved_by):
    """
    Approve a transfer: set APPROVED_BY (and audit fields) for a given TRANSFER_ID.
    BUSINESS RULE: we do not change TRANSFER_STATUS here; SP_TRANSFER_ASSET already
    set it to IN-TRANSIT. Approval just records who approved it.
    """
    sql = text("""
        UPDATE srm_asset_transfers
        SET APPROVED_BY = :approved_by,
            AUD_USER    = :approved_by,
            AUD_DATE    = SYSDATE
        WHERE TRANSFER_ID = :transfer_id
    """)
    session.execute(sql, {'approved_by': str(approved_by).strip(), 'transfer_id': transfer_id})
