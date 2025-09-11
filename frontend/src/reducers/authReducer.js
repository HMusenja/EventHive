export const authReducer = (state, action) => {


  switch (action.type) {
    case "AUTH_LOADING":
      return { ...state, loading: true, error: null };
    case "AUTH_SUCCESS":
      return { ...state, user: action.payload, isAuthenticated: true, loading: false, loaded: true, };
    case "AUTH_LOGOUT":
      return { ...state, user: null, isAuthenticated: false, loading: false,loaded: true, };
    case "AUTH_ERROR":
      return { ...state, user: null,isAuthenticated: false, loading: false, error: action.payload };
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
      };
    default:
      console.warn("[AuthReducer] Unknown action type:", action.type);
      return state;
  }
};
