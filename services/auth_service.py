import jwt
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import logging

from config.settings import get_settings

logger = logging.getLogger(__name__)

class AuthService:
    """Authentication and authorization service"""
    
    def __init__(self):
        self.settings = get_settings()
        self.secret_key = self.settings.JWT_SECRET_KEY
        self.algorithm = "HS256"
        self.token_expiry_hours = 24
        
        # Demo tokens for hackathon (in production, use proper user management)
        self.demo_tokens = {
            "a4f025be0702e89076181feccb43bf8b5222b260bf6897750535c1aa37f5eA": {
                "user_id": "demo_user",
                "role": "admin",
                "permissions": ["read", "write", "admin"],
                "created_at": datetime.utcnow(),
                "expires_at": datetime.utcnow() + timedelta(days=30)
            }
        }
    
    def verify_token(self, token: str) -> bool:
        """Verify Bearer token"""
        try:
            # Check demo tokens first (for hackathon)
            if token in self.demo_tokens:
                token_data = self.demo_tokens[token]
                if datetime.utcnow() < token_data["expires_at"]:
                    return True
                else:
                    logger.warning(f"Token expired: {token[:20]}...")
                    return False
            
            # Verify JWT token
            try:
                payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
                user_id = payload.get("user_id")
                exp = payload.get("exp")
                
                if user_id and exp and datetime.utcfromtimestamp(exp) > datetime.utcnow():
                    return True
                else:
                    return False
                    
            except jwt.ExpiredSignatureError:
                logger.warning("Token expired")
                return False
            except jwt.InvalidTokenError:
                logger.warning("Invalid token")
                return False
                
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            return False
    
    def generate_token(self, user_id: str, role: str = "user") -> str:
        """Generate JWT token for user"""
        try:
            payload = {
                "user_id": user_id,
                "role": role,
                "iat": datetime.utcnow(),
                "exp": datetime.utcnow() + timedelta(hours=self.token_expiry_hours)
            }
            
            token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
            return token
            
        except Exception as e:
            logger.error(f"Token generation error: {e}")
            raise Exception("Failed to generate token")
    
    def generate_demo_token(self) -> str:
        """Generate a demo token for hackathon purposes"""
        token = secrets.token_hex(32)
        self.demo_tokens[token] = {
            "user_id": f"demo_user_{secrets.token_hex(4)}",
            "role": "user",
            "permissions": ["read", "write"],
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(days=7)
        }
        return token
    
    def get_user_info(self, token: str) -> Optional[Dict[str, Any]]:
        """Get user information from token"""
        try:
            if token in self.demo_tokens:
                return self.demo_tokens[token]
            
            # Decode JWT token
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return {
                "user_id": payload.get("user_id"),
                "role": payload.get("role", "user"),
                "permissions": ["read", "write"]  # Default permissions
            }
            
        except Exception as e:
            logger.error(f"Error getting user info: {e}")
            return None
    
    def hash_password(self, password: str) -> str:
        """Hash password for storage"""
        salt = secrets.token_hex(16)
        password_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
        return f"{salt}:{password_hash.hex()}"
    
    def verify_password(self, password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        try:
            salt, stored_hash = hashed_password.split(':')
            password_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
            return password_hash.hex() == stored_hash
        except Exception:
            return False
