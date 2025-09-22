// scripts/backfill-order-ticket-ids.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "../config/db.js";
import Order from "../models/Order.js";

async function run() {
  try {
    await connectDB();
    console.log("Connected to MongoDB via connectDb.");

    const cursor = Order.find({ "tickets._id": { $exists: false } }).cursor();
    let updated = 0;

    for await (const order of cursor) {
      let changed = false;

      order.tickets = (order.tickets || []).map((t) => {
        if (!t._id) {
          t._id = new mongoose.Types.ObjectId();
          if (!t.issuedAt) t.issuedAt = new Date();
          changed = true;
        }
        return t;
      });

      if (changed) {
        await order.save();
        updated++;
        console.log("Updated order:", String(order._id));
      }
    }

    console.log("Done. Orders updated:", updated);
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

run();
