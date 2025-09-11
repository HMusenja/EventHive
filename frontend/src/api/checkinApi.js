// src/services/checkinApi.js
import axios from "axios";

export const scanCheckin = (eventId, { orderId, ticketRef }) =>
  axios.post(`/api/events/${eventId}/checkin`, { orderId, ticketRef }).then(r => r.data);
