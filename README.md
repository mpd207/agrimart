# AgriMart 🌾

India's Farmer Marketplace — React + FastAPI full-stack application.

---

## Project Structure

```
agrimart/
├── backend/                  # FastAPI (Python)
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py     # Pydantic settings (.env)
│   │   │   ├── database.py   # Async SQLAlchemy + SQLite
│   │   │   ├── security.py   # JWT + bcrypt
│   │   │   └── deps.py       # FastAPI dependencies
│   │   ├── models/           # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── market_price.py
│   │   │   ├── seed.py
│   │   │   ├── fertilizer.py
│   │   │   └── cart.py
│   │   ├── routers/          # API route handlers
│   │   │   ├── auth.py
│   │   │   ├── market_prices.py
│   │   │   ├── seeds.py
│   │   │   ├── fertilizers.py
│   │   │   └── cart.py
│   │   ├── schemas/
│   │   │   └── schemas.py    # Pydantic request/response models
│   │   ├── services/         # Business logic
│   │   │   ├── auth_service.py
│   │   │   ├── market_service.py
│   │   │   ├── seed_service.py
│   │   │   ├── fertilizer_service.py
│   │   │   └── cart_service.py
│   │   └── main.py           # App factory, CORS, scheduler
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
│
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js      # Axios client + all API calls
│   │   ├── context/
│   │   │   ├── authStore.js  # Zustand auth state
│   │   │   └── cartStore.js  # Zustand cart state
│   │   ├── components/
│   │   │   └── layout/
│   │   │       └── Shell.jsx # StatusBar + TabBar
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── MarketPage.jsx
│   │   │   ├── SeedsPage.jsx
│   │   │   ├── FertilizersPage.jsx
│   │   │   ├── DetailPage.jsx
│   │   │   ├── CartPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   ├── assets/
│   │   │   └── global.css
│   │   ├── App.jsx           # Router + protected routes
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env
│
├── docker-compose.yml
└── README.md
```

---

## API Endpoints

| Method | Endpoint                  | Auth | Description                        |
|--------|---------------------------|------|------------------------------------|
| POST   | /api/auth/register        | —    | Register with mobile + password    |
| POST   | /api/auth/login           | —    | Login, returns JWT                 |
| POST   | /api/auth/otp/request     | —    | Send OTP to mobile                 |
| POST   | /api/auth/otp/verify      | —    | Verify OTP, returns JWT            |
| GET    | /api/market-prices        | —    | Live commodity prices              |
| POST   | /api/market-prices/refresh| —    | Trigger immediate price refresh    |
| GET    | /api/seeds                | —    | Seeds catalog (filter + search)    |
| GET    | /api/seeds/{id}           | —    | Single seed detail                 |
| GET    | /api/fertilizers          | —    | Fertilizer catalog (filter+search) |
| GET    | /api/fertilizers/{id}     | —    | Single fertilizer detail           |
| GET    | /api/cart                 | JWT  | View user cart                     |
| POST   | /api/cart                 | JWT  | Add item to cart                   |
| PATCH  | /api/cart/{id}            | JWT  | Update item quantity               |
| DELETE | /api/cart                 | JWT  | Clear cart                         |

Interactive API docs: **http://localhost:8000/docs**

---

## Quick Start (Local)

### Option A — Docker Compose (recommended)

```bash
git clone <repo-url>
cd agrimart
docker-compose up --build
```

- Frontend: http://localhost:5173  
- Backend API: http://localhost:8000  
- Swagger docs: http://localhost:8000/docs

---

### Option B — Manual

**Backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # edit SECRET_KEY
uvicorn app.main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
cp .env.example .env          # VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

---

## Environment Variables

### Backend `.env`

| Variable                        | Default                              | Description                     |
|---------------------------------|--------------------------------------|---------------------------------|
| DATABASE_URL                    | sqlite+aiosqlite:///./agrimart.db    | Database connection string      |
| SECRET_KEY                      | *(change this)*                      | JWT signing secret (32+ chars)  |
| ALGORITHM                       | HS256                                | JWT algorithm                   |
| ACCESS_TOKEN_EXPIRE_MINUTES     | 1440                                 | Token lifetime (24h)            |
| OTP_EXPIRE_SECONDS              | 300                                  | OTP validity (5 min)            |
| PRICE_REFRESH_INTERVAL_SECONDS  | 30                                   | Market price refresh interval   |
| CORS_ORIGINS                    | ["http://localhost:5173"]            | Allowed frontend origins        |

### Frontend `.env`

| Variable             | Default                   | Description          |
|----------------------|---------------------------|----------------------|
| VITE_API_BASE_URL    | http://localhost:8000     | Backend URL          |

---

## User Stories Implemented

| ID | Story                         | Status |
|----|-------------------------------|--------|
| 1  | Live market prices (30s refresh)  | ✅ |
| 2  | Premium seeds catalog         | ✅ |
| 3  | Fertilizer catalog + NPK      | ✅ |
| 4  | Mobile-responsive design      | ✅ |
| 5  | Search & filter products      | ✅ |
| 7  | User authentication (JWT+OTP) | ✅ |

---

## Switching to PostgreSQL

Change `DATABASE_URL` in `.env`:

```
DATABASE_URL=postgresql+asyncpg://user:password@localhost/agrimart
```

Add to `requirements.txt`:
```
asyncpg==0.29.0
```

---

## Notes

- OTP: In dev mode, the generated OTP is returned in the API response (`dev_otp` field). In production, integrate an SMS gateway (MSG91, Twilio) inside `auth_service.request_otp`.
- The price scheduler runs inside the FastAPI process using APScheduler. For production, consider moving to Celery + Redis.
- SQLite is used by default for zero-config local dev. Swap to PostgreSQL for production.
