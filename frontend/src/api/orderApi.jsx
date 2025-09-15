import axios from "axios";

export const getOrderById = (orderId) =>
  axios.get(`/api/orders/${orderId}`).then(r => r.data); 