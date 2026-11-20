# LuxuryStay Hotel Management System — Developer Guide

This guide describes the current implementation, local setup, feature modules, API groups, access rules, and important data behavior. It is intended for developers who need to run, maintain, or extend the project.

For a non-technical, presentation-ready explanation, see [Project Overview](./PROJECT_OVERVIEW.md).

## 1. Project at a glance

LuxuryStay is a responsive hotel operations application with a React single-page frontend and an Express REST API backed by MongoDB/Mongoose. It is a modular monolith: feature areas have separate routes, controllers, models, and UI pages, but they run as one frontend and one backend application.

```text
Browser / installable PWA
        |
        | HTTPS/JSON requests under /api
        v
React + Vite frontend  --->  Express API  --->  MongoDB
        |                         |                 |
        |                         +--> Stripe       +--> operational records
        |                         +--> Cloudinary (room/avatar images)
        |                         +--> Web Push
        +--> Service worker / browser notifications
```

### Main technologies

| Area | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS, Lucide icons |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose models |
| Authentication | JSON Web Tokens and bcrypt |
| Payments | Stripe Checkout and webhook |
| Image storage | Cloudinary |
| Push notifications | Web Push / VAPID |
| PDF invoices | PDFKit |

## 2. Repository map

```text
backend/
  app.js                 Express middleware and API mounts
  server.js              Environment setup, database connection, HTTP listener
  config/                MongoDB, Stripe, and Cloudinary clients
  controllers/           Feature request handling and business rules
  middleware/            Authentication, roles, uploads, and errors
  models/                Mongoose schemas
  routes/                REST endpoints and route-level access rules
  utils/                 Tokens, invoices, notifications, and Web Push
  seeder.js              Development admin seeder

frontend/
  public/                PWA manifest, service worker, and icons
  src/
    api/                 Shared API client
    components/          Reusable navigation, dialogs, cards, and forms
    context/             Authentication state
    layouts/             Authenticated and guest layouts
    lib/                 Formatting and feature helpers
    pages/               Feature screens
    routes/              Protected and role-gated page wrappers
    App.jsx              Application page selection and role checks
    router.js            Small history-based navigation helper
```

`App.jsx` and `router.js` implement the app's current path handling. The frontend API helper is located at `frontend/src/api/axios.js`, but it uses the browser `fetch` API rather than Axios.

## 3. Local development setup

### Prerequisites

- Node.js and npm
- MongoDB connection string (local or hosted)
- Stripe test credentials to load the backend payment module
- Cloudinary credentials for image uploads
- VAPID keys if browser push notifications are to be tested

### Backend

