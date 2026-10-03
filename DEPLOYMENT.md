# Deploying Cinema Management

The frontend can be hosted on Vercel. The Node.js and Python APIs can be
deployed as separate Render web services. MongoDB and Redis must be hosted
outside the frontend; use MongoDB Atlas and a Redis provider that accepts
TLS connections if it supplies a `rediss://` URL.

## 1. Deploy the APIs on Render

Create these Render **Web Services** from the GitHub repository. Set the
repository root directory to `backend`, use `npm ci --omit=dev` as the build
command, and use the listed start command. Each service uses Node.

| Render service | Start command | Health check |
| --- | --- | --- |
| `cinema-seat-management` | `node services/seat-management/src/server.js` | `/health` |
| `cinema-booking-order` | `node services/booking-order/src/server.js` | `/health` |
| `cinema-payment` | `node services/payment/src/server.js` | `/health` |
| `cinema-catalog` | `node services/catalog/src/server.js` | `/health` |

Give every service that uses MongoDB its own MongoDB Atlas database URI.
In Render, open the `cinema-catalog` service, go to **Environment**, and add
`MONGO_URI` with that service's MongoDB Atlas connection string (including the
database name, for example `cinema_catalog`). Set it in the Render dashboard,
not in `.env.example` or source control. Configure the other environment
variables using each service's `.env.example`; do not copy example passwords
or development secrets into production.

Set the service-to-service URLs to the deployed Render HTTPS URLs:

- Booking order: `SEAT_SERVICE_BASE_URL` and `PAYMENT_SERVICE_BASE_URL`
- Payment: `BOOKING_SERVICE_BASE_URL` and `FRAUD_DETECTION_URL`
- POS sales, if deployed: `SEAT_SERVICE_BASE_URL`
- Seat management: `REDIS_URI`

Use the same newly generated `INTERNAL_CALLBACK_SECRET` on booking-order and
payment, and set a strong `JWT_SECRET` on booking-order.

Deploy fraud detection as a separate Render Web Service with root directory
`fraud-detection`, build command `pip install -r requirements.txt`, start
command `uvicorn main:app --host 0.0.0.0 --port $PORT`, and health check
`/health`. Set `FRAUD_DETECTION_URL` on payment to this service's HTTPS URL.

For payments, configure `FRONTEND_RETURN_URL` to the Vercel site's
`/payment-result` URL, and set `VNP_RETURN_URL` and `VNP_IPN_URL` to the
payment service's public HTTPS URL with `/api/payments/vnpay-return` and
`/api/payments/vnpay-ipn`, respectively. The current API services allow
cross-origin requests from any origin; restrict CORS to the Vercel domain if
you change that policy for production.

The separate `auth`, `pos-sales`, and `notification` services are not required
by the current customer web app. Deploy them only if another client or feature
uses them.

## 2. Deploy the frontend on Vercel

Create a Vercel project for the same repository and configure:

- Root Directory: `frontend/web`
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

Add these Vercel environment variables for Production (and Preview if needed).
Use each Render service's public HTTPS URL without a trailing slash:

```env
VITE_BOOKING_API_URL=https://<booking-service>.onrender.com
VITE_SEAT_API_URL=https://<seat-service>.onrender.com
VITE_SEAT_SOCKET_URL=https://<seat-service>.onrender.com
VITE_CATALOG_API_URL=https://<catalog-service>.onrender.com
```

The `vercel.json` rewrite keeps client-side routes such as `/payment-result`
working on refresh. Vite embeds environment variables at build time, so trigger
a new Vercel deployment after changing them.

## 3. Data and operational notes

- Use separate MongoDB Atlas databases for booking, seats, and catalog. Add
  Atlas network access for the Render services; avoid exposing the database to
  the entire internet when a narrower allowlist is available.
- Set Render's `REDIS_URI` to a managed Redis endpoint. The seat service uses
  Redis for locks and Socket.IO pub/sub.
- Free Render services may sleep when idle. That can delay first requests and
  interrupt realtime seat updates; use an always-on plan for production.
- Vercel and Render must be connected to the GitHub repository and authorized
  to build it. Push the deployment files and frontend changes before creating
  the projects.
