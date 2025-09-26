import axios from "@/services/axiosConfig";

// Small helpers
const enc = (v) => encodeURIComponent(String(v ?? "").trim());
const dataOr = (r, key, fallback) => (r?.data?.[key] ?? fallback);
const normErr = (err, fb = "Request failed") => {
  const res = err?.response?.data;
  const e = new Error(res?.message || err?.message || fb);
  e.code = res?.code || err?.code || "HTTP_ERROR";
  e.status = err?.response?.status;
  e.details = res;
  return e;
};

// ————————————————————————————————
// Reads
// ————————————————————————————————

export async function fetchTickets(eventId) {
  try {
    const r = await axios.get(`/tickets/event/${enc(eventId)}`);
    return dataOr(r, "tickets", []);
  } catch (err) {
    console.error("[ticketsApi.fetchTickets] error:", err?.response?.data || err.message);
    throw normErr(err, "Failed to load event tickets");
  }
}

export async function fetchMyTickets() {
  try {
    const r = await axios.get("/tickets/mine");
    console.debug("[ticketsApi.fetchMyTickets] response data:", r?.data);
    return dataOr(r, "tickets", []);
  } catch (err) {
    const resp = err?.response;
    console.error("[ticketsApi.fetchMyTickets] API error:", {
      status: resp?.status,
      data: resp?.data,
      headers: resp?.headers,
      message: err?.message,
    });
    throw normErr(err, "Failed to load my tickets");
  }
}

export const listEventTickets = fetchTickets;

// ————————————————————————————————
// Checkout flows
// ————————————————————————————————

export async function checkoutGuest(payload) {
  try {
    const r = await axios.post("/ticketing/checkout-guest", payload);
    return r.data;
  } catch (err) {
    throw normErr(err, "Guest checkout failed");
  }
}

export async function checkoutSigned(payload) {
  try {
    const r = await axios.post("/ticketing/checkout", payload);
    return r.data;
  } catch (err) {
    throw normErr(err, "Checkout failed");
  }
}

export async function completeDummyPayment(orderId) {
  try {
    const r = await axios.post("/ticketing/dummy/complete", { orderId });
    return r.data;
  } catch (err) {
    const { status, data } = err?.response || {};
    if (status === 409 && data?.code === "DUPLICATE_KEY") {
      return { success: true, already: true, orderId };
    }
    throw normErr(err, "Payment completion failed");
  }
}

// ————————————————————————————————
// Organizer actions
// ————————————————————————————————

export async function createEventTicket(eventId, data) {
  try {
    const r = await axios.post(`/tickets/events/${enc(eventId)}`, data);
    return dataOr(r, "ticket", null);
  } catch (err) {
    console.error("[ticketsApi.createEventTicket] payload sent:", data);
    console.error("[ticketsApi.createEventTicket] response:", err?.response?.data);
    throw normErr(err, "Failed to create ticket type");
  }
}

export async function updateEventTicket(id, data) {
  try {
    const r = await axios.put(`/tickets/${enc(id)}`, data);
    return dataOr(r, "ticket", null);
  } catch (err) {
    throw normErr(err, "Failed to update ticket");
  }
}

export async function deleteEventTicket(id) {
  try {
    await axios.delete(`/tickets/${enc(id)}`);
    return true;
  } catch (err) {
    throw normErr(err, "Failed to delete ticket");
  }
}
