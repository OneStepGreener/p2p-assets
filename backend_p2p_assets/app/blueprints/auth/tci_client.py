"""
TLOG external login API client.
POST getEmployeeDetails with EmpCode/Pass; success when STATUS == VALID and empList present.
"""
import logging
import requests

logger = logging.getLogger(__name__)


def validate_user_via_tlog(base_url: str, username: str, password: str, timeout: int = 15):
    """
    Validate user via TLOG getEmployeeDetails.

    Returns:
        (True, emp_record) on success - emp_record is first item from empList (EmpCode, EmpName, EmpDiv, EmpBranch, EmpRegion).
        (False, error_message) on failure.
    """
    url = base_url.rstrip("/") + "/getEmployeeDetails"
    payload = {"EmpCode": username, "Pass": password}

    try:
        resp = requests.post(
            url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=timeout,
        )
        resp.raise_for_status()
        data = resp.json()

        if not data:
            return False, "Invalid response from login service"

        # Normalize keys (API may return MESSAGE/STATUS or message/status)
        status = (data.get("STATUS") or data.get("status") or "").strip().upper()
        emp_list = data.get("empList") or data.get("EmpList") or []

        if status != "VALID":
            return False, "Invalid username or password"

        if not emp_list or not isinstance(emp_list, list):
            return False, "Invalid username or password"

        emp = emp_list[0]
        if not isinstance(emp, dict):
            return False, "Invalid username or password"

        # Extract fields (case-insensitive keys)
        def get_emp(k, *alts):
            for key in [k] + list(alts):
                for dk, v in emp.items():
                    if str(dk).upper() == key.upper():
                        return v if v is not None else ""
            return ""

        emp_code = str(get_emp("EmpCode", "EMPCODE")).strip()
        emp_name = str(get_emp("EmpName", "EMPNAME")).strip()
        emp_div = str(get_emp("EmpDiv", "EMPDIV")).strip()
        emp_branch = str(get_emp("EmpBranch", "EMPBRANCH")).strip()
        emp_region = str(get_emp("EmpRegion", "EMPREGION")).strip()

        return True, {
            "emp_code": emp_code or username,
            "emp_name": emp_name,
            "emp_div": emp_div,
            "emp_branch": emp_branch,
            "emp_region": emp_region,
        }

    except requests.Timeout:
        logger.exception("TLOG API timeout")
        return False, "Login service timeout. Please try again."
    except requests.RequestException as e:
        logger.exception("TLOG API request failed")
        return False, "Login service unavailable: " + str(e)
    except Exception as e:
        logger.exception("TLOG API error")
        return False, "Login failed: " + str(e)


def _parse_emp_list(emp_list, username: str):
    """Parse first emp from empList into standard emp_record dict. Shared by getEmployeeDetails and getEmployeeDetailsSearch."""
    if not emp_list or not isinstance(emp_list, list):
        return None
    emp = emp_list[0]
    if not isinstance(emp, dict):
        return None
    def get_emp(emp_dict, k, *alts):
        for key in [k] + list(alts):
            for dk, v in emp_dict.items():
                if str(dk).upper() == key.upper():
                    return v if v is not None else ""
        return ""
    return {
        "emp_code": str(get_emp(emp, "EmpCode", "EMPCODE")).strip() or username,
        "emp_name": str(get_emp(emp, "EmpName", "EMPNAME")).strip(),
        "emp_div": str(get_emp(emp, "EmpDiv", "EMPDIV")).strip(),
        "emp_branch": str(get_emp(emp, "EmpBranch", "EMPBRANCH")).strip(),
        "emp_region": str(get_emp(emp, "EmpRegion", "EMPREGION")).strip(),
    }


def validate_user_via_tlog_search(base_url: str, username: str, timeout: int = 15):
    """
    Validate user via TLOG getEmployeeDetailsSearch (no password required).
    POST body: {"EmpCode": "<username>"}. Same response shape as getEmployeeDetails (STATUS, empList).
    Returns (True, emp_record) on success, (False, error_message) on failure.
    """
    url = base_url.rstrip("/") + "/getEmployeeDetailsSearch"
    payload = {"EmpCode": username}

    try:
        resp = requests.post(
            url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=timeout,
        )
        resp.raise_for_status()
        data = resp.json()

        if not data:
            return False, "Invalid response from login service"

        status = (data.get("STATUS") or data.get("status") or "").strip().upper()
        emp_list = data.get("empList") or data.get("EmpList") or []

        if status != "VALID":
            return False, "Invalid employee code"

        emp_record = _parse_emp_list(emp_list, username)
        if not emp_record:
            return False, "Invalid employee code"

        return True, emp_record

    except requests.Timeout:
        logger.exception("TLOG Search API timeout")
        return False, "Login service timeout. Please try again."
    except requests.RequestException as e:
        logger.exception("TLOG Search API request failed")
        return False, "Login service unavailable: " + str(e)
    except Exception as e:
        logger.exception("TLOG Search API error")
        return False, "Login failed: " + str(e)
