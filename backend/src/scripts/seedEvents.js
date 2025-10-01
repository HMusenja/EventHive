// backend/scripts/seedEvents.js
// Usage: node backend/scripts/seedEvents.js

import dotenv from "dotenv";
dotenv.config();
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "../config/db.js";
import Event from "../models/Event.js";
import Ticket from "../models/Ticket.js";
import User from "../models/User.js";
import EventMember from "../models/EventMember.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// dotenv.config({ path: path.join(__dirname, "..", ".env") });

// ---------------- helpers ----------------
function addDays(date, d) {
  const n = new Date(date);
  n.setDate(n.getDate() + d);
  return n;
}
function addHours(date, h) {
  const d = new Date(date);
  d.setHours(d.getHours() + h);
  return d;
}
async function upsertUser(email) {
  let u = await User.findOne({ email });
  if (!u) {
    u = await User.create({
      email,
      fullName: "Test Seven",
      username: "test7",
      password: "password123", // ⚠️ adjust if your schema requires hash
    });
  }
  return u;
}
async function ensureClean(slugs = []) {
  const evs = await Event.find({ slug: { $in: slugs } }).select("_id");
  const ids = evs.map((e) => e._id);
  if (ids.length) {
    await Ticket.deleteMany({ eventId: { $in: ids } });
    await Event.deleteMany({ _id: { $in: ids } });
  }
}
async function createEventWithTickets({
  ownerId,
  slug,
  title,
  startAt,
  endAt,
  coverImage,
  tickets,
}) {
  const ev = await Event.create({
    ownerId,
    slug,
    title,
    subtitle: "Seeded event",
    description: "Demo seeded event.",
    coverImage,
    startAt,
    endAt,
    timezone: "Europe/Berlin",
    visibility: "public",
    venue: {
      name: "Tech Hub",
      city: "Berlin",
      country: "Germany",
    },
    organizerProfile: {
      name: "EventHive Org",
    },
  });
  await EventMember.updateOne(
    { eventId: ev._id, userId: ownerId },
    { $setOnInsert: { roles: ["organizer"], status: "approved" } },
    { upsert: true }
  );

  for (const t of tickets) {
    await Ticket.create({
      eventId: ev._id,
      name: t.name,
      priceCents: t.priceCents,
      currency: "eur",
      quantityTotal: t.quantityTotal,
      quantitySold: t.quantitySold ?? 0,
    });
  }
  return ev;
}

// ---------------- main ----------------
async function main() {
  await connectDB(); // ✅ use your configDb
  console.log("[seed] Connected");

  const user = await upsertUser("test7@mail.com");

  const now = new Date();
  const slugs = [
    "seed-live-conference",
    "seed-ended-summit",
    "seed-soldout-expo",
    "seed-draft-meetup",
  ];
  await ensureClean(slugs);

  // 1 live
  await createEventWithTickets({
    ownerId: user._id,
    slug: "seed-live-conference",
    title: "Live Conference",
    startAt: addDays(now, 10),
    endAt: addDays(now, 10 + 1),
    coverImage: "https://picsum.photos/seed/live/1200/600",
    tickets: [
      { name: "VIP", priceCents: 15050, quantityTotal: 50, quantitySold: 10 },
      { name: "Standard", priceCents: 7000, quantityTotal: 200, quantitySold: 50 },
      { name: "Free", priceCents: 0, quantityTotal: 100, quantitySold: 5 },
    ],
  });

  // 2 ended
  await createEventWithTickets({
    ownerId: user._id,
    slug: "seed-ended-summit",
    title: "Ended Summit",
    startAt: addDays(now, -14),
    endAt: addDays(now, -13),
    coverImage: "https://picsum.photos/seed/ended/1200/600",
    tickets: [
      { name: "VIP", priceCents: 12000, quantityTotal: 30, quantitySold: 28 },
      { name: "Standard", priceCents: 5050, quantityTotal: 150, quantitySold: 120 },
      { name: "Free", priceCents: 0, quantityTotal: 50, quantitySold: 40 },
    ],
  });

  // 3 sold-out
  await createEventWithTickets({
    ownerId: user._id,
    slug: "seed-soldout-expo",
    title: "Sold-Out Expo",
    startAt: addDays(now, 20),
    endAt: addDays(now, 21),
    coverImage: "https://picsum.photos/seed/soldout/1200/600",
    tickets: [
      { name: "VIP", priceCents: 18000, quantityTotal: 40, quantitySold: 40 },
      { name: "Standard", priceCents: 8000, quantityTotal: 220, quantitySold: 220 },
      { name: "Free", priceCents: 0, quantityTotal: 60, quantitySold: 60 },
    ],
  });

  // 4 draft (just private)
  await createEventWithTickets({
    ownerId: user._id,
    slug: "seed-draft-meetup",
    title: "Draft Meetup",
    startAt: addDays(now, 30),
    endAt: addDays(now, 31),
    coverImage: "https://picsum.photos/seed/draft/1200/600",
    tickets: [
      { name: "VIP", priceCents: 15050, quantityTotal: 10 },
      { name: "Standard", priceCents: 4000, quantityTotal: 80 },
      { name: "Free", priceCents: 0, quantityTotal: 20 },
    ],
  });

  console.log("[seed] Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
