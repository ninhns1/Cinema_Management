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

Start the fraud service before accepting payments. The payment service calls it at
`FRAUD_DETECTION_URL` and rejects the payment when the risk score reaches
`FRAUD_THRESHOLD`. If the fraud service is unavailable, payments are blocked by
default (`FRAUD_DETECTION_REQUIRED=true`).

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
- Card and e-wallet payments create a signed VNPay sandbox redirect URL after fraud screening
- VNPay IPN verifies the HMAC-SHA512 signature and finalizes the booking only after a successful response
- Cash payments are recorded as completed at the counter
- Refunds are idempotent in the payment service demo adapter

## Payment configuration

Copy the example environment files and set the same internal callback secret in
both booking-order and payment services:

```env
FRAUD_DETECTION_URL=http://localhost:8000
FRAUD_DETECTION_REQUIRED=true
FRAUD_THRESHOLD=0.5
VNP_TMN_CODE=your_vnpay_sandbox_terminal_code
VNP_HASH_SECRET=your_vnpay_sandbox_hash_secret
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=https://your-public-host/api/payments/vnpay-return
VNP_IPN_URL=https://your-public-host/api/payments/vnpay-ipn
FRONTEND_RETURN_URL=http://localhost:5173/payment-result
BOOKING_SERVICE_BASE_URL=http://localhost:4003
INTERNAL_CALLBACK_SECRET=the-same-secret-in-both-services
```

For local VNPay testing, `VNP_IPN_URL` must be reachable from the internet.
Use a tunnel such as ngrok and configure its HTTPS URL in the VNPay sandbox
dashboard. Never commit merchant credentials or real payment secrets.

Payment endpoints:

- `POST /api/bookings/pay`: starts payment for a held booking
- `GET /api/payments/vnpay-return`: validates the browser return and redirects to the frontend
- `GET /api/payments/vnpay-ipn`: validates VNPay server notification and finalizes the booking
- `POST /api/payments/refund`: creates an idempotent refund record in the demo adapter

## Environment files

Each service has `.env.example`:

- `backend/services/seat-management/.env.example`
- `backend/services/pos-sales/.env.example`
- `backend/services/booking-order/.env.example`
- `backend/services/payment/.env.example`
- `backend/services/notification/.env.example`
