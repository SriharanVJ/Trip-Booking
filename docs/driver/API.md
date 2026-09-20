# Acting Driver API

Backend for **Acting Driver** — customers book a driver to drive *their own* vehicle,
either by location (A→B) or by the hour.

- **Base URL**: `http://localhost:8000`
- **Interactive docs (Swagger)**: <http://localhost:8000/docs>
- **Health**: `GET /health`

## Setup

```bash
cd backend
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt

# 1. Create the database (adjust to your Postgres setup):
#    createdb acting_driver
# 2. Configure backend/.env (see .env.example)
# 3. Create tables + seed pricing/admin:
alembic upgrade head
python -m app.seed
```

**OTP delivery is email** (`OTP_PROVIDER=email`, the default): you need a real
SMTP account in `.env` — with Gmail that's your Gmail address in
`SMTP_USER`/`SMTP_FROM_ADDRESS` and a 16-char **App Password** in
`SMTP_PASSWORD` (Google Account → Security → 2-Step Verification → App
passwords; your normal account password will **not** work — Google generates
the 16-char value for you and you paste it into `.env`). Any generic SMTP
provider (Brevo, Resend, …) works the same way — switching is `.env`-only. The
app **refuses to boot** until these three are set.

```bash

# Run
uvicorn main:app --reload --port 8000
```

`REDIS_URL` may stay empty in dev — an in-memory fallback handles OTP storage and
the online-driver geo index for a single instance.

## Auth flow (phone + OTP over email)

```
POST /api/auth/send-otp    { "phone": "9876543210", "email": "you@example.com" }
POST /api/auth/verify-otp  { "phone": "9876543210", "role": "customer", "otp": "1234" }
                           → { access_token, token_type: "bearer", user: { ..., email, is_new_user } }
```

- `phone` **and** `email` are required on **every** send-otp call. The phone
  stays the account identity; the OTP itself is delivered to the email.
- Email semantics per call:
  - **New phone number** → signup: the code goes to the given email and the
    account is created with it **only after a successful verify**. If the email
    is already taken → `409`:
    `"This email is already associated with another account."`
  - **Existing number + matching email** → normal login (the stored email wins).
  - **Existing number + a different email** → `409`:
    `"This phone number is registered with a different email address."`
  - Admin-created accounts start with a placeholder
    (`<phone-digits>@phone.placeholder`); the **first send-otp adopts** the
    requested email (conflict-checked) and it shows up in admin listings too.
- verify-otp keeps its original shape — `phone` + `otp` + `role`; the email
  from the matching send-otp is remembered server-side until verify.
- Emails are normalized server-side (trimmed, lower-cased) before lookup and
  storage.
