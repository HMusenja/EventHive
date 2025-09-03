// backend/src/scripts/seedEvents.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../config/db.js"; 
import Event from "../models/Event.js";

dotenv.config();

async function seed() {
  try {
    await connectDB();

    await Event.deleteMany({});
    console.log("Cleared existing events");

    const events = [
      {
        slug: "eventhive-2025",
        title: "EventHive Summit 2025",
        subtitle: "Where builders meet users",
        description: "A day of talks, demos, and networking.",
        coverImage: "https://picsum.photos/1600/900?random=1",
        startAt: new Date("2025-10-12T08:00:00+02:00"),
        endAt: new Date("2025-10-12T20:00:00+02:00"),
        timezone: "Europe/Berlin",
        venue: {
          name: "Hamburg Messe",
          address: "Messeplatz 1",
          city: "Hamburg",
          country: "DE",
          lat: 53.5597,
          lng: 9.9772,
        },
        speakers: [
          { name: "Ada Lovelace", title: "Engineer", company: "Analytica", avatarUrl: "https://i.pravatar.cc/200?img=5" },
          { name: "Grace Hopper", title: "Rear Admiral", company: "USN", avatarUrl: "https://i.pravatar.cc/200?img=12" },
        ],
        agenda: [
          { title: "Registration & Coffee", startAt: "2025-10-12T08:00:00+02:00", endAt: "2025-10-12T09:00:00+02:00", room: "Hall A", speakerNames: [] },
          { title: "Opening Keynote", startAt: "2025-10-12T09:00:00+02:00", endAt: "2025-10-12T09:45:00+02:00", room: "Main Stage", speakerNames: ["Ada Lovelace"] },
        ],
      },
      {
        slug: "techfest-2025",
        title: "TechFest Europe 2025",
        subtitle: "Exploring the future of tech",
        description: "Workshops, sessions, and exhibitions on emerging technology.",
        coverImage: "https://picsum.photos/1600/900?random=2",
        startAt: new Date("2025-11-05T09:00:00+01:00"),
        endAt: new Date("2025-11-07T18:00:00+01:00"),
        timezone: "Europe/Berlin",
        venue: {
          name: "Berlin Congress Center",
          address: "Alexanderstraße 11",
          city: "Berlin",
          country: "DE",
          lat: 52.5232,
          lng: 13.4132,
        },
        speakers: [
          { name: "Elon Tusk", title: "CEO", company: "MarsTech", avatarUrl: "https://i.pravatar.cc/200?img=18" },
        ],
        agenda: [
          { title: "AI & Robotics Panel", startAt: "2025-11-05T10:00:00+01:00", endAt: "2025-11-05T11:30:00+01:00", room: "Main Hall", speakerNames: ["Elon Tusk"] },
        ],
      },
      {
        slug: "designcon-2025",
        title: "DesignCon 2025",
        subtitle: "Innovations in UX and Product Design",
        description: "A conference for designers to share best practices and case studies.",
        coverImage: "https://picsum.photos/1600/900?random=3",
        startAt: new Date("2025-09-20T09:00:00+02:00"),
        endAt: new Date("2025-09-22T17:00:00+02:00"),
        timezone: "Europe/Paris",
        venue: {
          name: "Palais des Congrès",
          address: "2 Place de la Porte Maillot",
          city: "Paris",
          country: "FR",
          lat: 48.8789,
          lng: 2.2820,
        },
        speakers: [
          { name: "Don Norman", title: "Author", company: "The Design Lab", avatarUrl: "https://i.pravatar.cc/200?img=45" },
        ],
        agenda: [
          { title: "Human-Centered Design", startAt: "2025-09-20T10:00:00+02:00", endAt: "2025-09-20T11:00:00+02:00", room: "Auditorium A", speakerNames: ["Don Norman"] },
        ],
      },
      {
        slug: "startup-expo-2025",
        title: "Startup Expo 2025",
        subtitle: "Showcasing the next generation of startups",
        description: "An exhibition and pitch competition for global startups.",
        coverImage: "https://picsum.photos/1600/900?random=4",
        startAt: new Date("2025-12-01T10:00:00+01:00"),
        endAt: new Date("2025-12-02T18:00:00+01:00"),
        timezone: "Europe/Berlin",
        venue: {
          name: "Munich Expo Center",
          address: "Am Messesee 2",
          city: "Munich",
          country: "DE",
          lat: 48.1351,
          lng: 11.5820,
        },
        speakers: [
          { name: "Jane Doe", title: "Investor", company: "Future Ventures", avatarUrl: "https://i.pravatar.cc/200?img=32" },
        ],
        agenda: [
          { title: "Pitch Session 1", startAt: "2025-12-01T11:00:00+01:00", endAt: "2025-12-01T12:30:00+01:00", room: "Pitch Stage", speakerNames: ["Jane Doe"] },
        ],
      },
    ];

    await Event.insertMany(events);
    console.log(`Seeded ${events.length} events`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
