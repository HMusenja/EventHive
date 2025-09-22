// src/context/EventContext.jsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import {
  getAllEvents,
  getMyOrganizing,
  updateEvent as apiUpdateEvent,
  createEvent as apiCreateEvent,
  deleteEventById,
} from "@/api/eventsApi";
import { toast } from "sonner";

const EventContext = createContext(null);

const initialState = {
  events: [],
  loading: false,
  error: "",
  lastFetchedAt: null,

  updating: false,
  updateError: "",

  creating: false,
  createError: "",

  deletingId: null, // ← track which event is being deleted
};

function upsert(events, updated) {
  const id = String(updated._id || updated.id);
  const i = events.findIndex((e) => String(e._id || e.id) === id);
  if (i === -1) return [updated, ...events];
  const copy = events.slice();
  copy[i] = { ...events[i], ...updated };
  return copy;
}

function reducer(state, action) {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, loading: true, error: "" };
    case "LOAD_SUCCESS":
      return {
        ...state,
        loading: false,
        events: action.payload,
        lastFetchedAt: Date.now(),
      };
    case "LOAD_ERROR":
      return { ...state, loading: false, error: action.error };

    case "UPDATE_START":
      return { ...state, updating: true, updateError: "" };
    case "UPDATE_OPTIMISTIC":
      return { ...state, events: upsert(state.events, action.payload) };
    case "UPDATE_SUCCESS":
      return { ...state, updating: false, events: upsert(state.events, action.payload) };
    case "UPDATE_ERROR":
      return { ...state, updating: false, updateError: action.error };

    case "CREATE_START":
      return { ...state, creating: true, createError: "" };
    case "CREATE_SUCCESS":
      return { ...state, creating: false, events: upsert(state.events, action.payload) };
    case "CREATE_ERROR":
      return { ...state, creating: false, createError: action.error };

    case "DELETE_START":
      return { ...state, deletingId: action.id, error: "" };
    case "DELETE_SUCCESS":
      return {
        ...state,
        deletingId: null,
        events: state.events.filter((e) => String(e._id) !== String(action.id)),
      };
    case "DELETE_ERROR":
      return { ...state, deletingId: null, error: action.error };

    default:
      return state;
  }
}

/** Public hook */
export function useEvents() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEvents must be used within <EventProvider />");
  return ctx;
}

export function useEvent(id) {
  const { state } = useEvents();
  return useMemo(
    () => state.events.find((e) => String(e._id || e.id) === String(id)),
    [state.events, id]
  );
}

/** Provider */
export function EventProvider({ children, autoLoad = true }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  async function fetchEvents() {
    try {
      dispatch({ type: "LOAD_START" });
      const data = await getAllEvents();
      dispatch({ type: "LOAD_SUCCESS", payload: data });
    } catch (e) {
      dispatch({
        type: "LOAD_ERROR",
        error: e?.message || "Failed to load events",
      });
    }
  }

  async function fetchMyEvents() {
    try {
      dispatch({ type: "LOAD_START" });
      const data = await getMyOrganizing();
      dispatch({ type: "LOAD_SUCCESS", payload: data });
    } catch (e) {
      dispatch({
        type: "LOAD_ERROR",
        error: e?.message || "Failed to load my events",
      });
    }
  }

  // Update (optimistic)
  async function updateEvent(id, patch) {
    try {
      dispatch({ type: "UPDATE_START" });
      dispatch({ type: "UPDATE_OPTIMISTIC", payload: { _id: id, ...patch } });
      const saved = await apiUpdateEvent(id, patch);
      dispatch({ type: "UPDATE_SUCCESS", payload: saved });
      return saved;
    } catch (e) {
      const msg = e?.message || "Failed to update event";
      dispatch({ type: "UPDATE_ERROR", error: msg });
      toast.error(msg);
      throw e;
    }
  }

  // Create
  async function createEvent(payload) {
    try {
      dispatch({ type: "CREATE_START" });
      const created = await apiCreateEvent(payload);
      dispatch({ type: "CREATE_SUCCESS", payload: created });
      return created;
    } catch (e) {
      const msg = e?.message || "Failed to create event";
      dispatch({ type: "CREATE_ERROR", error: msg });
      toast.error(msg);
      throw e;
    }
  }

  // 🔥 Delete
  async function deleteEvent(id) {
    if (!id) return;
    try {
      dispatch({ type: "DELETE_START", id });
      await deleteEventById(id);
      dispatch({ type: "DELETE_SUCCESS", id });
      toast.success("Event deleted");
      // If you prefer, you can re-fetch instead of optimistic removal:
      // await fetchMyEvents();
      return true;
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to delete event";
      dispatch({ type: "DELETE_ERROR", error: msg });
      toast.error(msg);
      throw e;
    }
  }

  useEffect(() => {
    if (autoLoad) fetchEvents();
  }, [autoLoad]);

  const value = {
    state,
    fetchEvents,
    fetchMyEvents,
    updateEvent,
    createEvent,
    deleteEvent, // ← expose delete
  };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}
