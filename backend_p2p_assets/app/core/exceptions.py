class BaseAPIException(Exception):
    """Base exception for API errors"""
    status_code = 500
    message = "An error occurred"

    def __init__(self, message=None, status_code=None):
        if message:
            self.message = message
        if status_code:
            self.status_code = status_code
        super().__init__(self.message)


class ValidationError(BaseAPIException):
    """Validation error"""
    status_code = 400
    message = "Validation error"


class NotFoundError(BaseAPIException):
    """Resource not found error"""
    status_code = 404
    message = "Resource not found"


class UnauthorizedError(BaseAPIException):
    """Unauthorized error"""
    status_code = 401
    message = "Unauthorized"


class ForbiddenError(BaseAPIException):
    """Forbidden error"""
    status_code = 403
    message = "Forbidden access"
