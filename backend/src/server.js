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

import userRoutes from "./routes/users.routes.js"


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
app.use("/api/users", userRoutes);





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