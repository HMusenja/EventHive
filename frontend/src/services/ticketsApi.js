import axios from "./axiosConfig";  // uses your configured axios instance

// GET tickets for an event
export const fetchTickets = (eventId) =>
 
  axios.get(`/tickets/event/${eventId}`).then(r => r.data?.tickets || []);

// Guest checkout (free or paid dummy)
export const checkoutGuest = (payload) =>
  axios.post(`/ticketing/checkout-guest`, payload)
    .then(r => r.data)
    .catch(err => {
      const res = err?.response?.data;
      const norm = new Error(res?.message || "Request failed");
      norm.code = res?.code || "HTTP_ERROR";
      throw norm;
    });

    // Signed checkout (requires auth session)
export const checkoutSigned = (payload) =>
  axios.post(`/ticketing/checkout`, payload)
    .then(r => r.data)
    .catch(err => {
      const res = err?.response?.data;
      const norm = new Error(res?.message || "Request failed");
      norm.code = res?.code || "HTTP_ERROR";
      throw norm;
    });

// Dummy payment completion (simulate Stripe webhook)
export const completeDummyPayment = (orderId) =>
  axios.post(`/ticketing/dummy/complete`, { orderId })
    .then(r => r.data)
    .catch(err => {
      const { status, data } = err?.response || {};
      if (status === 409 && data?.code === "DUPLICATE_KEY") {
        // consider this a success — backend already fulfilled
        return { success: true, already: true, orderId };
      }
      throw err;
    });