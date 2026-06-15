from fastapi import APIRouter, HTTPException, status
from datetime import datetime, timedelta
from typing import Optional
import pyotp

from app.schemas.schemas import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    OTPRequest, OTPVerify
)

router = APIRouter()


# In-memory storage for demo (use database in production)
DEMO_USERS = {}
DEMO_TOKENS = {}


def generate_tokens(user_id: str) -> dict:
    """Generate access and refresh tokens"""
    import secrets
    
    access_token = secrets.token_urlsafe(32)
    refresh_token = secrets.token_urlsafe(32)
    
    DEMO_TOKENS[access_token] = {
        "user_id": user_id,
        "expires_at": datetime.utcnow() + timedelta(hours=1)
    }
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    
    # Check if user exists
    if user_data.email in DEMO_USERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user (simplified - no password hashing in demo)
    user_id = str(user_data.email)  # Use email as ID for demo
    
    DEMO_USERS[user_data.email] = {
        "id": user_id,
        "email": user_data.email,
        "password": user_data.password,  # In production, hash this!
        "full_name": user_data.full_name,
        "role": user_data.role.value,
        "created_at": datetime.utcnow().isoformat()
    }
    
    tokens = generate_tokens(user_id)
    
    return TokenResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            full_name=user_data.full_name,
            role=user_data.role,
            is_active=True
        )
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login with email and password"""
    
    user = DEMO_USERS.get(credentials.email)
    
    if not user or user.get("password") != credentials.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    tokens = generate_tokens(user["id"])
    
    return TokenResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            role=user["role"],
            is_active=True
        )
    )


@router.post("/otp/send")
async def send_otp(request: OTPRequest):
    """Send OTP to email"""
    
    user = DEMO_USERS.get(request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Generate OTP (in production, use a proper OTP service)
    totp = pyotp.TOTP(pyotp.random_base32())
    otp = totp.now()
    
    # Store OTP (with expiry)
    DEMO_USERS[request.email]["otp"] = {
        "code": otp,
        "expires_at": datetime.utcnow() + timedelta(minutes=5)
    }
    
    # In production, send email here
    print(f"OTP for {request.email}: {otp}")
    
    return {"message": "OTP sent to email", "email": request.email}


@router.post("/otp/verify", response_model=TokenResponse)
async def verify_otp(verify_data: OTPVerify):
    """Verify OTP and get tokens"""
    
    user = DEMO_USERS.get(verify_data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    stored_otp = user.get("otp", {})
    
    if stored_otp.get("code") != verify_data.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP"
        )
    
    if datetime.utcnow() > stored_otp.get("expires_at"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP expired"
        )
    
    # Clear OTP after successful verification
    del user["otp"]
    
    tokens = generate_tokens(user["id"])
    
    return TokenResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            role=user["role"],
            is_active=True
        )
    )


@router.post("/refresh")
async def refresh_token(refresh_token: str):
    """Refresh access token"""
    # Simplified - in production, validate refresh token properly
    return {"access_token": "new_token", "token_type": "bearer"}


@router.post("/logout")
async def logout():
    """Logout user"""
    return {"message": "Logged out successfully"}
