import PDFDocument from "pdfkit";

const LABEL = process.env.CURRENCY_LABEL || "Rs.";

const money = (n) =>
  `${LABEL} ${Number(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

// Invoice ko PDF bana kar seedha response (res) mein bhej deta hai
export const buildInvoicePdf = (invoice, res) => {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.pipe(res);

  const ORANGE = "#F97316";
  const INK = "#111111";
  const MUTED = "#6B7280";
  const LINE = "#E5E5E5";
  const left = 50;
  const right = 545;

  const reservation = invoice.reservation || {};
  const room = reservation.room || {};
  const guest = invoice.guest || {};

  // ---- Header ----
  doc.fillColor(ORANGE).fontSize(22).font("Helvetica-Bold").text("LuxuryStay", left, 50);
  doc.fillColor(MUTED).fontSize(9).font("Helvetica").text("Hotel Management System", left, 76);

  doc.fillColor(INK).fontSize(20).font("Helvetica-Bold")
    .text("INVOICE", 350, 50, { width: 195, align: "right" });
  doc.fillColor(MUTED).fontSize(9).font("Helvetica")
    .text(invoice.invoiceNumber, 350, 76, { width: 195, align: "right" })
    .text(`Date: ${fmtDate(invoice.createdAt)}`, 350, 90, { width: 195, align: "right" })
    .text(`Status: ${invoice.status.toUpperCase()}`, 350, 104, { width: 195, align: "right" });

  doc.moveTo(left, 125).lineTo(right, 125).strokeColor(LINE).stroke();

  // ---- Bill to / Stay details ----
  doc.fillColor(MUTED).fontSize(9).font("Helvetica-Bold").text("BILL TO", left, 140);
  doc.fillColor(INK).fontSize(11).font("Helvetica-Bold").text(guest.name || "-", left, 155);
  doc.fillColor(MUTED).fontSize(9).font("Helvetica")
    .text(guest.email || "", left, 171)
    .text(guest.phone || "", left, 184);

  doc.fillColor(MUTED).fontSize(9).font("Helvetica-Bold").text("STAY DETAILS", 320, 140);
  doc.fillColor(INK).fontSize(9).font("Helvetica")
    .text(`Booking: ${reservation.bookingCode || "-"}`, 320, 155)
    .text(`Room: ${room.roomNumber || "-"} (${room.type || "-"})`, 320, 168)
    .text(`Check-in: ${reservation.checkIn ? fmtDate(reservation.checkIn) : "-"}`, 320, 181)
    .text(`Check-out: ${reservation.checkOut ? fmtDate(reservation.checkOut) : "-"}`, 320, 194);

  // ---- Table header ----
  let y = 230;
  doc.rect(left, y, right - left, 24).fill(INK);
  doc.fillColor("#FFFFFF").fontSize(9).font("Helvetica-Bold")
    .text("Description", left + 10, y + 8)
    .text("Qty", 330, y + 8, { width: 40, align: "right" })
    .text("Unit price", 375, y + 8, { width: 80, align: "right" })
    .text("Amount", 460, y + 8, { width: 75, align: "right" });
  y += 24;

  // ---- Rows: pehle kamray ka kiraya, phir extra charges ----
  const rows = [
    {
      description: `Room charges (${reservation.nights || "-"} nights)`,
      quantity: 1,
      unitPrice: invoice.roomCharges,
      amount: invoice.roomCharges,
    },
    ...invoice.charges.map((c) => ({
      description: c.description,
      quantity: c.quantity,
      unitPrice: c.unitPrice,
      amount: c.amount,
    })),
  ];

  rows.forEach((row, i) => {
    if (y > 700) {
      doc.addPage();
      y = 50;
    }
    if (i % 2 === 1) doc.rect(left, y, right - left, 22).fill("#F5F5F5");
    doc.fillColor(INK).fontSize(9).font("Helvetica")
      .text(row.description, left + 10, y + 7, { width: 260, height: 12, ellipsis: true })
      .text(String(row.quantity), 330, y + 7, { width: 40, align: "right" })
      .text(money(row.unitPrice), 375, y + 7, { width: 80, align: "right" })
      .text(money(row.amount), 460, y + 7, { width: 75, align: "right" });
    y += 22;
  });

  // ---- Totals ----
  y += 15;
  if (y > 680) {
    doc.addPage();
    y = 50;
  }

  const totalLine = (label, value, bold = false) => {
    doc.fillColor(bold ? INK : MUTED)
      .fontSize(bold ? 12 : 10)
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .text(label, 330, y, { width: 120 })
      .text(value, 440, y, { width: 95, align: "right" });
    y += bold ? 22 : 18;
  };

  totalLine("Subtotal", money(invoice.subtotal));
  if (invoice.discount > 0) totalLine("Discount", `- ${money(invoice.discount)}`);
  totalLine(`Tax (${invoice.taxRate}%)`, money(invoice.taxAmount));
  doc.moveTo(330, y).lineTo(right, y).strokeColor(LINE).stroke();
  y += 8;
  totalLine("TOTAL", money(invoice.total), true);

  // ---- Payment status ----
  y += 10;
  if (invoice.status === "paid") {
    doc.fillColor("#16A34A").fontSize(10).font("Helvetica-Bold")
      .text(`PAID via ${invoice.paymentMethod} on ${fmtDate(invoice.paidAt)}`, left, y);
  } else if (invoice.status === "void") {
    doc.fillColor("#DC2626").fontSize(10).font("Helvetica-Bold").text("VOID", left, y);
  } else {
    doc.fillColor(ORANGE).fontSize(10).font("Helvetica-Bold").text("PAYMENT PENDING", left, y);
  }

  doc.fillColor(MUTED).fontSize(9).font("Helvetica")
    .text("Thank you for staying with LuxuryStay.", left, y + 40, {
      width: right - left,
      align: "center",
    });

  doc.end();
};