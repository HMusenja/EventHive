import axios from "axios";

export const scanCheckin = (eventId, { orderId, ticketRef }) =>
  axios
    .post(`/events/${eventId}/checkin`, { orderId, ticketRef })
    .then((r) => r.data);
