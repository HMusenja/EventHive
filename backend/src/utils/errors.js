// utils/errors.js
export function appError(code, message, status = 400, details = undefined) {
  const err = new Error(message || code);
  err.name = "AppError";
  err.code = code;
  err.status = status;
  if (details) err.details = details; // optional object { fieldErrors, extra, ... }
  return err;
}

// Quick helpers
export const BadRequest   = (code, msg, det) => appError(code, msg, 400, det);
export const Unauthorized = (code, msg, det) => appError(code, msg, 401, det);
export const Forbidden    = (code, msg, det) => appError(code, msg, 403, det);
export const NotFound     = (code, msg, det) => appError(code, msg, 404, det);
export const Conflict     = (code, msg, det) => appError(code, msg, 409, det);
export const Unprocessable= (code, msg, det) => appError(code, msg, 422, det);
export const ServerError  = (code, msg, det) => appError(code, msg, 500, det);

// Normalize foreign errors (Mongoose, etc.) into our shape
export function normalizeError(e) {
  // Already an AppError
  if (e?.code && e?.status && e?.name === "AppError") return e;

  // Mongoose duplicate key (E11000)
  if (e?.code === 11000) {
    const fields = Object.keys(e.keyPattern || {});
    return Conflict("DUPLICATE_KEY", "Duplicate value", { fields, keyValue: e.keyValue });
  }

  // Mongoose bad ObjectId / cast error
  if (e?.name === "CastError") {
    return BadRequest("INVALID_ID", `Invalid ${e.path}`, { path: e.path, value: e.value });
  }

  // Mongoose validation error
  if (e?.name === "ValidationError") {
    const fieldErrors = Object.fromEntries(
      Object.entries(e.errors || {}).map(([k, v]) => [k, v.message])
    );
    return Unprocessable("VALIDATION_ERROR", "Validation failed", { fieldErrors });
  }

  // Http-errors style (you used createError in places)
  if (e?.status && e?.message) {
    return appError(e.code || "HTTP_ERROR", e.message, e.status);
  }

  // Fallback
  return ServerError("INTERNAL_SERVER_ERROR", "Something went wrong");
}
