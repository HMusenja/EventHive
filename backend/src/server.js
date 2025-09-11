import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";

import { connectDB } from "./config/db.js";
import {
  globalErrorHandler,
  routeNotFound,
} from "./middleware/errorHandler.js";


import eventRoutes from "./routes/events.routes.js";
import userRoutes from "./routes/users.routes.js";
import ticketRoutes from "./routes/tickets.routes.js";
import ticketingRoutes from "./routes/ticketingRoutes.js";
import  orderRoutes from "./routes/orderRoutes.js";
import checkinRoutes from "./routes/checkinRoutes.js";
import attendeeRoutes from "./routes/attendee.routes.js";
import eventMemberRoutes from "./routes/eventMember.routes.js";
import onboardingRoutes from "./routes/onboarding.routes.js";
import matchmakingRoutes from "./routes/matches.routes.js"
import eventMatchRoutes from "./routes/eventMatch.routes.js";
import { stripeWebhook } from "./controllers/webhookController.js";
//import paymentRoutes from "./routes/payments.routes.js";
import meetingRoutes from "./routes/meetings.routes.js";


dotenv.config();
await connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// ----------------- Middleware -----------------
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// ----------------- Routers -----------------
app.use("/api/events", eventRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/ticketing", ticketingRoutes); 
app.use("/api/orders", orderRoutes);        
app.use("/api", checkinRoutes);
app.use("/api/attendees", attendeeRoutes);
app.use("/api", eventMemberRoutes);
app.use("/api", onboardingRoutes);
app.use("/api", matchmakingRoutes);
app.use("/api", eventMatchRoutes);

//app.use("/api/payments", paymentRoutes);
app.use("/api/meetings", meetingRoutes);




//! Error Handlers
app.use(routeNotFound);
app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(
    ` Server is up and running!\n` +
    ` Listening on http://localhost:${PORT}\n` +
    ` Started at: ${new Date().toLocaleString()}\n`

  );
});