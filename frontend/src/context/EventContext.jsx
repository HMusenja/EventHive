import { createContext, useContext, useEffect, useReducer } from "react";
import { getAllEvents } from "@/api/eventsApi";

const EventContext = createContext(null);

const initialState = {
  events: [],
  loading: false,
  error: "",
  lastFetchedAt: null,
};

function eventReducer(state, action) {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, loading: true, error: "" };
    case "LOAD_SUCCESS":
      return { ...state, loading: false, events: action.payload, lastFetchedAt: Date.now() };
    case "LOAD_ERROR":
      return { ...state, loading: false, error: action.error };
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

/** Provider */
export function EventProvider({ children, autoLoad = true }) {
  const [state, dispatch] = useReducer(eventReducer, initialState);

  async function fetchEvents() {
    try {
      dispatch({ type: "LOAD_START" });
      const data = await getAllEvents();
      dispatch({ type: "LOAD_SUCCESS", payload: data });
    } catch (e) {
      dispatch({ type: "LOAD_ERROR", error: e?.message || "Failed to load events" });
    }
  }

  useEffect(() => {
    if (autoLoad) fetchEvents();
  }, [autoLoad]);

  const value = { state, dispatch, fetchEvents };
  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}
