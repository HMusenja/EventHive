import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
    withCredentials: true,
    autoConnect: false,
});

function getStoredJwt() {
    const t = localStorage.getItem("token");
    // very simple “looks like a JWT” check
    return t && /^\S+\.\S+\.\S+$/.test(t) ? t : null;
}

function setAuthFromLocalStorage() {
    const jwt = getStoredJwt();
    if (jwt) socket.auth = { token: jwt };
    else delete socket.auth; // fall back to cookie
}

export function connectSocket() {
    setAuthFromLocalStorage();
    if (!socket.connected) socket.connect();
}

socket.on("reconnect_attempt", setAuthFromLocalStorage);

export default socket;
