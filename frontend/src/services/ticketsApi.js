import axios from "./axiosConfig";  // you should already have axiosConfig.js in services/

// GET tickets for an event
export const fetchTickets = (eventId) =>
    axios.get(`/tickets/${eventId}`).then(r => r.data);

// (Later) create checkout session
// export const createCheckoutSession = (payload) =>
//   axios.post(`/payments/checkout-session`, payload).then(r => r.data);
