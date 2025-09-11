// controllers/checkoutController.js
import crypto from "crypto";
import User from "../models/User.js";
import Event from "../models/Event.js";
import Ticket from "../models/Ticket.js";
import Order from "../models/Order.js";
import Attendee from "../models/Attendee.js";
import { emailTicketsForOrder } from "./emailHelpers.js";

function apiError(code, message, status = 400, extra = {}) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  Object.assign(err, extra);
  return err;
}
async function safeEmail(orderId) {
  try {
    await emailTicketsForOrder(orderId);
  } catch (e) {
    // don't fail the HTTP request if email sending hiccups
    console.error("[emailTicketsForOrder] failed for", orderId, e?.message);
  }
}

function generateTicketRef() {
  // short, unique, URL-safe
  return crypto.randomBytes(6).toString("base64url").toUpperCase();
}

function calcAvailable(ticket) {
  const total = ticket.quantityTotal ?? 0;
  const sold  = ticket.quantitySold ?? 0;
  return Math.max(total - sold, 0);
}

async function findOrCreateGuestUser({ email, fullName }) {
  const existing = await User.findOne({ email }).select("+password isGuest");
  if (existing) {
    if (existing.isGuest === false) {
      throw apiError("EMAIL_EXISTS", "Email already exists. Please login or register.", 400);
    }
    if (!existing.fullName && fullName) {
      existing.fullName = fullName;
      await existing.save();
    }
    return existing;
  }
  return User.create({
    email,
    fullName: fullName || email.split("@")[0],
    isGuest: true,
    role: "user",
  });
}

/**
 * PUBLIC — Guest starts checkout (no auth)
 * Body: { eventId, ticketId, fullName, email, quantity }
 * - Free ticket  -> immediately creates Order (paid/fulfilled), Attendee, and ticket refs
 * - Paid ticket  -> creates Order (awaiting_payment) and returns dummy checkout URL
 */

export async function createCheckout(req, res, next) {
  try {
    const authUser = req.user;
    if (!authUser?._id) throw apiError("UNAUTHENTICATED", "Login required", 401);

    const { eventId, ticketId, quantity } = req.body || {};
    if (!eventId) throw apiError("INVALID_EVENT", "eventId is required");
    if (!ticketId) throw apiError("INVALID_TICKET", "ticketId is required");

    const qty = Math.max(parseInt(quantity || 1, 10), 1);
    if (!Number.isInteger(qty) || qty < 1) throw apiError("INVALID_QUANTITY", "Quantity must be a positive integer");

    // Validate event & ticket
    const [event, ticket] = await Promise.all([
      Event.findById(eventId).select("_id name").lean(),
      Ticket.findById(ticketId).lean(),
    ]);
    if (!event) throw apiError("INVALID_EVENT", "Event not found", 404);
    if (!ticket || String(ticket.eventId) !== String(eventId)) {
      throw apiError("INVALID_TICKET", "Ticket does not belong to this event", 404);
    }
    if (ticket.isActive === false) throw apiError("INACTIVE_TICKET", "Ticket is not active");

    // Sales window
    const now = new Date();
    if (ticket.salesStartAt && now < new Date(ticket.salesStartAt))
      throw apiError("NOT_STARTED", "Ticket sales have not started yet");
    if (ticket.salesEndAt && now > new Date(ticket.salesEndAt))
      throw apiError("ENDED", "Ticket sales have ended");

    // Capacity
    const remaining = calcAvailable(ticket);
    if (qty > remaining) throw apiError("SOLD_OUT", `Only ${remaining} tickets remaining`);

    const isFree = (ticket.priceCents || 0) === 0;
    const amountTotal = (ticket.priceCents || 0) * qty;
    const currency = ticket.currency || "eur";
    const clientBase = process.env.CLIENT_URL || "http://localhost:5173";

    if (isFree) {
      // Instantly fulfill
      const lines = Array.from({ length: qty }, () => ({
        ticketId: ticket._id,
        ref: generateTicketRef(),
        status: "issued",
      }));

      const order = await Order.create({
        eventId,
        userId: authUser._id,
        ticketId: ticket._id,
        quantity: qty,
        amountTotal,
        currency,
        status: "fulfilled",
        tickets: lines,
      });

      await Attendee.findOneAndUpdate(
        { eventId, userId: authUser._id },
        { $setOnInsert: { roles: ["attendee"], status: "approved" }, $inc: { quantity: qty } },
        { upsert: true, new: true }
      );

      await Ticket.updateOne({ _id: ticket._id }, { $inc: { quantitySold: qty } });

      await safeEmail(order._id);

      return res.status(200).json({ success: true, mode: "free", orderId: order._id });
    }

    // Paid → create awaiting_payment and send to dummy checkout UI
    const order = await Order.create({
      eventId,
      userId: authUser._id,
      ticketId: ticket._id,
      quantity: qty,
      amountTotal,
      currency,
      status: "awaiting_payment",
      tickets: [],
    });

    const url = `${clientBase}/pay/dummy-checkout?order=${order._id}`;
    return res.status(200).json({ url, orderId: String(order._id) });
  } catch (err) {
    next(err);
  }
}

