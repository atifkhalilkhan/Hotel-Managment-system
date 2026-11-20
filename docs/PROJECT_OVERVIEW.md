# LuxuryStay Hotel Management System

## Presentation-ready project overview

**Project type:** Responsive hotel operations and guest-management application  
**Product name:** LuxuryStay  
**Audience:** Hotel owners, managers, reception, housekeeping staff, and hotel guests

For setup instructions and technical module details, see the [Developer Guide](./DEVELOPER_GUIDE.md).

## 1. Short introduction

LuxuryStay brings a hotel's day-to-day operations into one application. Hotel teams can manage rooms, reservations, guest profiles, service requests, invoices, payments, housekeeping, maintenance, feedback, notifications, and reports. Guests can manage their own stays through a responsive web app that can be installed on supported devices.

## 2. The problem and solution

Hotel work is often spread across spreadsheets, messages, paper notes, and separate billing tools. This makes room availability, guest requests, staff responsibilities, billing, and follow-up harder to coordinate.

LuxuryStay provides one connected operations system. A reservation links the guest, room, dates, and booked price; staff workflows handle the stay; invoices and service charges connect to the reservation; and notifications keep the relevant users informed.

## 3. Who uses it?

| User | Main responsibilities |
|---|---|
| Administrator | Hotel operations, user administration, settings, payments, reports, and feedback moderation. |
| Manager | Rooms, bookings, staff operations, hotel policies, reports, and feedback moderation. |
| Receptionist | Guest accounts, reservations, check-in/out, invoices, and room status. |
| Housekeeping staff | Assigned cleaning tasks, permitted room-status changes, and issue reporting. |
| Guest | Own profile, bookings, invoices, hotel service requests, issue reports, feedback, and notifications. |

Users receive role-based access; the backend checks permissions as well as the frontend navigation.

## 4. Complete feature guide

Each feature below explains what the user can do, how the workflow behaves, and the value it provides.

### 4.1 Role-specific dashboard

**What it does:** Gives each user a useful starting view instead of showing the same information to every role.

**How it works:**

- Managers and administrators see hotel-level activity such as reservation statuses, recent bookings, revenue summaries, and operational work waiting for attention.
- Reception staff see reservation and invoice workload relevant to the front desk.
- Housekeeping staff can see their work and available tasks.
- Guests see information about their own upcoming/current stay, invoices, and requests.

**Value:** Staff can prioritize work quickly, while guests start with their own stay information rather than hotel administration data.

### 4.2 Authentication, user administration, and profile

**What it does:** Protects the application and gives authorized staff control over hotel accounts.

**How it works:**

- Users sign in with an account. Public registration creates a guest account; hotel roles are assigned through authorized administration.
- The API verifies signed tokens and checks that the account is active.
- Administrators and permitted staff can create, search, view, or manage accounts according to their permissions.
- Users can update contact details, upload/remove a profile photo, change a password, and save guest preferences such as preferred room/bed type, smoking preference, dietary information, and notes.

**Value:** Guest and staff information is kept in one profile, and account permissions are based on job responsibility.

### 4.3 Room inventory

**What it does:** Maintains the hotel's rooms as searchable operational records.

**How it works:**

- Each room can have a room number, type, floor, capacity, price per night, description, amenities, photos, and operational status.
- Staff can search and filter the paginated room list by information such as room number/description, type, status, and price.
- Room cards show a photo gallery, status, room type, nightly rate, floor, capacity, and key amenities. A detail view provides more information and available staff actions.
- Authorized staff add/edit rooms and change allowed room statuses. Room photos are stored using Cloudinary.
- Hotel-wide room-type defaults can prefill the rate on a newly added room; staff can change the suggested rate before saving.

**Value:** Reception and operations staff can quickly understand both the commercial details and current state of each room.

### 4.4 Reservations and stay lifecycle

**What it does:** Connects room availability, guest details, dates, and the stay from booking through checkout.

**How it works:**

1. A guest or authorized staff member chooses check-in/check-out dates, number of guests, and a room type.
2. The app searches for rooms available for those dates and displays the nightly rate and stay total.
3. Before submitting, the guest can review the stay and the current hotel policies. Staff can select a guest for a booking.
4. The reservation stores its room, guest, dates, number of nights, room price, total, and status. This preserves the booked price even if the room's current price changes later.
5. Reception checks in a confirmed guest only when the room is available. The staff member may enter a key-card number; if left blank, the system generates one. The room becomes occupied and the guest receives a booking notification with the key-card information.
6. Staff check the guest out or authorized users cancel according to the reservation rules.

**Value:** The reservation becomes the shared record used by front desk, housekeeping, guest views, and later invoicing.

### 4.5 Invoices and billing

**What it does:** Records what the guest owes and how the invoice changes over time.

**How it works:**

