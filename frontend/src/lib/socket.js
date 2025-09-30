import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5050", {

    withCredentials: true,
    autoConnect: false,
});

function getStoredJwt() {
    const t = localStorage.getItem("token");
    // very simple “looks like a JWT” check
    return t && /^\S+\.\S+\.\S+$/.test(t) ? t : null;
}

//function setAuthFromLocalStorage() {
//    const jwt = getStoredJwt();
//    if (jwt) socket.auth = { token: jwt };
//    else delete socket.auth; // fall back to cookie
//}

let authSig = null; // tracks what auth we connected with
export function refreshSocketAuth({ force = false } = {}) {
    const jwt = getStoredJwt();
    const nextSig = jwt || "COOKIE";
    const changed = nextSig !== authSig;

    if (jwt) socket.auth = { token: jwt };
    else delete socket.auth; // use cookie session

    if ((changed || force) && socket.connected) {
        authSig = nextSig;
        socket.disconnect();
        socket.connect();
    } else {
        authSig = nextSig;
    }
}
export function connectSocket() {
    refreshSocketAuth();
    //setAuthFromLocalStorage();
    if (!socket.connected) socket.connect();
}
socket.on("connect_error", (err) => {
    if (err?.message?.toLowerCase().includes("unauthorized")) {
        console.log("[socket] blocked (unauthorized) – login required");
    }
});
socket.on("reconnect_attempt", () => refreshSocketAuth());

export default socket;
