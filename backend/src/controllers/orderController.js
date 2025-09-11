// controllers/orderController.js
import crypto from "crypto";
import Order from "../models/Order.js";
import Ticket from "../models/Ticket.js";
import EventMember from "../models/EventMember.js";
import { emailRevocationForOrder } from "./emailHelpers.js";

const genRef = () => `TKT_${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

export const fulfillOrderDev = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.status === "fulfilled") return res.json({ ok: true, orderId });

    const tickets = Array.from({ length: order.quantity }).map(() => ({
      ticketId: order.ticketId,
      ref: genRef(),
    }));
    order.tickets.push(...tickets);
    order.status = "fulfilled";
    await order.save();

    await Ticket.updateOne({ _id: order.ticketId }, { $inc: { quantitySold: order.quantity } });

    await EventMember.updateOne(
      { eventId: order.eventId, userId: order.userId },
      { $setOnInsert: { status: "approved" }, $addToSet: { roles: "attendee" } },
      { upsert: true }
    );

    res.json({ ok: true, order });
  } catch (e) { next(e); }
};

export const refundOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.status !== "fulfilled" && order.status !== "paid")
      return res.status(400).json({ error: "Only paid/fulfilled orders can be refunded" });

    order.status = "refunded";
    order.tickets = order.tickets.map(t => ({ ...t.toObject?.() ?? t, status: "revoked" }));
    await order.save();
    await emailRevocationForOrder(order._id);

    // Optional: free capacity
    await Ticket.updateOne({ _id: order.ticketId }, { $inc: { quantitySold: -order.quantity } });

    // Optional: if user has no other valid tickets for this event, remove attendee role
    const stillHas = await Order.exists({
      _id: { $ne: order._id },
      eventId: order.eventId,
      userId: order.userId,
      status: "fulfilled",
      "tickets.status": "issued"
    });
    if (!stillHas) {
      await EventMember.updateOne(
        { eventId: order.eventId, userId: order.userId },
        { $pull: { roles: "attendee" } }
      );
    }

    res.json({ ok: true, order });
  } catch (e) { next(e); }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json({ orders });
  } catch (e) { next(e); }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, userId: req.user._id }).lean();
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ order });
  } catch (e) { next(e); }
};
