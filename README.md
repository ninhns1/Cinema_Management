# Cinema Management

## Project layout

- frontend: UI application and feature components
- backend: microservices for cinema business flows
- database: MongoDB and infrastructure setup

## Directory tree

- frontend/web: customer + admin web app
- backend/services/seat-management: single source of truth for seats
- backend/services/pos-sales: sales channels (POS, app, agency)
- backend/services/booking-order: booking lifecycle
- backend/services/payment: payment integration layer
- backend/services/notification: outbound notifications
- database: docker compose and db notes

## Quick start

1. Start database and cache:
   - `cd database`
   - `docker compose up -d`
2. Install backend dependencies:
   - `cd ../backend`
   - `npm install`

3. Install frontend dependencies:
   - `cd ../frontend/web`
   - `npm install`

## Run services

From `backend` folder:

- `npm run dev`

- `npm run dev:seat`
- `npm run dev:pos`
- `npm run dev:booking`
- `npm run dev:payment`
- `npm run dev:notification`

From `frontend/web` folder:

- `npm run dev`

From `fraud-detection` folder:

- `python -m pip install -r requirements.txt`
- `uvicorn main:app --host 0.0.0.0 --port 8000`

## Implemented architecture

- Authentication is provided by the booking-order service with `/api/auth/register` and `/api/auth/login` routes.
- User accounts are stored in MongoDB `users` collection with password hash values.
- Seat Management Service is the central source of truth for seat state
- POS/Sales Service is a separate entry service for counters/agencies/apps
- Hold seat flow includes:
  - distributed lock in Redis
  - optimistic locking with `version` field in MongoDB
  - hold TTL with `expiresAt`
  - periodic expired-hold release
- Realtime seat updates are broadcast through Socket.IO + Redis pub/sub
- Booking flow screens payment with fraud detection, charges the payment service, then confirms the held seat
- Payment service exposes a demo charge adapter and requires the fraud service by default

## Environment files

Each service has `.env.example`:

- `backend/services/seat-management/.env.example`
- `backend/services/pos-sales/.env.example`
- `backend/services/booking-order/.env.example`
- `backend/services/payment/.env.example`
- `backend/services/notification/.env.example`