1. In `backend/`, create a private `.env` file using `.env.example` as a starting point.
2. Fill in the required environment variables described in [Environment variables](#4-environment-variables).
3. Install packages and start the API:

   ```sh
   cd backend
   npm install
   npm run dev
   ```

   The default API port is `2008`; the health response is available at `/`.

4. To create the development admin account, run `node seeder.js` from `backend/`. The seeder contains a fixed development credential; do not use it in production. Replace the credential and remove or secure the seeder before any production deployment.

### Frontend

1. In `frontend/`, optionally set `VITE_API_URL` in a local `.env` file. The default is `http://localhost:2008/api`.
2. Install packages and start Vite:

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

### Validation commands

```sh
# frontend/
npm run lint
npm run build

# backend/
npm run dev
```

There is currently no automated test script configured in either package manifest.

## 4. Environment variables

Never commit `.env` files, API keys, passwords, private VAPID keys, or live payment credentials. Keep secrets in the deployment platform's secret manager.

### Backend

| Variable | Purpose |
|---|---|
| `PORT` | HTTP port; defaults to `2008`. |
| `MONGODB_URI` | MongoDB connection string. |
| `JWT_SECRET` | Secret used to sign and verify login tokens; use a strong unique value. |
| `JWT_EXPIRE` | Token lifetime passed to the JWT signer. |
| `NODE_ENV` | Controls development-only error details. |
| `FRONTEND_URL` | Comma-separated allowed frontend origins for CORS. |
| `STRIPE_SECRET_KEY` | Stripe secret key; the Stripe client is constructed during backend module loading. Use a test key locally. |
| `STRIPE_WEBHOOK_SECRET` | Verifies Stripe webhook signatures. |
| `STRIPE_CURRENCY` | Stripe checkout currency; defaults to `usd`. |
| `CLIENT_URL` | Frontend origin used in Stripe success and cancellation URLs; defaults to `http://localhost:5173`. |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name. |
| `CLOUDINARY_API_KEY` | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret. |
| `TAX_RATE` | Legacy fallback tax rate for new invoices until a hotel tax setting is stored. |
| `CURRENCY_LABEL` | Currency text used in generated invoice PDFs; defaults to `Rs.`. |
| `VAPID_PUBLIC_KEY` | Public key used by the browser to subscribe to Web Push. |
| `VAPID_PRIVATE_KEY` | Server-only Web Push private key. |
| `VAPID_SUBJECT` | VAPID contact URI, typically a `mailto:` address. |

`FRONTEND_URL` controls API CORS; `CLIENT_URL` controls Stripe redirects. Configure both for the deployed frontend origin.

### Frontend

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend API base URL, including `/api`; defaults to `http://localhost:2008/api`. |

Do not put backend secrets in `VITE_*` variables: frontend variables are bundled into browser code.

## 5. Feature modules

| Module | Frontend | Backend | What it does |
|---|---|---|---|
| Authentication and profile | `Login`, `Register`, `Profile`, auth context | `authRoutes`, `authController`, `User` | Register/login, restore a session, update profile/avatar/preferences, change password, and log out. |
| User management | `Users` | `userRoutes`, `userController`, `User` | Staff account creation, user listing/search, role and active-account administration. |
| Rooms | `Rooms`, `RoomCard`, `RoomDetailsModal`, `RoomFormModal` | `roomRoutes`, `roomController`, `Room` | Room inventory, filters, photos, amenities, availability, room status, and role-based create/edit/delete actions. |
| Reservations | `Reservations`, `ReservationForm`, `MyBookings`, `ReservationDetailsModal` | `reservationRoutes`, `reservationController`, `Reservation` | Guest or staff bookings, availability, guest selection for staff, cancellation, check-in, and check-out. |
| Invoices and billing | `Invoices`, `InvoiceDetails`, `MyInvoices`, `Billing` | `invoiceRoutes`, `invoiceController`, `Invoice` | Invoice creation, charges, discounts, payment status, PDF downloads, guest invoices, and billing summary. |
| Online payments | `PaymentStatus` | `paymentRoutes`, `paymentController` | Stripe Checkout, webhook confirmation, and payment verification. |
| Housekeeping | `Housekeeping` | `housekeepingRoutes`, `housekeepingController`, `HousekeepingTask` | Create, assign, claim, start, complete, and cancel room-cleaning tasks. |
| Maintenance | `Maintenance`, `MyIssues`, maintenance modals | `maintenanceRoutes`, `maintenanceController`, `MaintenanceRequest` | Track room or location issues, assignment/status lifecycle, and guest/staff reports. |
| Guest services | `Services`, `MyServices`, `ServiceRequestModal` | `serviceRoutes`, `serviceController`, `ServiceRequest` | Guests request services; staff updates progress and may add a completed service charge to an unpaid invoice. |
| Feedback | `Feedback`, `GuestFeedbackModal` | `feedbackRoutes`, `feedbackController`, `Feedback` | Guests submit stay feedback; website submissions can enter moderation; managers/admins approve or reject it. Approved public feedback can be read through the public endpoint. |
| Notifications and PWA | `Notifications`, `NotificationBell`, `MobileNavigation` | `notificationRoutes`, `notificationController`, `Notification`, `PushSubscription` | Persistent in-app notifications, read state, push subscriptions, and browser notification delivery. |
| Hotel settings | `Settings` | `settingsRoutes`, `settingsController`, `HotelSettings` | Hotel tax, room-type rate defaults, check-in/out times, and guest-facing policies. |
| Reports and analytics | `Dashboard`, `Billing`, `Analytics` | `reportRoutes`, `reportController` | Operational dashboard, invoice report, and date-filtered booking, occupancy, cancellation, and revenue metrics. |

## 6. Roles and access

Backend routes enforce access with `protect` (valid token and active account) followed by `authorize(...)` where role restrictions apply. The frontend also hides or blocks pages by role; frontend checks are not a substitute for backend authorization.

| Role | Typical capabilities |
|---|---|
| `admin` | Full hotel operations, staff/user administration, settings, analytics, feedback moderation, and invoice controls. |
| `manager` | Room and reservation operations, staff workflows, settings, analytics, and feedback moderation; some actions such as deleting rooms/users or voiding invoices are admin-only. |
| `receptionist` | Guest and reservation operations, room-status updates, invoices, and operational requests. |
| `housekeeping` | Assigned housekeeping work, selected room-status updates, and issue reporting. |
| `guest` | Own profile, bookings, invoices, feedback, service requests, and issue reports. |

### Important role details

- Self-registration does not accept a role from the request; new users use the schema's `guest` default.
- Room creation/editing is admin/manager; room deletion is admin-only.
- Room status can be changed by admin, manager, receptionist, or housekeeping.
- Reservation check-in/check-out are staff operations; guests can access their own bookings and cancel under controller rules.
- Settings, analytics, billing reports, and feedback moderation are admin/manager-only.
- User role/status changes are more restricted than user listing; consult `backend/routes/userRoutes.js`.

## 7. API overview

The backend mounts all feature APIs under `/api`. This is a module index; use each route file for request bodies, filters, and exact authorization.

| Base path | Representative endpoints |
|---|---|
| `/api/auth` | `POST /register`, `POST /login`, `GET /me`, `PUT /update-profile`, `PUT /change-password`, `POST /logout` |
| `/api/users` | `POST /`, `GET /`, `GET /:id`, `PUT /:id`, `PATCH /:id/status` |
| `/api/rooms` | `GET /public` for the public website catalog; authenticated `GET /`, `GET /available`, `GET /:id`, `POST /`, `PUT /:id`, `PATCH /:id/status`, `DELETE /:id` |
| `/api/reservations` | `POST /`, `GET /`, `GET /my`, `GET /:id`, `PATCH /:id/cancel`, `PATCH /:id/check-in`, `PATCH /:id/check-out` |
| `/api/invoices` | `POST /`, `GET /`, `GET /my`, `GET /report`, `GET /:id`, `GET /:id/pdf`, charge/discount/pay/void actions |
| `/api/payments` | `POST /create-checkout-session`, `GET /verify/:invoiceId`; Stripe webhook is `POST /api/payments/webhook` |
| `/api/housekeeping` | Task listing/creation, `/my`, `/open`, and assign/claim/start/complete/cancel actions |
| `/api/maintenance` | Request listing/creation, `/my`, detail, status update, and cancellation |
| `/api/services` | Request listing/creation, `/my`, detail, status update, and cancellation |
| `/api/feedback` | Public read/submit, guest submit/own feedback, staff listing, and moderation |
| `/api/notifications` | List, read one/read all, push key, subscribe, and unsubscribe |
| `/api/settings` | `GET /` for authenticated users; `PUT /` for admin/manager |
| `/api/reports` | `GET /analytics` for admin/manager |

The Stripe webhook route is registered before `express.json()` so Stripe signature verification receives the raw request body.

## 8. Data and business rules

### Main relationships

- A `Reservation` refers to one `Guest` and one `Room`.
- A reservation stores its nightly price, total amount, and night count at booking time. Later room rate changes do not rewrite that booking.
- An `Invoice` refers to one reservation and guest. The reservation field is unique, so the intended flow is one invoice per reservation.
- An invoice stores its tax rate, charges, discount, tax amount, total, payment method, and `paidAt`.
- Guest service requests refer to a reservation and room. A service charge is added to an invoice only through the supported completion flow and only while that invoice is unpaid.
- Housekeeping tasks, maintenance requests, and service requests each have their own status lifecycle and timestamps.

### Status enums

- Room: `available`, `occupied`, `cleaning`, `maintenance`.
- Reservation: `confirmed`, `checked-in`, `checked-out`, `cancelled`.
- Invoice: `unpaid`, `paid`, `void`.
- Housekeeping task: `pending`, `in-progress`, `completed`, `cancelled`.
- Maintenance request: `open`, `in-progress`, `resolved`, `cancelled`.
- Service request: `pending`, `in-progress`, `completed`, `cancelled`.
- Feedback: `pending`, `approved`, `rejected`.

### Settings behavior

- Saved room-type rates are defaults for rooms being created; they do not bulk-update existing rooms.
- Tax settings are copied to new invoices. Existing invoices retain their own tax-rate snapshot.
- If no persisted tax setting exists, invoice creation falls back to `TAX_RATE`, then to zero.
- Guest policies are loaded from `/api/settings` and shown on the reservation review screen.

### Analytics interpretation

- Date ranges accept `YYYY-MM-DD` and are capped at 366 days.
- Paid revenue is grouped by invoice payment date and uses invoice totals.
- Room revenue uses `roomCharges`; ADR is room revenue divided by the nights on reservations attached to paid invoices in the selected paid-date range.
- RevPAR is room revenue divided by available room-nights.
- Occupancy uses reservations overlapping the selected dates and the current room count as the denominator. The application does not keep historical room inventory, so past occupancy is an estimate based on today's inventory.
- Outstanding invoice totals are a current snapshot, not restricted to the selected date range.

## 9. Notifications, PWA, and images

- Notification records are event-triggered and addressed to selected users or roles. The actor is excluded when an actor ID is supplied; old events are not backfilled as notifications.
- In-app notifications are stored in MongoDB. Browser push is an additional channel and requires VAPID configuration, a saved browser subscription, browser permission, and a supported secure context (HTTPS or localhost).
- The service worker is registered by `frontend/src/main.jsx`. It caches shell/static assets and does not cache `/api/` responses.
- Room and profile images are uploaded to Cloudinary. Configure its three credentials before using image upload flows.
- A PWA manifest and app icons are under `frontend/public/`.

## 10. Security and deployment checklist

- Use strong, unique `JWT_SECRET`, database credentials, Stripe keys, Cloudinary secrets, and VAPID private keys.
- Keep `.env` files out of source control and use test credentials for local/demo payment flows.
- Replace the fixed development admin credential in `backend/seeder.js` before deployment; never use the seeder's built-in credential in production.
- Set `NODE_ENV=production`, `FRONTEND_URL`, and `CLIENT_URL` to the deployed origins.
- Configure the Stripe webhook endpoint and its signing secret. Do not mark an online payment successful from a browser redirect alone; the webhook/payment verification flow is part of the payment process.
- Use HTTPS for deployed sessions, uploads, and browser notifications.
- Public website feedback submissions are rate-limited to five attempts per 15-minute window by the configured route limiter.
- Review role restrictions in both route middleware and controllers when adding a feature.

## 11. Known scope boundaries

- The application has a guest-facing authenticated booking experience, but not a full public hotel marketing website.
- The public feedback API exists for a future public website integration.
- Invoice email delivery is not currently implemented.
- Analytics occupancy for past periods is approximate because historical room inventory is not recorded.
- The package manifests do not currently define an automated test suite.


<!-- FEEDBACK WORKING ON WEBSITE HOW TO  SHOW  -->
Guest checkout ke baad My Bookings se 1–5 star rating aur comment submit kar sakta hai. Har reservation ke liye ek hi review allow hai; submission pending rahegi.
Admin/manager Feedback page par review karke approve ya reject kar sakte hain.
Future website ke liye POST /api/feedback/public aur GET /api/feedback/public endpoints ready hain. Public API sirf approved feedback deti hai; website submissions pending rehti hain aur rate-limited hain.

Public room catalog ke liye GET /api/rooms/public ready hai. Yehi Room records admin/manager `/api/rooms` se create/update karte hain; website ko static room cards maintain karne ki zaroorat nahi. Public response mein room number, floor aur internal status include nahi hote; maintenance rooms hide rehte hain.
Validation pass: backend syntax/import/model checks, frontend ESLint aur production build. Live database/API flow test nahi hua. Backend restart karke guest/admin accounts se flow manually check kar lena.

Files added: Feedback.js, feedbackController.js, feedbackRoutes.js, GuestFeedbackModal.jsx, Feedback.jsx.
