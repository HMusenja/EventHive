// middleware/errorHandler.js
import createError from "http-errors";
import { normalizeError } from "../utils/errors.js";

export const routeNotFound = (req, res, next) => {
  next(createError(404, "Route not found", { code: "NOT_FOUND" }));
};

export const globalErrorHandler = (err, req, res, next) => {
  const e = normalizeError(err);

  const body = {
    ok: false,
    code: e.code,
    message: e.message,
  };
  if (e.details) body.details = e.details;

  if (process.env.NODE_ENV !== "production") {
    body._debug = { stack: e.stack };
  }

  res.status(e.status).json(body);
};
