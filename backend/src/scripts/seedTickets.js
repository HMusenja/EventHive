import "dotenv/config";
import mongoose from "mongoose";
import Ticket from "../models/Ticket.js";

const eventId = process.argv[2]; // pass the eventId on the command line

async function run() {
    if (!eventId) {
        console.error("Usage: node src/scripts/seedTickets.js <eventId>");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const rows = [
        { eventId, name: "General Admission", description: "All sessions", currency: "eur", priceCents: 1500, quantityTotal: 200, isActive: true },
        { eventId, name: "VIP", description: "Front row + lounge", currency: "eur", priceCents: 4900, quantityTotal: 50, isActive: true },
        { eventId, name: "Student", description: "ID required", currency: "eur", priceCents: 500, quantityTotal: 100, isActive: true },
    ];

    await Ticket.deleteMany({ eventId });
    await Ticket.insertMany(rows);

    console.log("Seeded tickets for eventId:", eventId);
    await mongoose.disconnect();
}
run().catch(err => { console.error(err); process.exit(1); });
