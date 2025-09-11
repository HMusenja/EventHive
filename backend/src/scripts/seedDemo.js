// scripts/seed.js
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../config/db.js";

import User from "../models/User.js";
import Event from "../models/Event.js";
import Attendee from "../models/Attendee.js";
import EventMember from "../models/EventMember.js";
import Ticket from "../models/Ticket.js";

/** ---------- helpers ---------- */

const INTEREST_POOL = [
  "ai", "ml", "react", "node", "fintech", "payments", "banking",
  "linux", "kernels", "git", "tooling", "cloud", "devops",
  "web3", "security", "design", "ux", "product", "data", "iot",
];

function pickN(arr, n) {
  const a = [...arr];
  const out = [];
  while (a.length && out.length < n) {
    const i = Math.floor(Math.random() * a.length);
    out.push(a.splice(i, 1)[0]);
  }
  return out;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function slugify(s) {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function makeEmail(name, i) {
  const base = slugify(name).replace(/-+/g, ".");
  return `${base || "user"}${i}@seed.local`;
}

function randomBio(name) {
  const bits = [
    "Builder and lifelong learner.",
    "Focused on developer experience and tooling.",
    "Shipping features and fixing bugs.",
    "Tinkering with open-source and automation.",
    "Exploring AI and data products.",
    "Designing reliable systems.",
  ];
  return `${name} — ${bits[randInt(0, bits.length - 1)]}`;
}

/** Upsert a user by email */
async function upsertUser({ fullName, email, username, role = "user", password = "p@ssw0rd" }) {
  const existing = await User.findOne({ email }).select("_id").lean();
  if (existing) return await User.findById(existing._id);
  const user = new User({ fullName, email, username, role, password });
  await user.save(); // pre-save will hash password
  return user;
}

/** Ensure Attendee profile for user */
async function ensureAttendeeProfile(user) {
  const found = await Attendee.findOne({ userId: user._id });
  if (found) return found;

  const interests = pickN(INTEREST_POOL, randInt(3, 7));
  const att = await Attendee.create({
    userId: user._id,
    bio: randomBio(user.fullName),
    avatar: "",
    interests,
  });
  return att;
}

/** Ensure event exists (by slug) */
async function ensureEvent({ title, ownerId, startAt, endAt, city = "Berlin", country = "DE" }) {
  const slug = slugify(title);
  let ev = await Event.findOne({ slug });
  if (ev) return ev;

  ev = await Event.create({
    slug,
    title,
    subtitle: "Build, ship, connect",
    description: "",
    coverImage: "",
    onboardingEnabled: true,
    startAt,
    endAt,
    timezone: "Europe/Berlin",
    venue: { name: "City Conference Center", city, country },
    ownerId,
    visibility: "public",
    capacity: 0,
  });
  return ev;
}

/** Ensure 2–3 ticket types per event */
async function ensureTicketsForEvent(event) {
  const current = await Ticket.find({ eventId: event._id });
  if (current.length >= 2) return current;

  const now = new Date();
  const salesStart = new Date(now.getTime() - 3 * 24 * 3600 * 1000);
  const salesEnd = new Date(event.startAt.getTime() - 24 * 3600 * 1000);

  const base = [
    { name: "Standard", priceCents: 1999, quantityTotal: 500 },
    { name: "VIP", priceCents: 6999, quantityTotal: 50 },
    { name: "Late Bird", priceCents: 2999, quantityTotal: 200 },
  ];

  const howMany = randInt(2, 3);
  const chosen = pickN(base, howMany);

  const creates = chosen.map((t) =>
    Ticket.findOneAndUpdate(
      { eventId: event._id, name: t.name },
      {
        $setOnInsert: {
          eventId: event._id,
          description: `${t.name} ticket`,
          currency: "eur",
          priceCents: t.priceCents,
          quantityTotal: t.quantityTotal,
          quantitySold: randInt(0, Math.floor(t.quantityTotal * 0.4)),
          salesStartAt: salesStart,
          salesEndAt: salesEnd,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    )
  );

  return await Promise.all(creates);
}

/** Add approved EventMember attendees to an event */
async function addMembersToEvent(event, usersPool, { min = 8, max = 20 } = {}) {
  const target = randInt(min, max);
  const chosen = pickN(usersPool, Math.min(usersPool.length, target));

  const results = [];
  for (const u of chosen) {
    // Skip if already a member
    const exists = await EventMember.findOne({ eventId: event._id, userId: u._id }).lean();
    if (exists) { results.push(exists); continue; }

    // Use attendee profile to copy bio/interests
    const att = await Attendee.findOne({ userId: u._id }).lean();
    const member = await EventMember.create({
      eventId: event._id,
      userId: u._id,
      roles: ["attendee"],
      status: "approved",
      bio: att?.bio?.slice(0, 600) || "",
      interests: (att?.interests || []).map((s) => String(s).trim().toLowerCase()).slice(0, 12),
      avatarOverride: "",
    });
    results.push(member);
  }
  return results;
}

/** ---------- main ---------- */

async function main() {
  await connectDB();

  console.log("Seeding demo data…");

  // 1) Ensure 5 owner users
  const ownerNames = ["Ava Wood", "Noah Miller", "Mia Becker", "Jonas Roth", "Lena Koch"];
  const owners = [];
  for (let i = 0; i < ownerNames.length; i++) {
    const fullName = ownerNames[i];
    const email = makeEmail(fullName, i + 1); // unique seed.local emails
    const username = slugify(fullName);
    const user = await upsertUser({ fullName, email, username, role: "organizer" });
    owners.push(user);
  }
  console.log(`Owners ready: ${owners.length}`);

  // 2) Ensure attendee user pool (re-use existing + top-up)
  const EXISTING_USERS = await User.find().limit(100).lean();
  const pool = [];

  // Use all existing non-owner users first
  const ownerIds = new Set(owners.map((o) => String(o._id)));
  for (const u of EXISTING_USERS) {
    if (!ownerIds.has(String(u._id))) pool.push(await User.findById(u._id));
  }

  // Top-up to at least 25 users (including owners) so each event can have attendees
  const MIN_POOL = 25;
  let i = 1;
  while (owners.length + pool.length < MIN_POOL) {
    const name = `Seed User ${i}`;
    const email = makeEmail(name, 100 + i);
    const username = slugify(name) + i;
    const u = await upsertUser({ fullName: name, email, username, role: "user" });
    pool.push(u);
    i++;
  }
  console.log(`Attendee pool size (excluding owners): ${pool.length}`);

  // 3) Ensure attendee profiles for everyone (owners + pool)
  const everyone = [...owners, ...pool];
  for (const u of everyone) {
    await ensureAttendeeProfile(u);
  }
  console.log(`Attendee profiles ensured: ${everyone.length}`);

  // 4) Create 5 events (one per owner)
  const now = new Date();
  const events = [];
  for (let idx = 0; idx < owners.length; idx++) {
    const owner = owners[idx];
    const startAt = new Date(now.getTime() + (idx + 7) * 24 * 3600 * 1000); // stagger into future
    const endAt = new Date(startAt.getTime() + 8 * 3600 * 1000);

    const title = `Fusion ${2025 + idx}`;
    const ev = await ensureEvent({ title, ownerId: owner._id, startAt, endAt });
    events.push(ev);

    // Tickets for event
    await ensureTicketsForEvent(ev);

    // Add members (approved attendees) randomly from pool
    await addMembersToEvent(ev, pool, { min: 10, max: 24 });
  }
  console.log(`Events ready: ${events.length}`);

  // 5) Also ensure each owner is an organizer member on their event
  for (let idx = 0; idx < events.length; idx++) {
    const ev = events[idx];
    const owner = owners[idx];
    const exists = await EventMember.findOne({ eventId: ev._id, userId: owner._id }).lean();
    if (!exists) {
      await EventMember.create({
        eventId: ev._id,
        userId: owner._id,
        roles: ["organizer"],
        status: "approved",
        bio: randomBio(owner.fullName).slice(0, 600),
        interests: pickN(INTEREST_POOL, randInt(3, 6)),
      });
    }
  }

  // Summary
  const totalMembers = await EventMember.countDocuments({});
  const totalTickets = await Ticket.countDocuments({});
  const totalAttendees = await Attendee.countDocuments({});
  console.log("✅ Seed complete");
  console.table([
    { metric: "Events", value: events.length },
    { metric: "Users (owners+pool)", value: everyone.length },
    { metric: "Attendee profiles", value: totalAttendees },
    { metric: "Event members", value: totalMembers },
    { metric: "Tickets", value: totalTickets },
  ]);

  await mongoose.connection.close();
}

main().catch(async (err) => {
  console.error("Seed failed:", err);
  await mongoose.connection.close();
  process.exit(1);
});

