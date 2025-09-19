import { createContext, useContext, useEffect, useReducer } from "react";
import { getAllEvents, getMyOrganizing, updateEvent as apiUpdateEvent  } from "@/api/eventsApi";

const EventContext = createContext(null);

const initialState = {
  events: [],
  loading: false,
  error: "",
  lastFetchedAt: null,
  updating: false,
  updateError: "",
};

function upsert(events, updated) {
  const id = String(updated._id || updated.id);
  const i = events.findIndex(e => String(e._id || e.id) === id);
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
      return { ...state, loading: false, events: action.payload, lastFetchedAt: Date.now() };
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
    () => state.events.find(e => String(e._id || e.id) === String(id)),
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
      dispatch({ type: "LOAD_ERROR", error: e?.message || "Failed to load events" });
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
  
  // Core: update via context (optimistic)
  async function updateEvent(id, patch) {
    try {
      dispatch({ type: "UPDATE_START" });

      // optimistic merge
      dispatch({ type: "UPDATE_OPTIMISTIC", payload: { _id: id, ...patch } });

      const saved = await apiUpdateEvent(id, patch);
      dispatch({ type: "UPDATE_SUCCESS", payload: saved });

      return saved;
    } catch (e) {
      dispatch({ type: "UPDATE_ERROR", error: e?.message || "Failed to update event" });
      throw e;
    }
  }

  useEffect(() => {
    if (autoLoad) fetchEvents();
  }, [autoLoad]);

  const value = { state, fetchEvents, fetchMyEvents,updateEvent };
  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}