- Staff create an invoice after the reservation has reached check-in or check-out.
- The invoice records room charges, extra charges, discount, tax rate, tax amount, total, payment status, and payment details.
- Authorized staff can add/remove charges or apply permitted discounts. A reservation can have only one invoice.
- Guests can view their own invoices; staff can search/list hotel invoices and use the separate billing report.
- The system generates a downloadable invoice PDF.
- Staff can record an offline/manual payment through the invoice workflow. Invoice updates can generate notifications.

**Value:** Charges, tax, discounts, and payment status are visible together, reducing dependence on separate billing notes.

### 4.6 Stripe online payments — end-to-end

**What it does:** Lets an eligible guest pay an unpaid invoice through Stripe Checkout.

**Payment flow:**

1. The user starts card payment from an unpaid invoice.
2. The backend checks the invoice, confirms it is unpaid and has a positive total, and checks guest ownership when the user is a guest.
3. The backend creates a Stripe-hosted Checkout session using the amount from the saved invoice—not an amount supplied by the browser—and stores the Stripe session reference.
4. Stripe redirects the user back to the app's success or cancelled page.
5. A browser redirect alone does **not** make an invoice paid. The backend verifies Stripe's signed webhook event, checks that the paid amount matches the invoice, and then records the invoice as paid with its payment date and Stripe payment method.
6. The success page also asks the backend to verify the payment and can check again if Stripe confirmation is still pending. A cancelled checkout leaves the invoice unpaid and provides a retry option.

**What must be configured:** Stripe secret key, webhook signing secret, frontend redirect URL, and a currency that matches the hotel's prices. Test keys should be used for demonstrations; live keys and a deployed webhook are needed for real payments.

**Currency setup note:** Room and invoice amounts are displayed in PKR/Rs. in the UI, while the Stripe integration defaults to `usd` unless configured. Confirm a Stripe-supported currency and align the displayed/invoiced currency before accepting real payments.

**Value:** The hotel can offer hosted card checkout while keeping final payment confirmation on the server.

### 4.7 Housekeeping

**What it does:** Turns cleaning and room-readiness work into assignable tasks.

**How it works:**

- Staff create tasks for checkout cleaning, regular cleaning, deep cleaning, or inspection, with a priority and optional notes.
- A manager/admin can assign a task. Housekeeping staff can see tasks, claim available work, start it, and mark it complete.
- Task status and start/completion times remain attached to the task.
- Room-status permissions are role-aware; housekeeping staff can update allowed operational statuses.

**Value:** Room readiness is trackable instead of being communicated only through informal messages.

### 4.8 Maintenance and issue reporting

**What it does:** Captures faults that need follow-up, including problems connected to a room or another location.

**How it works:**

- Guests and permitted staff can submit a report with a title, description, and room/location information.
- Staff review requests, change status, record resolution notes, and cancel a request when appropriate.
- The workflow tracks open, in-progress, resolved, and cancelled states. A report can indicate that it blocks room use.
- Guests and housekeeping users can follow their own reports; authorized operations staff can review the broader queue.

**Value:** Issues have a record and lifecycle, helping staff identify what is still unresolved.

### 4.9 Guest service requests

**What it does:** Gives guests a way to request services such as room service, a wake-up call, transportation, or another supported service.

**How it works:**

- A service request is connected to the guest's reservation and room.
- Guests follow their own requests; authorized staff view the work queue and update status or staff notes.
- Staff can set an amount for an eligible completed request. The system can add that amount to the reservation's unpaid invoice and mark the service as charged.

**Value:** Guest requests are visible to the team and can connect to billing instead of being lost in a chat or paper note.

### 4.10 Guest feedback and moderation

**What it does:** Collects feedback while protecting the hotel's control over what is published publicly.

**How it works:**

- A guest can submit feedback linked to their stay. The model prevents multiple feedback records for the same reservation.
- A future/public website can submit feedback through the public endpoint; public submissions are marked as unverified website feedback.
- New feedback is pending until an administrator or manager approves or rejects it. Only approved feedback is returned by the public feedback endpoint.
- Public website feedback submissions are rate-limited.

**Value:** The hotel can respond to guest opinions and moderate public reviews before they appear on a future public website.

### 4.11 Saved in-app notifications

**What it does:** Gives users an inbox for important hotel events.

**How it works:**

- Booking, invoice, payment, service, maintenance, housekeeping, or feedback events can create a notification for selected users or roles.
- Notifications are stored in the database, show unread counts, support mark-one/read-all actions, and can link to the related screen.
- Notifications are event-triggered; old activity is not automatically backfilled. The action's actor is excluded when the event supplies an actor ID.

**Value:** Users can see updates they missed and open the relevant booking, invoice, or task directly.

### 4.12 PWA, mobile experience, and Web Push

