import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MessageSquareText } from "lucide-react";
import socket, { connectSocket } from "@/lib/socket";

export default function GlobalChatButton() {
    const { pathname } = useLocation();
    const [unread, setUnread] = useState(0);

    // Join the "global" room once, and count incoming messages
    useEffect(() => {
        connectSocket();
        socket.emit("join_room", "global");

        const onMsg = (msg) => {
            // Don’t count if user is looking at the global chat page
            if (pathname.startsWith("/chat/global")) return;
            setUnread((u) => Math.min(u + 1, 99));
        };

        socket.on("chat_message", onMsg);
        return () => socket.off("chat_message", onMsg);
    }, []); // mount once

    // Visiting the global chat clears the badge
    useEffect(() => {
        if (pathname.startsWith("/chat/global")) setUnread(0);
    }, [pathname]);

    // Hide the button on any chat page (optional)
    if (pathname.startsWith("/chat")) return null;

    return (
        <Link
            to="/chat/global"
            className={`
                relative inline-flex items-center gap-2 rounded-xl border px-3 py-2
                hover:bg-muted transition
                ${unread > 0 ? "animate-bounce" : ""}
            `}
            title="Global chat"
        >
            <MessageSquareText className="h-5 w-5" />
            <span className="hidden sm:inline">Global chat</span>

            {unread > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] text-primary-foreground">
                    {unread > 9 ? "9+" : unread}
                </span>
            )}
        </Link>
    );
}
