// controllers/webhookController.js
export const stripeWebhook = async (req, res, _next) => {
  // IMPORTANT: configure your app to pass raw body for this route.
  // This is just a placeholder; wire Stripe SDK + secrets when ready.
  res.json({ received: true });
};