export async function createGuestCheckout(req, res, next) {
  try {
    const { eventId, ticketId, fullName, email, quantity } = req.body || {};
    if (!eventId) throw apiError("INVALID_EVENT", "eventId is required");
    if (!ticketId) throw apiError("INVALID_TICKET", "ticketId is required");
    if (!email) throw apiError("INVALID_EMAIL", "email is required");

    const qty = Math.max(parseInt(quantity || 1, 10), 1);
    if (!Number.isInteger(qty) || qty < 1) throw apiError("INVALID_QUANTITY", "Quantity must be a positive integer");
    const cleanEmail = String(email).trim().toLowerCase();

    // Validate event & ticket
    const [event, ticket] = await Promise.all([
      Event.findById(eventId).select("_id ownerId").lean(),
      Ticket.findById(ticketId).lean(),
    ]);
    if (!event) throw apiError("INVALID_EVENT", "Event not found", 404);
    if (!ticket || String(ticket.eventId) !== String(eventId)) {
      throw apiError("INVALID_TICKET", "Ticket does not belong to this event", 404);
    }
    if (ticket.isActive === false) throw apiError("INACTIVE_TICKET", "Ticket is not active");

    // Sales window (optional strictness)
    const now = new Date();
    if (ticket.salesStartAt && now < new Date(ticket.salesStartAt))
      throw apiError("NOT_STARTED", "Ticket sales have not started yet");
    if (ticket.salesEndAt && now > new Date(ticket.salesEndAt))
      throw apiError("ENDED", "Ticket sales have ended");

    // Capacity
    const remaining = calcAvailable(ticket);
    if (qty > remaining) throw apiError("SOLD_OUT", `Only ${remaining} tickets remaining`);

    // Guest user logic (blocks existing registered emails)
    const user = await findOrCreateGuestUser({ email: cleanEmail, fullName });

    const isFree = (ticket.priceCents || 0) === 0;
    const amountTotal = (ticket.priceCents || 0) * qty;

    if (isFree) {
      // Create an already-paid order
      const lines = Array.from({ length: qty }, () => ({
        ticketId: ticket._id,
        ref: generateTicketRef(),
        status: "issued",
      }));

      const order = await Order.create({
        eventId,
        userId: user._id,
        ticketId: ticket._id,
        quantity: qty,
        amountTotal,
        currency: ticket.currency || "eur",
        status: "fulfilled", // free -> instantly fulfilled
        tickets: lines,
      });

      // Upsert attendee (group entry MVP)
      await Attendee.findOneAndUpdate(
        { eventId, userId: user._id },
        {
          $setOnInsert: { roles: ["attendee"], status: "approved" },
          $inc: { quantity: qty },
        },
        { upsert: true, new: true }
      );

      // Increase sold
      await Ticket.updateOne({ _id: ticket._id }, { $inc: { quantitySold: qty } });

await safeEmail(order._id);

      return res.status(200).json({
        success: true,
        mode: "free",
        orderId: order._id,
        message: "Free ticket issued.",
      });
    }

    // Paid path — create an order awaiting payment
    const order = await Order.create({
      eventId,
      userId: user._id,
      ticketId: ticket._id,
      quantity: qty,
      amountTotal,
      currency: ticket.currency || "eur",
      status: "awaiting_payment",
      tickets: [], // will be filled on success
    });

    // Dummy “Stripe” URL (your FE will redirect to this)
    const clientBase = process.env.CLIENT_URL || "http://localhost:5173";
    const url = `${clientBase}/pay/dummy-checkout?order=${order._id}`;

    return res.status(200).json({ url, orderId: String(order._id) });
  } catch (err) {
    next(err);
  }
}

/**
 * PUBLIC — Dummy payment completion (simulates PSP webhook)
 * Body: { orderId }
 * - Marks order as paid/fulfilled
 * - Issues ticket refs, creates/updates Attendee, increments sold
 */
export async function completeGuestDummyPayment(req, res, next) {
  try {
    const { orderId } = req.body || {};
    if (!orderId) throw apiError("INVALID_ORDER", "orderId is required");

    const order = await Order.findById(orderId);
    if (!order) throw apiError("NOT_FOUND", "Order not found", 404);
    if (!["awaiting_payment", "created"].includes(order.status)) {
      // idempotent
      return res.status(200).json({ success: true, message: `Order already ${order.status}.` });
    }

    const ticket = await Ticket.findById(order.ticketId);
    if (!ticket) throw apiError("INVALID_TICKET", "Ticket not found", 404);

    // Capacity re-check (for race-safety)
    const remaining = calcAvailable(ticket);
    if (order.quantity > remaining) throw apiError("SOLD_OUT", `Only ${remaining} tickets remaining`);

    // Issue tickets
    const lines = Array.from({ length: order.quantity }, () => ({
      ticketId: ticket._id,
      ref: generateTicketRef(),
      status: "issued",
    }));

    order.tickets = lines;
    order.status = "fulfilled"; // simulate paid + fulfilled
    await order.save();

    // Upsert attendee (group quantity)
    await Attendee.findOneAndUpdate(
      { eventId: order.eventId, userId: order.userId },
      {
        $setOnInsert: { roles: ["attendee"], status: "approved" },
        $inc: { quantity: order.quantity },
      },
      { upsert: true, new: true }
    );

    // Increment sold
    await Ticket.updateOne({ _id: ticket._id }, { $inc: { quantitySold: order.quantity } });

    await safeEmail(order._id);

    return res.status(200).json({
      success: true,
      mode: "paid-dummy",
      orderId: order._id,
      message: "Payment simulated, tickets issued, attendee granted.",
    });
  } catch (err) {
    next(err);
  }
}