- Three OTP provider modes (`OTP_PROVIDER`):
  - `email` — **default (the POC mode)**. The code lifecycle is the app's own
    (4-digit, TTL 5 min, 3 sends / 10 min, 5 wrong attempts — same limits as
    mock); delivery goes over **SMTP** to the given address. The code is never
    echoed in the response, even with `OTP_ECHO_IN_RESPONSE=true`. SMTP
    problems map to `503` `EMAIL_SEND_FAILED` ("Couldn't send the verification
    email…" / "…misconfigured" for bad credentials).
  - `mock` — no real delivery: the code is logged to the server console (and
    echoed in the send-otp response while `OTP_ECHO_IN_RESPONSE=true`).
  - `twilio_verify` — real SMS via **Twilio Verify**: the code is generated,
    delivered and validated by Twilio; send-otp responses contain no `otp`
    field and `expires_in_seconds` is 600. The POC runs on a **trial account**,
    so only numbers added as **Verified Caller IDs** in the Twilio console can
    receive codes — anything else gets:

    ```json
    { "error": { "code": "PHONE_NOT_VERIFIED", "message": "This number can't receive OTPs yet in this test environment. Contact support to get it added." } }
    ```

    (SMS to Indian numbers is blocked by DLT sender-ID registration, which is
    why `email` is the POC default; `twilio_verify` stays selectable.)
  - A restart is required after changing `OTP_PROVIDER` (uvicorn `--reload`
    does not watch `.env`).
- All authenticated calls use `Authorization: Bearer <access_token>`.
- Phone numbers are normalized server-side (`98765 43210` → `+919876543210`).
- One account per phone, one role per account: verifying an OTP for a different
  role than the number is registered as → `403`
  (`"This phone number is registered as a customer account. Please log in from
  the customer app."`).
- Admin: `POST /api/admin/login` with `ADMIN_PHONE` / `ADMIN_PASSWORD` from `.env`.

## Errors

All errors share one envelope:

```json
{ "error": { "code": "booking_not_found", "message": "Booking not found" } }
```

Validation failures return `422` with the same shape plus a `details` array.

## Endpoints

### Auth
| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/send-otp` | Body: `phone` + `email` (both required). Max 3 sends / 10 min. Email mode: 4-digit code to the inbox, TTL 5 min, never echoed. Mock: logged + echoed in dev. Twilio Verify: no `otp` field, code valid 10 min |
| POST | `/api/auth/verify-otp` | Returns JWT; max 5 wrong attempts |
| POST | `/api/admin/login` | phone + password from env |

### Customer
| Method | Path | Notes |
|---|---|---|
| GET / PUT | `/api/customer/profile` | name, email (optional on PUT; 409 if taken); GET also returns `pending_dues` |
| POST | `/api/bookings` | Body: `type`, `pickup_lat/lng`, `drop_lat/lng` (location) **or** `hours` (hourly). Starts driver matching. Response warns if dues pending |
| GET | `/api/bookings/fare-estimate?type=&pickup_lat=&pickup_lng=&drop_lat=&drop_lng=&hours=` | Pre-booking estimate, nothing is created |
| GET | `/api/bookings/{booking_id}` | Detail incl. status audit trail |
| POST | `/api/bookings/{booking_id}/cancel` | 15% fee if a driver was already assigned |
| POST | `/api/bookings/{booking_id}/rate` | 1–5 + optional review, completed trips only |
| GET | `/api/customer/bookings?status=` | History |
| GET | `/api/customer/dues` | Pending cancellation fees |

### Driver
| Method | Path | Notes |
|---|---|---|
| GET / PUT | `/api/driver/profile` | name, license_no, email (optional on PUT; 409 if taken) |
| POST | `/api/driver/documents` | multipart license upload → resets verification to pending |
| PATCH | `/api/driver/online-status` | `{ "is_online": true, "lat": .., "lng": .. }` — requires approval |
| PATCH | `/api/driver/location` | Live location; broadcast to connected customer while on trip |
| POST | `/api/bookings/{id}/accept` | First accept wins (409 otherwise); reveals phones; charges pickup fee |
| POST | `/api/bookings/{id}/reject` | Pre-assignment: skipped for this search; after assignment: driver-cancel |
| POST | `/api/bookings/{id}/start-trip` | → `trip_started` |
| POST | `/api/bookings/{id}/complete-trip` | → `completed`, payment due |
| POST | `/api/bookings/{id}/mark-paid` | → payment `collected` |
| GET | `/api/driver/bookings?status=` | Assigned bookings |
| GET | `/api/driver/earnings` | Collected vs pending totals |

### Admin
| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/drivers?verification_status=` | With profile + docs (each item includes `email` and `created_by`) |
| POST | `/api/admin/drivers` | Create a driver directly — no OTP needed (see below) |
| PATCH | `/api/admin/drivers/{id}/verify` | `{ "action": "approve" \| "reject" }` |
| POST | `/api/admin/customers` | Create a customer directly — no OTP needed (see below) |
| GET | `/api/admin/customers?search=&created_by=&limit=&offset=` | All customers, paginated (each item includes `email`; search also matches it) |
| GET | `/api/admin/bookings?status=&limit=&offset=` | All bookings |
| GET / PUT | `/api/admin/pricing-config` | Rates, free-pickup km, fee %, matching radius |
| GET | `/api/admin/customers/dues` | Customers with pending dues |
| PATCH | `/api/admin/customers/{id}/clear-dues` | Zero out dues |

#### Admin-created accounts

Besides self-signup (phone + OTP), admins can onboard accounts directly — useful
for onboarding drivers who walk in with their license. No OTP is involved at
creation; the person logs in later through the **normal OTP flow** (their phone
number + their email — which replaces the account's placeholder email on that
first login) and lands in the pre-created account. Every driver/customer row
carries `created_by` (`"self_signup"` \| `"admin"`) plus `created_at` as the audit trail.

**Create a driver** — `POST /api/admin/drivers` (admin only) → `201`

```json
{
  "phone": "9876543210",
  "name": "Ravi Kumar",
  "email": "ravi@example.com",
  "license_no": "TN01 20230012345",
  "license_doc_url": null,
  "pre_verified": true
}
```

- `phone` and `license_no` are required; `pre_verified` is required. Missing/garbage → `422`.
- `email` is optional; when omitted the account starts with the placeholder
  `<phone-digits>@phone.placeholder` until its first OTP login adopts the real
  one.
- `pre_verified: true` → the driver is trusted immediately (`is_verified: true`,
  `verification_status: "approved"`, can go online right away).
- `pre_verified: false` → same starting state as self-signup (`pending`); the
  driver uploads docs and waits for admin approval. `license_doc_url` is
  optional in both cases.
- Re-uploading a document later still resets verification to `pending`, whatever `created_by` is.

Response (`201`) is the full driver profile, same shape as the
`GET /api/admin/drivers` items:

```json
{
  "driver_id": "6b50e11d-cb4e-4b82-8640-74fc547b3aab",
  "user_id": "c6c3f093-4c16-4e46-90e6-9d993872e14f",
  "name": "Ravi Kumar",
  "phone": "+919876543210",
  "email": "ravi@example.com",
  "license_no": "TN01 20230012345",
  "license_doc_url": null,
  "is_verified": true,
  "verification_status": "approved",
  "is_online": false,
  "current_lat": null,
  "current_lng": null,
  "rating_avg": 0.0,
  "total_trips": 0,
  "cancellation_count": 0,
  "created_by": "admin",
  "created_at": "2026-09-14T06:19:02.648932+00:00"
}
```

**Create a customer** — `POST /api/admin/customers` (admin only) → `201`

```json
{ "phone": "9876543211", "name": "Priya S", "email": "priya@example.com" }
```

```json
{
  "customer_id": "0fdad3e1-40e5-449b-9606-1e2ae1ea5893",
  "user_id": "f12fa5ce-ad38-49cf-bf7f-b05b9035ff3c",
  "name": "Priya S",
  "phone": "+919876543211",
  "email": "priya@example.com",
  "pending_dues": 0.0,
  "created_by": "admin",
  "created_at": "2026-09-14T06:19:51.839086+00:00"
}
```

**Duplicate phone or email** → `409` for both endpoints — the phone must not
exist for *any* role (customer, driver, or admin), and the email must not be
taken by any account:

```json
{ "error": { "code": "CONFLICT", "message": "A user with this phone number or email already exists." } }
```

**List customers** — `GET /api/admin/customers` (admin only)

| Query | Notes |
|---|---|
| `search` | Case-insensitive match on phone, name, or email |
| `created_by` | `admin` or `self_signup` |
| `limit` / `offset` | Pagination (default 50, max 200) |

```json
{
  "customers": [
    {
      "customer_id": "…",
      "user_id": "…",
      "name": "Priya S",
      "phone": "+919876543211",
      "email": "priya@example.com",
      "pending_dues": 0.0,
      "created_by": "admin",
      "created_at": "2026-09-14T06:19:51.839086+00:00"
    }
  ],
  "count": 1,
  "total": 1
}
```

## WebSockets

```
ws://localhost:8000/ws/driver/{driver_user_id}?token=<jwt>
ws://localhost:8000/ws/customer/{customer_user_id}?token=<jwt>
```

`token` must be the user's own JWT and match the path id + role, else the socket
is closed with code `4401`. Sending the text `ping` answers `{"event": "pong"}`.

When a driver socket closes with no replacement connection (logout, tab close,
crash), the backend marks the driver offline and drops them from the matching
pool — except mid-trip: a driver on an assigned/started booking stays online.

Every message is an envelope: `{"event": "<name>", "data": {...}}`. Rich-object
events wrap the object (`booking:new_request` → `data.booking`, the coarsened
booking; `booking:accepted` → `data.booking` + `data.driver`); simple
notifications use flat fields (`data.booking_id`, `data.status`, `data.message`).

| To | Event | When |
|---|---|---|
| driver | `booking:new_request` | Matching round offers a booking (`data.booking`, pickup coarsened) |
| driver | `booking:cancelled` | Customer cancelled an offer/assignment |
| customer | `booking:accepted` | Driver accepted (driver contact + phone now revealed) |
| customer | `booking:status_update` | `trip_started` / `completed` / `payment_collected` |
| customer | `booking:cancelled` | Driver cancelled after assignment |
| customer | `booking:no_drivers` | Search exhausted all radius attempts |
| customer | `driver:location_update` | Driver GPS while on their trip |
| customer | `booking:rated` | Rating submitted |

## Fare & cancellation rules (spec)

- **Location**: `distance_km × ₹15/km` + pickup charge
- **Hourly**: `hours × ₹150/hr` + pickup charge
- **Pickup charge**: first **3 km free**, then ₹15/km — known only when a driver
  accepts, so booking creation returns the base fare and the final total is
  confirmed at accept time
- **Cancellation**: 15% of total fare **only** when the customer cancels after a
  driver was assigned; accumulates in the customer's `pending_dues`
- Driver cancellations are free but tracked in `driver.cancellation_count`

## Where things live

```
app/
  api/routes/      auth, customer, driver, admin  (thin controllers)
  services/        business logic: booking, matching, fare, cancellation,
                   distance (mock → Google), otp, driver, admin, pricing
  models/          SQLAlchemy models (users, customers, drivers, bookings,
                   status_log, ratings, pricing_config)
  schemas/         Pydantic request models
  sockets/         ConnectionManager + WS routes (event emit helpers)
  core/            config (pydantic-settings), db, redis, security (JWT)
alembic/           migrations        tests/   pytest suite
```

Background matching runs in-process (one asyncio task per booking). For
multi-instance deploys move it to Celery — the handoff points are marked in
`app/services/matching_service.py` and `booking_service.py`.
