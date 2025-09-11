// controllers/emailHelpers.js
import Order from "../models/Order.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import { qrPngDataUrl } from "../utils/qrcode.js";
import { sendMail } from "../utils/mailer.js";
import { ticketEmailTemplate } from "../services/emails/ticketEmail.js";
import { refundEmailTemplate } from "../services/emails/refundEmail.js";

function clientDownloadBase(orderId) {
  const clientBase = process.env.CLIENT_URL || "http://localhost:5173";
  // Frontend page that renders a ticket and offers a download button:
  // e.g. /tickets/view?order=<id>  and accepts ?ref=...
  return `${clientBase}/tickets/view?order=${orderId}`;
}

export async function emailTicketsForOrder(orderId) {
  const order = await Order.findById(orderId).lean();
  if (!order) return;

  const [user, event] = await Promise.all([
    User.findById(order.userId).select("email fullName").lean(),
    Event.findById(order.eventId).select("name").lean(),
  ]);
  if (!user?.email || !event?.name) return;

  const tickets = await Promise.all(
    (order.tickets || []).map(async t => ({
      ref: t.ref,
      qrDataUrl: await qrPngDataUrl(t.ref),
    }))
  );

  const html = ticketEmailTemplate({
    eventName: event.name,
    tickets,
    downloadBaseUrl: clientDownloadBase(orderId),
  });

  await sendMail({
    to: user.email,
    subject: `Your ${event.name} ticket${tickets.length > 1 ? "s" : ""}`,
    html,
  });
}

export async function emailRevocationForOrder(orderId) {
  const order = await Order.findById(orderId).lean();
  if (!order) return;

  const [user, event] = await Promise.all([
    User.findById(order.userId).select("email").lean(),
    Event.findById(order.eventId).select("name").lean(),
  ]);
  if (!user?.email || !event?.name) return;

  const refs = (order.tickets || []).map(t => t.ref).filter(Boolean);
  if (!refs.length) return;

  const html = refundEmailTemplate({ eventName: event.name, refs });

  await sendMail({
    to: user.email,
    subject: `Your ${event.name} ticket${refs.length>1?"s":""} were refunded`,
    html,
  });
}
