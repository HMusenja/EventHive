import { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from "react";
import { fetchMyTickets } from "@/api/ticketsApi";
import { useAuth } from "./AuthContext";

export const TicketContext = createContext();

const initialState = {
  tickets: [],
  loading: false,
  error: null,
  page: 1,
  pageSize: 12,
  total: 0,
  filterBy: "all",
  searchTerm: "",
};

function ticketReducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        tickets: action.payload.tickets || [],
        total: action.payload.total ?? (action.payload.tickets || []).length,
        error: null,
      };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };
    case "SET_PAGE":
      return { ...state, page: action.payload };
    case "SET_FILTER":
      return { ...state, filterBy: action.payload };
    case "SET_SEARCH":
      return { ...state, searchTerm: action.payload };
    default:
      return state;
  }
}

export const TicketProvider = ({ children }) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(ticketReducer, initialState);

  // memoized fetch to avoid identity churn
  const loadMyTickets = useCallback(async () => {
    dispatch({ type: "FETCH_START" });
    try {
      const result = await fetchMyTickets();
      const arr = Array.isArray(result) ? result : [];
      console.log("[TicketContext] fetchMyTickets result count:", arr.length);
      console.debug("[TicketContext] sample:", arr.slice(0, 3));
      dispatch({ type: "FETCH_SUCCESS", payload: { tickets: arr } });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to load tickets";
      console.error("[TicketContext] loadMyTickets error:", msg, err?.response?.data);
      dispatch({ type: "FETCH_ERROR", payload: msg });
    }
  }, []); // fetchMyTickets is stable import; if you want to include it, add as dependency

  // fetch once when user becomes available
  useEffect(() => {
    if (user) {
      loadMyTickets();
    } else {
      // clear if logged out
      dispatch({ type: "FETCH_SUCCESS", payload: { tickets: [] } });
    }
  }, [user, loadMyTickets]);

  // stable setters
  const setPage = useCallback((p) => dispatch({ type: "SET_PAGE", payload: p }), []);
  const setFilter = useCallback((f) => dispatch({ type: "SET_FILTER", payload: f }), []);
  const setSearch = useCallback((s) => dispatch({ type: "SET_SEARCH", payload: s }), []);

  // filtered tickets derived from state (recomputed only when relevant)
  const filteredTickets = useMemo(() => {
    const q = (state.searchTerm || "").toLowerCase();
    return (state.tickets || []).filter((ticket) => {
      const title = String(ticket.eventMeta?.title || ticket.eventName || "").toLowerCase();
      const venue = String(ticket.eventMeta?.venue?.name || ticket.venue || "").toLowerCase();
      const category = String(ticket.category || "").toLowerCase();

      const matchesSearch = !q || title.includes(q) || venue.includes(q) || category.includes(q);
      const matchesFilter = state.filterBy === "all" || ticket.status === state.filterBy;

      return matchesSearch && matchesFilter;
    });
  }, [state.tickets, state.searchTerm, state.filterBy]);

  // memoize the context value so its identity is stable across renders
  const value = useMemo(() => ({
    ...state,
    tickets: filteredTickets,
    loadTickets: loadMyTickets,
    setPage,
    setFilter,
    setSearch,
  }), [state, filteredTickets, loadMyTickets, setPage, setFilter, setSearch]);

  return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
};

export const useTickets = () => {
  const ctx = useContext(TicketContext);
  if (!ctx) throw new Error("useTickets must be used within TicketProvider");
  return ctx;
};

