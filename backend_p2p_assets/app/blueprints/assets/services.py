from app.extensions import db
from sqlalchemy import text
from app.core.exceptions import NotFoundError
from app.config import Config
from app.blueprints.assets import queries as asset_queries


class AssetService:
    """Asset service for business logic"""
    
    @staticmethod
    def get_asset_register(params):
        """Asset Register from srm_assets (single source of truth) with label joins. Returns (data, page, pageSize, totalRows)."""
        try:
            rows, total_rows = asset_queries.get_asset_register_page(db.session, params)
            page = max(1, int(params.get('page') or 1))
            page_size = max(1, min(100, int(params.get('pageSize') or 20)))
            return {
                'data': rows,
                'page': page,
                'pageSize': page_size,
                'totalRows': total_rows,
            }
        except Exception as e:
            print(f"Error getting asset register: {str(e)}")
            raise

    @staticmethod
    def get_locations():
        """Get distinct HO_COUNTRY_NAME from cm_division_tlog for location filter options"""
        try:
            result = db.session.execute(text(
                "SELECT DISTINCT HO_COUNTRY_NAME FROM cm_division_tlog "
                "WHERE HO_COUNTRY_NAME IS NOT NULL ORDER BY HO_COUNTRY_NAME"
            ))
            rows = result.fetchall()
            return [row[0] for row in rows if row[0]]
        except Exception as e:
            print(f"Error getting locations: {str(e)}")
            return []

    @staticmethod
    def get_total_active_count(params=None):
        """Get count of assets. If params (with optional scope) given, applies same filters as register; else all."""
        try:
            if params:
                return asset_queries.get_filtered_count(db.session, params)
            result = db.session.execute(text("SELECT COUNT(*) as count FROM srm_assets"))
            row = result.fetchone()
            return row[0] if row else 0
        except Exception as e:
            print(f"Error getting asset count: {str(e)}")
            return 0

    @staticmethod
    def get_total_cost_sum(params=None):
        """Get sum of asset_total_cost. If params given, applies same filters as register; else all."""
        try:
            if params:
                return asset_queries.get_filtered_total_cost(db.session, params)
            result = db.session.execute(text("SELECT SUM(NVL(asset_total_cost, asset_cost)) as total_cost FROM srm_assets"))
            row = result.fetchone()
            return float(row[0]) if row and row[0] is not None else 0.0
        except Exception as e:
            print(f"Error getting total cost sum: {str(e)}")
            return 0.0

    @staticmethod
    def get_net_book_value(params=None):
        """Get net book value. If params given, applies same filters as register; else all."""
        try:
            if params:
                return asset_queries.get_filtered_net_book_value(db.session, params)
            result = db.session.execute(text(
                "SELECT SUM(GREATEST(NVL(NVL(asset_total_cost, asset_cost), 0) - NVL(dep_amount_total, 0), 0)) AS net_book_value FROM srm_assets"
            ))
            row = result.fetchone()
            return float(row[0]) if row and row[0] is not None else 0.0
        except Exception as e:
            print(f"Error getting net book value: {str(e)}")
            return 0.0

    @staticmethod
    def get_dashboard_kpis(params):
        """Register-filtered KPIs in one call: totals for params plus idle slice (status forced to Idle)."""
        params_idle = {**params, 'status': 'Idle'}
        return {
            'count': asset_queries.get_filtered_count(db.session, params),
            'idle_count': asset_queries.get_filtered_count(db.session, params_idle),
            'total_cost': asset_queries.get_filtered_total_cost(db.session, params),
            'idle_total_cost': asset_queries.get_filtered_total_cost(db.session, params_idle),
            'net_book_value': asset_queries.get_filtered_net_book_value(db.session, params),
        }

    @staticmethod
    def mark_asset_idle(asset_ref_id, idle_reason):
        """Copy asset to SRM_IDLE_ASSETS and set ASSET_STATUS = 'Idle' in srm_assets."""
        try:
            asset_queries.insert_idle_asset(db.session, asset_ref_id, idle_reason)
            asset_queries.update_asset_status_to_idle(db.session, asset_ref_id)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

    @staticmethod
    def mark_asset_active(asset_ref_id):
        """Set ASSET_STATUS = 'Active' in srm_assets."""
        try:
            asset_queries.update_asset_status_to_active(db.session, asset_ref_id)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

    @staticmethod
    def transfer_asset(
        asset_id: str,
        destination_branch_code: str,
        reason: str,
        ref_no: str,
        transferred_by: str,
        approved_by: str,
        transfer_remarks: str | None = None,
    ):
        """
        Initiate asset transfer.

        This delegates to the Oracle stored procedure SP_TRANSFER_ASSET which is
        expected to:
        - snapshot the asset
        - log into SRM_ASSET_TRANSFERS
        - update asset location / status (e.g. IN-TRANSIT)

        The exact PL/SQL implementation lives in the database.
        """
        try:
            # Look up current asset location so we can reuse company/division/region/account,
            # changing only the branch to destination_branch_code.
            row = db.session.execute(
                text(
                    """
                    SELECT COMPANY_CODE, DIV_CODE, REGION_CODE, ACNTR_CODE, BRANCH_CODE
                    FROM SRM_ASSETS
                    WHERE ASSET_TAG_ID = :asset_tag_id
                    """
                ),
                {"asset_tag_id": str(asset_id).strip()},
            ).fetchone()
            if not row:
                raise NotFoundError(f"Asset not found for assetId={asset_id}")

            to_company = str(row[0] or "").strip()
            to_div = str(row[1] or "").strip()
            to_region = str(row[2] or "").strip()
            to_acntr = str(row[3] or "").strip()
            # Destination branch is provided by frontend form
            to_branch = str(destination_branch_code).strip()

            remarks = (transfer_remarks or reason or "").strip()

            db.session.execute(
                text(
                    """
                    BEGIN
                        SP_TRANSFER_ASSET(
                            :p_asset_tag_id,
                            :p_to_company,
                            :p_to_div,
                            :p_to_region,
                            :p_to_acntr,
                            :p_to_branch,
                            :p_transfer_reason,
                            :p_transfer_remarks,
                            :p_transfer_ref_no,
                            :p_transferred_by,
                            :p_approved_by
                        );
                    END;
                    """
                ),
                {
                    "p_asset_tag_id": str(asset_id).strip(),
                    "p_to_company": to_company,
                    "p_to_div": to_div,
                    "p_to_region": to_region,
                    "p_to_acntr": to_acntr,
                    "p_to_branch": to_branch,
                    "p_transfer_reason": str(reason).strip(),
                    "p_transfer_remarks": remarks,
                    "p_transfer_ref_no": str(ref_no).strip(),
                    "p_transferred_by": str(transferred_by).strip(),
                    "p_approved_by": str(approved_by).strip(),
                },
            )
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

    @staticmethod
    def get_all_assets(filters=None, page=1, per_page=200):
        """Get all assets from srm_assets table using raw SQL with optional filters and pagination"""
        try:
            # Base query
            query = "SELECT * FROM srm_assets WHERE 1=1"
            params = {}
            
            # Add filters if provided (location = HO_COUNTRY_NAME from cm_division_tlog)
            if filters:
                if filters.get('location'):
                    query += " AND EXISTS (SELECT 1 FROM cm_division_tlog d WHERE d.DIVISION_CODE = srm_assets.REGION_CODE AND d.HO_COUNTRY_NAME = :location)"
                    params['location'] = filters['location']
                if filters.get('department'):
                    query += " AND ACNTR_CODE = :department"
                    params['department'] = filters['department']
                if filters.get('status'):
                    query += " AND ASSET_STATUS = :status"
                    params['status'] = filters['status']
            
            # Add ordering
            query += " ORDER BY ASSET_CREATION_DATE DESC"
            
            # Add pagination (Oracle uses ROWNUM or OFFSET/FETCH)
            # Using OFFSET/FETCH for Oracle 12c+
            offset = (page - 1) * per_page
            query += f" OFFSET :offset ROWS FETCH NEXT :per_page ROWS ONLY"
            params['offset'] = offset
            params['per_page'] = per_page
            
            result = db.session.execute(text(query), params)
            columns = result.keys()
            assets = []
            for row in result:
                asset_dict = dict(zip(columns, row))
                assets.append(asset_dict)
            return assets
        except Exception as e:
            print(f"Error getting assets: {str(e)}")
            # Fallback to simpler pagination if OFFSET/FETCH doesn't work
            try:
                query = "SELECT * FROM (SELECT a.*, ROWNUM rnum FROM (SELECT * FROM srm_assets WHERE 1=1"
                params = {}
                
                if filters:
                    if filters.get('location'):
                        query += " AND REGION_CODE = :location"
                        params['location'] = filters['location']
                    if filters.get('department'):
                        query += " AND ACNTR_CODE = :department"
                        params['department'] = filters['department']
                    if filters.get('status'):
                        query += " AND ASSET_STATUS = :status"
                        params['status'] = filters['status']
                
                query += " ORDER BY ASSET_CREATION_DATE DESC) a WHERE ROWNUM <= :max_row) WHERE rnum > :min_row"
                offset = (page - 1) * per_page
                params['max_row'] = offset + per_page
                params['min_row'] = offset
                
                result = db.session.execute(text(query), params)
                columns = result.keys()
                assets = []
                for row in result:
                    asset_dict = dict(zip(columns, row))
                    # Remove ROWNUM column from result
                    if 'rnum' in asset_dict:
                        del asset_dict['rnum']
                    assets.append(asset_dict)
                return assets
            except Exception as e2:
                print(f"Error with fallback pagination: {str(e2)}")
                return []
    
    @staticmethod
    def get_total_assets_count(filters=None):
        """Get total count of assets matching filters"""
        try:
            query = "SELECT COUNT(*) as total FROM srm_assets WHERE 1=1"
            params = {}
            
            if filters:
                if filters.get('location'):
                    query += " AND EXISTS (SELECT 1 FROM cm_division_tlog d WHERE d.DIVISION_CODE = srm_assets.REGION_CODE AND d.HO_COUNTRY_NAME = :location)"
                    params['location'] = filters['location']
                if filters.get('department'):
                    query += " AND ACNTR_CODE = :department"
                    params['department'] = filters['department']
                if filters.get('status'):
                    query += " AND ASSET_STATUS = :status"
                    params['status'] = filters['status']
            
            result = db.session.execute(text(query), params)
            row = result.fetchone()
            return row[0] if row else 0
        except Exception as e:
            print(f"Error getting asset count: {str(e)}")
            return 0

    @staticmethod
    def get_comprehensive_kpis(filters: dict):
        """
        Calculate KPIs from srm_assets with optional filters.
        - totalAssets
        - activeAssets (status in ASSET_STATUS_ACTIVE_VALUES)
        - idleAssets30d (active but idle > 30 days)
        - valueAtRisk (sum of cost for idle assets)
        - utilizationAvg (utilized / active * 100)
        - utilizationTarget (from config)
        - pmUpcoming7d / pmOverdue (0 for now)
        """
        try:
            active_values = getattr(Config, "ASSET_STATUS_ACTIVE_VALUES", ["1", "ACTIVE"])
            active_values = [v.strip() for v in active_values if v.strip()]

            # Build IN clause for active statuses
            placeholders = []
            params = {}
            for idx, val in enumerate(active_values):
                key = f"active_status_{idx}"
                placeholders.append(f":{key}")
                params[key] = val
            active_in_clause = ", ".join(placeholders) or "''"

            # Base filters
            where = ["1=1"]

            if filters.get("serviceCode"):
                where.append("a.ASSET_CLASS = :service_code")
                params["service_code"] = filters["serviceCode"]
            if filters.get("regionCode"):
                where.append("a.REGION_CODE = :region_code")
                params["region_code"] = filters["regionCode"]
            if filters.get("branchCode"):
                where.append("a.BRANCH_CODE = :branch_code")
                params["branch_code"] = filters["branchCode"]
            if filters.get("status"):
                where.append("a.ASSET_STATUS = :status")
                params["status"] = filters["status"]

            from_date = filters.get("fromDate")
            to_date = filters.get("toDate")
            if from_date:
                where.append("TRUNC(a.ASSET_CREATION_DATE) >= TO_DATE(:from_date, 'YYYY-MM-DD')")
                params["from_date"] = from_date[:10]
            if to_date:
                where.append("TRUNC(a.ASSET_CREATION_DATE) <= TO_DATE(:to_date, 'YYYY-MM-DD')")
                params["to_date"] = to_date[:10]

            where_sql = " AND ".join(where)

            sql = text(
                f"""
                SELECT
                  COUNT(*) AS total_assets,
                  SUM(CASE WHEN a.ASSET_STATUS IN ({active_in_clause}) THEN 1 ELSE 0 END) AS active_assets,
                  SUM(CASE
                        WHEN a.ASSET_STATUS IN ({active_in_clause})
                         AND NVL(NVL(a.PUT_TO_USE_DATE, a.ASSET_CREATION_DATE),
                                a.ASSET_CREATION_DATE) < TRUNC(SYSDATE) - 30
                        THEN 1 ELSE 0 END) AS idle_assets_30d,
                  SUM(CASE
                        WHEN a.ASSET_STATUS IN ({active_in_clause})
                         AND NVL(NVL(a.PUT_TO_USE_DATE, a.ASSET_CREATION_DATE),
                                a.ASSET_CREATION_DATE) < TRUNC(SYSDATE) - 30
                        THEN NVL(a.ASSET_TOTAL_COST, a.ASSET_COST)
                        ELSE 0
                      END) AS value_at_risk
                FROM srm_assets a
                WHERE {where_sql}
                """
            )

            result = db.session.execute(sql, params)
            row = result.fetchone()
            total_assets = int(row[0] or 0)
            active_assets = int(row[1] or 0)
            idle_assets = int(row[2] or 0)
            value_at_risk = float(row[3] or 0.0)

            utilized = max(active_assets - idle_assets, 0)
            utilization_avg = (
                float(utilized * 100.0 / active_assets) if active_assets else 0.0
            )

            return {
                "totalAssets": total_assets,
                "activeAssets": active_assets,
                "idleAssets30d": idle_assets,
                "valueAtRisk": value_at_risk,
                "utilizationAvg": round(utilization_avg, 2),
                "utilizationTarget": float(getattr(Config, "UTILIZATION_TARGET", 85.0)),
                "pmUpcoming7d": 0,
                "pmOverdue": 0,
                "mode": "derived_from_srm_assets",
            }
        except Exception as e:
            print(f"Error getting comprehensive KPIs: {str(e)}")
            return {
                "totalAssets": 0,
                "activeAssets": 0,
                "idleAssets30d": 0,
                "valueAtRisk": 0.0,
                "utilizationAvg": 0.0,
                "utilizationTarget": float(getattr(Config, "UTILIZATION_TARGET", 85.0)),
                "pmUpcoming7d": 0,
                "pmOverdue": 0,
                "mode": "derived_from_srm_assets",
            }

    @staticmethod
    def get_category_counts_by_service(service_code: str):
        """
        Get category counts for a given service_code.

        category_count = COUNT(DISTINCT srm_asset_subcatg_mast.asset_subcatg_id)
        Grouped by srm_asset_catg_mast.asset_catg_name
        """
        try:
            sql = text(
                """
                SELECT
                    c.asset_catg_name AS category_name,
                    COUNT(DISTINCT s.asset_subcatg_id) AS category_count
                FROM srm_asset_catg_mast c
                JOIN cm_srm_service_type t
                  ON c.assets_class_id = t.service_code
                LEFT JOIN srm_asset_subcatg_mast s
                  ON s.assets_class_id = c.assets_class_id
                 AND s.assets_catg_id = c.assets_catg_id
                WHERE c.assets_class_id = :service_code
                GROUP BY c.asset_catg_name
                ORDER BY category_count DESC, c.asset_catg_name ASC
                """
            )
            result = db.session.execute(sql, {"service_code": service_code})
            rows = result.fetchall()

            items = [
                {
                    "category": (r[0] or ""),
                    "count": int(r[1] or 0),
                }
                for r in rows
            ]
            total = sum(i["count"] for i in items) or 0
            for i in items:
                i["percentage"] = round((i["count"] / total) * 100, 2) if total else 0.0

            return {
                "service_code": service_code,
                "total": total,
                "items": items,
            }
        except Exception as e:
            print(f"Error getting category counts: {str(e)}")
            return {"service_code": service_code, "total": 0, "items": []}
    
    @staticmethod
    def map_asset_to_frontend_format(asset_row):
        """Map Oracle srm_assets table row to frontend Asset format"""
        from datetime import datetime
        
        # Helper to format dates
        def format_date(date_val):
            if date_val is None:
                return None
            if isinstance(date_val, datetime):
                return date_val.strftime('%Y-%m-%d')
            return str(date_val)
        
        # Map Oracle columns to frontend Asset interface
        return {
            'id': asset_row.get('ASSET_TAG_ID', ''),
            'name': asset_row.get('ITEM_NAME', ''),
            'description': f"{asset_row.get('ASSET_GROUP_DESC', '')} - {asset_row.get('ASSET_SUBGROUP_DESC', '')}",
            'category': asset_row.get('ASSET_GROUP_DESC', ''),
            'class': asset_row.get('ASSET_CLASS', ''),
            'location': asset_row.get('REGION_CODE', ''),
            'department': asset_row.get('ACNTR_CODE', ''),
            'status': asset_row.get('ASSET_STATUS', 'Active'),
            'currentUser': None,  # Not in srm_assets table
            'owner': asset_row.get('ACNTR_CODE', ''),
            'vendor': asset_row.get('SUPPLIER_CODE', ''),
            'acquisitionDate': format_date(asset_row.get('ASSET_CREATION_DATE')),
            'cost': float(asset_row.get('ASSET_COST', 0) or 0),
            'netBookValue': float(asset_row.get('ASSET_TOTAL_COST', 0) or 0) - float(asset_row.get('DEP_AMOUNT_TOTAL', 0) or 0),
            'warrantyExpiry': None,  # Not in srm_assets table
            'amcExpiry': None,  # Not in srm_assets table
            'costCenter': asset_row.get('ACNTR_CODE', ''),
            'lastMovementDate': format_date(asset_row.get('AUD_DATE')),
            # Additional fields from srm_assets
            'assetTotalCost': float(asset_row.get('ASSET_TOTAL_COST', 0) or 0),
            'depAmountTotal': float(asset_row.get('DEP_AMOUNT_TOTAL', 0) or 0),
            'assetRefId': asset_row.get('ASSET_REF_ID', ''),
            'poNo': asset_row.get('PO_NO', ''),
            'grnNo': asset_row.get('GRN_NO', ''),
            'putToUseDate': format_date(asset_row.get('PUT_TO_USE_DATE')),
        }