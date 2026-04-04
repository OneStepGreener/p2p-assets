from app.utils.validators import validate_email
from app.core.exceptions import ValidationError


def validate_user_data(data: dict):
    """Validate user registration/login data"""
    errors = []
    
    if 'username' in data:
        username = data['username']
        if len(username) < 3 or len(username) > 80:
            errors.append('Username must be between 3 and 80 characters')
        if not username.replace('_', '').replace('-', '').isalnum():
            errors.append('Username can only contain letters, numbers, hyphens, and underscores')
    
    if 'email' in data:
        if not validate_email(data['email']):
            errors.append('Invalid email format')
    
    if 'password' in data:
        password = data['password']
        if len(password) < 8:
            errors.append('Password must be at least 8 characters long')
        if not any(c.isupper() for c in password):
            errors.append('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in password):
            errors.append('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in password):
            errors.append('Password must contain at least one number')
    
    if errors:
        raise ValidationError('; '.join(errors))
    
    return True
