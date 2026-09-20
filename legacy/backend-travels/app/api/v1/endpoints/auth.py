"""Authentication endpoints"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.crud import create_customer, authenticate_customer, get_customer_by_email, authenticate_admin
from app.core.security import create_access_token
from app.schemas.user import CustomerCreate, CustomerLogin, CustomerResponse, AdminLogin, AdminResponse, Token
from app.core.deps import get_current_user, get_current_admin

router = APIRouter()


@router.post("/register", response_model=CustomerResponse)
async def register(
    user_data: CustomerCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register a new customer"""
    # Check if customer exists
    existing_customer = await get_customer_by_email(db, user_data.email)
    if existing_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create customer
    customer = await create_customer(
        db=db,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        email=user_data.email,
        password=user_data.password,
        phone=user_data.phone,
        is_corporate=user_data.is_corporate
    )
    return customer


@router.post("/login", response_model=Token)
async def login(
    credentials: CustomerLogin,
    db: AsyncSession = Depends(get_db)
):
    """Login customer and return access token"""
    customer = await authenticate_customer(db, credentials.email, credentials.password)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update last login
    from app.db.crud import update_customer_login
    await update_customer_login(db, customer)

    # Create access token
    access_token = create_access_token(data={"sub": customer.id, "user_type": "customer"})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": "customer"
    }


@router.post("/admin/login", response_model=Token)
async def admin_login(
    credentials: AdminLogin,
    db: AsyncSession = Depends(get_db)
):
    """Login admin and return access token"""
    admin = await authenticate_admin(db, credentials.email, credentials.password)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token = create_access_token(data={"sub": admin.id, "user_type": "admin"})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": "admin"
    }


@router.post("/logout")
async def logout():
    """Logout user (client-side token removal)"""
    return {"message": "Successfully logged out"}


@router.get("/profile", response_model=CustomerResponse)
async def get_profile(
    current_user = Depends(get_current_user)
):
    """Get current user profile"""
    return current_user


@router.get("/admin/profile", response_model=AdminResponse)
async def get_admin_profile(
    current_admin = Depends(get_current_admin)
):
    """Get current admin profile"""
    return current_admin
