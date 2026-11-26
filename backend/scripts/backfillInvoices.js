/*
 * Jin bookings ka guest check-in (ya check-out) ho chuka hai magar invoice nahi bana,
 * un ka invoice bana do. Pehle check-in par invoice khud nahi banta tha; yeh un purani
 * bookings ke liye hai.
 *
 *   npm run backfill:invoices            -> invoices banata hai
 *   npm run backfill:invoices -- --dry   -> sirf dikhata hai, kuch nahi likhta
 *
 * Dobara chalana safe hai (ensureReservationInvoice pehle se bana invoice dobara nahi banata).
 */
import "dotenv/config";
import mongoose from "mongoose";
import Reservation from "../models/Reservation.js";
import Invoice from "../models/Invoice.js";
import "../models/User.js";
import { BILLABLE_STATUSES, ensureReservationInvoice } from "../utils/invoices.js";

const DRY_RUN = process.argv.includes("--dry");

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const billed = await Invoice.distinct("reservation");
  const missing = await Reservation.find({ status: { $in: BILLABLE_STATUSES }, _id: { $nin: billed } })
    .populate("guest", "email")
    .sort({ checkIn: 1 });

  if (!missing.length) {
    console.log("Every checked-in / checked-out booking already has an invoice.");
    return 0;
  }

  let failed = 0;
  for (const reservation of missing) {
    const label = `${reservation.bookingCode} (${reservation.status}, guest ${reservation.guest?.email ?? "unknown"}, PKR ${reservation.totalAmount})`;
    if (DRY_RUN) {
      console.log(`would create  ${label}`);
      continue;
    }
    try {
      const { invoice, created } = await ensureReservationInvoice(reservation, null);
      console.log(`${created ? "created" : "exists "}  ${invoice.invoiceNumber} for ${label}`);
    } catch (error) {
      failed += 1;
      console.error(`failed   ${label}: ${error.message}`);
    }
  }
  console.log(DRY_RUN ? "\nDry run: nothing was written." : `\nDone. ${failed} failed.`);
  return failed;
};

run()
  .then(async (failed) => {
    await mongoose.disconnect();
    process.exit(failed ? 1 : 0);
  })
  .catch(async (error) => {
    console.error(error.message);
    await mongoose.disconnect();
    process.exit(1);
  });
