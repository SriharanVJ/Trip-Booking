# Bus Booking System

A full-stack bus ticket booking application with Next.js frontend and FastAPI backend.

## Project Structure

```
Bus_Booking/
├── frontend/              # Next.js 14+ Application
│   ├── app/              # App Router pages
│   │   ├── (auth)/       # Authentication routes
│   │   ├── (booking)/    # Booking routes
│   │   ├── (admin)/      # Admin routes
│   │   └── ...
│   ├── components/       # React components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── layout/      # Layout components
│   │   ├── vehicle/     # Vehicle-related components
│   │   ├── booking/     # Booking components
│   │   └── admin/       # Admin components
│   ├── lib/             # Utilities and API client
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript types
│   └── public/          # Static assets
│
└── backend/              # FastAPI Application
    ├── app/
    │   ├── api/         # API endpoints
    │   │   └── v1/
    │   │       ├── endpoints/  # Route handlers
    │   │       └── api.py      # API router
    │   ├── core/        # Configuration & security
    │   ├── db/          # Database models & CRUD
    │   ├── schemas/     # Pydantic schemas
    │   └── main.py      # Application entry
    └── pyproject.toml   # Python dependencies

```

## Tech Stack

### Frontend
- Next.js 14+ with App Router
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Axios for API calls
- Zustand for state management

### Backend
- FastAPI
- PostgreSQL
- SQLAlchemy with async support
- Pydantic for validation
- JWT authentication

## Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 14+

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Frontend runs on http://localhost:3000

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -e .
cp .env.example .env
# Edit .env with your database credentials
python run.py
```

Backend runs on http://localhost:8000
API docs at http://localhost:8000/docs

### Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE bus_booking;
```

The application will automatically create tables on first run.

## Features

### User Features
- Search buses by origin, destination, and date
- View bus details, amenities, and pricing
- Select seats and book tickets
- View and manage bookings
- User authentication (register/login)

### Admin Features
- Dashboard with statistics
- Manage buses (add, edit, delete)
- Manage bookings
- Update booking status

## API Endpoints

### Authentication
- POST `/api/v1/auth/register` - Register new user
- POST `/api/v1/auth/login` - Login user
- POST `/api/v1/auth/logout` - Logout user
- GET `/api/v1/auth/profile` - Get user profile

### Buses
- GET `/api/v1/buses/search` - Search buses
- GET `/api/v1/buses/routes` - Get all routes
- GET `/api/v1/buses/{id}` - Get bus by ID

### Bookings
- POST `/api/v1/bookings` - Create booking
- GET `/api/v1/bookings/my-bookings` - Get user bookings
- GET `/api/v1/bookings/{id}` - Get booking by ID
- DELETE `/api/v1/bookings/{id}` - Cancel booking

### Admin
- GET `/api/v1/admin/dashboard` - Get dashboard stats
- GET `/api/v1/admin/buses` - Get all buses
- POST `/api/v1/admin/buses` - Create bus
- DELETE `/api/v1/admin/buses/{id}` - Delete bus
- GET `/api/v1/admin/bookings` - Get all bookings

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Backend (.env)
```
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/bus_booking
SECRET_KEY=your-secret-key-here
```

## License

ISC
