import createError from "http-errors";

export const routeNotFound = (req, res, next) => {
  next(createError(404, "Page was not found"));
};
export const globalErrorHandler = (err, req, res, next) => {
  res.status(err.status || 500).json({
    statusCode: err.status || 500,
    message: err.message || "Internal Server Error",
    details: err.details || undefined,
  });
};