**What has been built:**

- The web app has a PWA manifest, app icons, standalone display configuration, and a registered service worker.
- The interface adapts for desktop and mobile. Mobile users get bottom navigation and a slide-out “More” menu; supported browsers can show an install action. iPhone/iPad users receive Add to Home Screen guidance.
- The service worker caches the application shell and same-origin static assets (such as scripts, styles, images, and fonts). It does not cache `/api/` responses.
- If a page navigation cannot reach the server, the service worker may show the cached app shell. This is **not** full offline hotel operations: bookings, invoices, and other live data still need the API.
- Users can enable Web Push from the notification controls on a supported secure browser. The browser permission and push subscription are saved for that user/device.
- When a push event arrives, the service worker displays it. Tapping the notification opens the related in-app page, or the notifications page as a fallback.

**What is needed for push to work:** HTTPS (or localhost during development), supported browser/device, service worker, VAPID public/private keys and subject configured on the backend, a saved subscription, and user permission. Push is optional; the in-app inbox works separately. If permission is blocked or the browser is unsupported, the app cannot force a system notification.

**Value:** Guests and staff can use the same responsive web product on desktop and phone, with optional home-screen installation and device-level alerts—without a separate native app.

### 4.13 Hotel settings

**What it does:** Gives managers one place to configure hotel-wide defaults and booking information.

**Settings include:**

- Tax rate copied to newly created invoices; existing invoices keep their stored tax snapshot.
- Optional nightly price defaults for single, double, deluxe, and suite rooms; existing room prices are not bulk-changed.
- Check-in/check-out times and cancellation, smoking, and children policies displayed during booking review.

**Value:** Staff can change future hotel behavior without silently rewriting historical bookings or invoices.

### 4.14 Reports and analytics

**What it does:** Helps authorized managers review hotel activity over a selected date range.

**Metrics include:** reservation counts by status, check-ins/check-outs, cancellations, booked room-nights and occupancy, paid revenue, outstanding invoices, ADR, RevPAR, and a daily revenue chart.

**How to interpret the numbers:**

- Paid revenue is grouped by invoice payment date and includes the invoice total.
- Room revenue uses the invoice's room-charge amount; ADR divides it by nights on reservations attached to paid invoices in the selected paid-date range.
- RevPAR is room revenue divided by available room-nights.
- Historical occupancy uses the current room count because historical inventory is not recorded. Treat past occupancy as an estimate.
- Outstanding invoice totals are a current snapshot, not limited to the selected date range.
- Analytics requests are limited to a maximum 366-day date range.

**Value:** Managers can review operational and revenue indicators without treating the billing report and hotel occupancy report as the same thing.

## 5. Example end-to-end hotel day

1. **Prepare inventory:** A manager creates rooms, sets amenities/photos, and configures future rate defaults.
2. **Book a stay:** A guest or receptionist checks available rooms for the requested dates, chooses a room, reviews hotel policies, and submits the booking.
3. **Welcome the guest:** Reception checks the guest in, confirms the room is available, and assigns or generates a key-card number.
4. **Operate the stay:** Housekeeping tracks cleaning; the guest can request a service or report an issue; staff update each request and receive relevant notifications.
5. **Settle the bill:** After check-in, staff create an invoice, add eligible charges/discounts, apply the saved tax rate, and record an offline payment or start Stripe Checkout.
6. **Close the stay:** Reception checks out the guest. The guest can review the invoice, booking/key-card information, and submit feedback.
7. **Review performance:** Managers examine booking, occupancy, cancellation, invoice, and revenue reports and adjust settings for future operations.

## 6. Technology and architecture

```text
Responsive React + Vite PWA
        |
        | authenticated REST/JSON requests
        v
Node.js + Express API
        |
        +--> MongoDB / Mongoose (hotel records)
        +--> Stripe Checkout and signed webhook (payments)
        +--> Cloudinary (room/profile photos)
        +--> Web Push / VAPID (device notifications)
        +--> PDFKit (invoice PDFs)
```

The application is a modular monolith, not a collection of separate microservices. The frontend is built with React, Vite, Tailwind CSS, and Lucide icons. The backend is a Node.js/Express REST API. MongoDB stores users, rooms, reservations, invoices, operational requests, settings, feedback, and notifications.

## 7. Security, privacy, and operational requirements

- Passwords are hashed before storage; authenticated API calls use signed JWTs.
- Backend routes enforce role permissions, and guest data is restricted to the appropriate account where implemented.
- Stripe payment state is confirmed server-side using the signed webhook/payment verification flow.
- Public website feedback submission has a rate limit.
- Production requires HTTPS and securely configured MongoDB, Stripe, Cloudinary, and (if used) VAPID credentials.
- The app stores guest profile preferences, but a dedicated privacy-consent/consent-history workflow is not currently implemented.
- The development admin seeder contains a fixed development credential; replace/secure it before deployment.

