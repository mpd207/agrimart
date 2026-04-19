# Render Deployment Checklist

This project is configured for a Render web service running the backend from `backend/`.

## 1. Create or update the Render service

- Use [render.yaml](/C:/Users/mahek/Downloads/agrimart-android-files/agrimart/render.yaml) as the source of truth.
- Confirm the service root is `backend`.
- Confirm the start command is `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

## 2. Set production environment values

Required for the API:
- `SECRET_KEY`: keep Render-generated value.
- `DATABASE_URL`: leave as `sqlite+aiosqlite:///./agrimart.db` unless you move to Postgres.
- `CORS_ORIGINS`: replace `https://your-frontend.onrender.com` with your real frontend URL.
- `DEBUG_OTP=false`
- `PRICE_REFRESH_INTERVAL_SECONDS=30`

Required for real SMS:
- `SMS_PROVIDER=twilio` if using Twilio.
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

Use these instead if you prefer MSG91:
- `SMS_PROVIDER=msg91`
- `MSG91_AUTH_KEY`
- `MSG91_TEMPLATE_ID`
- `MSG91_FLOW_ID`

Required for the app admin account:
- `ADMIN_MOBILE`: the phone number of the person who manages catalog, prices, and order status.
- `ADMIN_PASSWORD`: password used for admin login.
- `ADMIN_NAME`: display name for that admin user.

Optional fallback admin automation key:
- `ADMIN_API_KEY`: keep the generated value for protected backend maintenance calls.

## 3. Redeploy

- Trigger a fresh deploy after updating the environment variables.
- The startup sequence will:
  - create any missing tables
  - add the `users.role` column if an older database is already present
  - add the `orders.updated_at` column if needed
  - bootstrap the admin user from `ADMIN_MOBILE` and `ADMIN_PASSWORD`

## 4. Smoke-test after deploy

Check backend health:
- `GET /health`

Check farmer flow:
- register or log in as a farmer
- request OTP and confirm no `dev_otp` is returned in production
- browse seeds and fertilizers
- place an order

Check admin flow:
- log in using `ADMIN_MOBILE` and `ADMIN_PASSWORD`
- open `/admin/orders`
- update one order from `Placed` to `Processing`, then to `Shipped`
- confirm the farmer sees the updated status and receives a notification

Check alerts:
- create a price alert
- wait for a price refresh cycle or trigger one during testing
- confirm a notification appears when the threshold is crossed

## 5. Important production notes

- If `SMS_PROVIDER` is set to `twilio` or `msg91` but credentials are missing, OTP requests now fail loudly with `503` instead of silently falling back to dev OTP mode.
- The in-app admin is a normal authenticated user with `role=admin`; this is now the main path for operational updates.
- SQLite works for demos, but for real multi-user production you should move Render persistence to a managed database and add proper migrations.
