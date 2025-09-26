// src/context/OrganizerTicketContext.jsx
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";
import {
  listEventTickets,
  createEventTicket,
  updateEventTicket,
  deleteEventTicket,
} from "@/api/ticketsApi";
import { toast } from "sonner";

const OrganizerTicketContext = createContext(null);

const initial = {
  items: [],
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  error: null,
  eventId: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_EVENT":
      return { ...state, eventId: action.eventId, items: [] };
    case "LOAD_START":
      return { ...state, loading: true, error: null };
    case "LOAD_SUCCESS":
      return { ...state, loading: false, items: action.items, error: null };
    case "LOAD_ERROR":
      return { ...state, loading: false, error: action.error };
    case "CREATE_START":
      return { ...state, creating: true, error: null };
    case "CREATE_SUCCESS":
      return {
        ...state,
        creating: false,
        items: [action.item, ...state.items],
      };
    case "CREATE_ERROR":
      return { ...state, creating: false, error: action.error };
    case "UPDATE_START":
      return { ...state, updating: true, error: null };
    case "UPDATE_SUCCESS":
      return {
        ...state,
        updating: false,
        items: state.items.map((it) =>
          it._id === action.item._id ? action.item : it
        ),
      };
    case "UPDATE_ERROR":
      return { ...state, updating: false, error: action.error };
    case "DELETE_START":
      return { ...state, deleting: true, error: null };
    case "DELETE_SUCCESS":
      return {
        ...state,
        deleting: false,
        items: state.items.filter((it) => it._id !== action.id),
      };
    case "DELETE_ERROR":
      return { ...state, deleting: false, error: action.error };
    default:
      return state;
  }
}

export function OrganizerTicketProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);

  const setEvent = useCallback((eventId) => {
    dispatch({ type: "SET_EVENT", eventId });
  }, []);

  const load = useCallback(async (eventId) => {
    if (!eventId) return;
    dispatch({ type: "LOAD_START" });
    try {
      const items = await listEventTickets(eventId);
      dispatch({ type: "LOAD_SUCCESS", items });
    } catch (e) {
      const res = e?.response?.data;
      const msg = res?.details?.errors
        ? Object.values(res.details.errors)[0]?.message || res.message
        : res?.details?.message ||
        res?.message ||
        e.message ||
        "Failed to create ticket";
      dispatch({ type: "LOAD_ERROR", error: msg });
      toast.error(msg);
    }
  }, []);

  const create = useCallback(async (eventId, data) => {
    dispatch({ type: "CREATE_START" });
    try {
      const item = await createEventTicket(eventId, data);

      // normalize common shapes just in case
      const created =
        item?.data?.ticket || item?.data || item?.ticket || item;

      if (!created || !created._id) {
        throw new Error("Ticket API did not return a ticket object");
      }

      dispatch({ type: "CREATE_SUCCESS", item: created });
      toast.success("Ticket created");
      return created;
    } catch (e) {
      const res = e?.response?.data;
      const firstValidation =
        res?.details?.errors &&
        Object.values(res.details.errors)[0]?.message;

      const msg =
        firstValidation ||
        res?.details?.message ||
        res?.message ||
        e.message ||
        "Failed to create ticket";

      dispatch({ type: "CREATE_ERROR", error: msg });
      toast.error(msg);
      throw e;
    }
  }, [toast]);



  const update = useCallback(async (id, data) => {
    dispatch({ type: "UPDATE_START" });
    try {
      const item = await updateEventTicket(id, data);
      dispatch({ type: "UPDATE_SUCCESS", item });
      toast.success("Ticket updated");
      return item;
    } catch (e) {
      const msg =
        e?.response?.data?.message || e.message || "Failed to update ticket";
      dispatch({ type: "UPDATE_ERROR", error: msg });
      toast.error(msg);
      throw e;
    }
  }, []);

  const remove = useCallback(async (id) => {
    dispatch({ type: "DELETE_START" });
    try {
      await deleteEventTicket(id);
      dispatch({ type: "DELETE_SUCCESS", id });
      toast.success("Ticket deleted");
      return true;
    } catch (e) {
      const msg =
        e?.response?.data?.message || e.message || "Failed to delete ticket";
      dispatch({ type: "DELETE_ERROR", error: msg });
      toast.error(msg);
      throw e;
    }
  }, []);

  const value = useMemo(
    () => ({ ...state, setEvent, load, create, update, remove }),
    [state, setEvent, load, create, update, remove]
  );

  return (
    <OrganizerTicketContext.Provider value={value}>
      {children}
    </OrganizerTicketContext.Provider>
  );
}

export const useOrganizerTickets = () => {
  const ctx = useContext(OrganizerTicketContext);
  if (!ctx)
    throw new Error(
      "useOrganizerTickets must be used within OrganizerTicketProvider"
    );
  return ctx;
};