## 8. Value to the hotel

- **Connected operations:** reservations, rooms, billing, and staff requests share related records.
- **Clear responsibility:** operational tasks have statuses and, where applicable, assigned staff.
- **Better guest self-service:** guests can see their own booking, invoice, service request, key-card details, and notifications.
- **Consistent financial records:** booked room prices and invoice tax rates are stored at the time they apply.
- **Safer payment flow:** the server uses the saved invoice amount and waits for provider confirmation.
- **Management visibility:** reports bring booking and revenue indicators into one place.
- **Device flexibility:** the responsive PWA can be used from desktop or installed on supported phones/tablets.

## 9. Current scope and future opportunities

The current product includes the hotel operations portal and guest-facing booking/service screens. It is not yet a complete public hotel marketing website. The public feedback API can support a future website integration.

Other possible next steps include:

- Public hotel website with room browsing and direct booking.
- Dedicated privacy-consent capture, retention, and audit history.
- Invoice email delivery.
- Currency alignment/selection across room display, invoices, and Stripe Checkout before live payment deployment.
- Historical room-inventory tracking for more precise past occupancy analytics.
- Automated backend/API tests, production monitoring, report exports, and additional booking channels.

## 10. Suggested presentation order

1. **Title and goal:** Introduce LuxuryStay and the hotel-operations problem.
2. **Users and access:** Explain admin, manager, receptionist, housekeeping, and guest roles.
3. **Room and reservation flow:** Demonstrate inventory, availability search, booking, check-in, and key card.
4. **Hotel operations:** Show housekeeping, maintenance, and guest service workflows.
5. **Billing and Stripe:** Explain invoice creation, charges/tax, hosted checkout, and server-side payment confirmation.
6. **PWA and notifications:** Show mobile navigation, install experience, saved inbox, and optional Web Push requirements.
7. **Settings and analytics:** Explain future-only defaults and the manager metrics.
8. **Architecture, value, and next steps:** Summarize the stack, benefits, scope boundaries, and roadmap.

## 11. Useful terms for a presentation

- **ADR (Average Daily Rate):** room revenue divided by the paid reservation room-nights used by this report.
- **RevPAR (Revenue Per Available Room):** room revenue divided by available room-nights.
- **PWA:** an installable web application with a manifest and service worker; it is not a native mobile app.
- **Web Push:** optional device-level notifications delivered through a browser push subscription.
- **Webhook:** a signed server-to-server event from Stripe used to confirm payment.
- **Role-based access:** permissions that determine which screens and actions a user can access.

## 12. Roman Urdu presentation script

> Assalam-o-alaikum. Mera project LuxuryStay Hotel Management System hai. Is ka maqsad hotel ke rooms, bookings, staff operations, guest requests aur billing ko ek connected system mein manage karna hai.
>
> Is project mein admin, manager, receptionist, housekeeping staff aur guest ke liye alag role-based access hai. Room module mein staff rooms ki details, photos, amenities, prices aur current status manage kar sakta hai. Reservation module dates ke mutabiq available room dikhata hai, booking ko save karta hai, aur check-in ke waqt key-card number assign ya automatically generate kar sakta hai.
>
> Stay ke duran housekeeping tasks, maintenance reports aur guest service requests track hote hain. Guest apni booking, invoice, service requests aur notifications dekh sakta hai. Staff invoice bana sakta hai, charges ya allowed discount add kar sakta hai, PDF download kar sakta hai, aur payment record kar sakta hai.
>
> Online payment ke liye Stripe Checkout use hota hai. Payment confirm sirf success page dekh kar nahi hoti: backend Stripe ke signed event aur invoice amount verify karke invoice ko paid mark karta hai. Real payment se pehle Stripe credentials aur currency ko hotel ki displayed currency ke saath configure karna zaroori hai.
>
> LuxuryStay PWA bhi hai. Isay supported phone ya computer par install kiya ja sakta hai. Mobile par bottom navigation aur More menu hai. Service worker app shell aur static files cache karta hai, lekin bookings aur invoices ka live data chalne ke liye internet/API zaroori hai. Web Push optional hai aur HTTPS, VAPID setup, supported browser aur user permission par depend karta hai.
>
> Manager hotel tax aur naye rooms ke price defaults set kar sakta hai, guest booking policies update kar sakta hai, aur bookings, occupancy aur revenue ki reports dekh sakta hai. System React, Node.js/Express aur MongoDB par bana hai; Stripe payments, Cloudinary images aur Web Push integrations bhi hain.
>
> Is tarah LuxuryStay hotel ke rozana kaam ko ek jagah organize karta hai aur staff aur guest dono ko unke role ke mutabiq useful tools deta hai. Shukriya.
