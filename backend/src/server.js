import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import { socketAuth } from "./socket/socketAuth.js";
import { setupSocketHandlers } from "./socket/handlers.js";
import { globalErrorHandler, routeNotFound } from "./middleware/errorHandler.js";

// Routers
import eventRoutes from "./routes/events.routes.js";
import userRoutes from "./routes/users.routes.js";
import ticketRoutes from "./routes/tickets.routes.js";
import ticketingRoutes from "./routes/ticketingRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import checkinRoutes from "./routes/checkinRoutes.js";
import attendeeRoutes from "./routes/attendee.routes.js";
import eventMemberRoutes from "./routes/eventMember.routes.js";
import onboardingRoutes from "./routes/onboarding.routes.js";
import matchmakingRoutes from "./routes/matches.routes.js";
import eventMatchRoutes from "./routes/eventMatch.routes.js";
import meetingRoutes from "./routes/meetings.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import feedbackRoutes from "./routes/feedback.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import activityRoutes from "./routes/activityRoutes.js"

dotenv.config();
await connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- Express middleware ----------
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// ---------- Public routes (accessible by anyone) ----------
app.use("/api/feedback", feedbackRoutes);

// ---------- Authenticated routes (protected) ----------
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/ticketing", ticketingRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api", checkinRoutes);
app.use("/api/attendees", attendeeRoutes);
app.use("/api", eventMemberRoutes);
app.use("/api", onboardingRoutes);
app.use("/api", matchmakingRoutes);
app.use("/api", eventMatchRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api", chatRoutes);
app.use("/api", notificationRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/activity",activityRoutes)

// ---------- 404 & global errors ----------
app.use(routeNotFound);
app.use(globalErrorHandler);

// ---------- Socket.IO ----------
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:5173", credentials: true },
});

io.use(socketAuth);
io.on("connection", (socket) => {
  setupSocketHandlers(io, socket);
  socket.on("error", (err) => {
    console.warn("[socket error]", err?.message || err);
  });
});

// ---------- Start server ----------
httpServer.listen(PORT, () => {
  console.log(
    `🚀 Server is up and running!\n` +
    `🔗 Listening on http://localhost:${PORT}\n` +
    `🕒 Started at: ${new Date().toLocaleString()}\n`
  );
});
