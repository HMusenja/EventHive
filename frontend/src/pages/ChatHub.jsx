// ChatHub.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import socket, { connectSocket } from "@/lib/socket";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { MessageSquareText, Loader2, Send, Smile } from "lucide-react";

const labelFor = (s) => (typeof s === "string" ? s : s?.fullName || s?.username || "Anon");

export default function ChatHub({ events = [] }) {
    const { user } = useAuth();
    const myLabel = useMemo(() => user?.fullName || user?.username || "Anon", [user]);

    // Build room list: global + events
    const rooms = useMemo(() => ([
        { id: "global", title: "Everyone", cover: null },
        ...events.map(ev => ({
            id: String(ev._id),
            title: ev.title,
            cover: ev.coverImage || ev.cover?.url || ev.bannerUrl || ev.images?.banner || null,
        }))
    ]), [events]);

    const [activeRoom, setActiveRoom] = useState("global");
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(true);
    const scrollerRef = useRef(null);
    const msgIndex = useRef(new Map());
    const pendingByText = useRef(new Map());

    // load history based on room
    useEffect(() => {
        let alive = true;
        if (!activeRoom) return;
        (async () => {
            setLoading(true);
            try {
                let data;
                if (activeRoom === "global") {
                    ({ data } = await api.get("chat/global/messages"));
                } else {
                    ({ data } = await api.get(`events/${activeRoom}/messages`));
                }
                if (!alive) return;
                msgIndex.current = new Map();
                setMessages([]);
                data.forEach(d => {
                    const id = d._id || `tmp-${Math.random()}`;
                    if (!msgIndex.current.has(id)) {
                        msgIndex.current.set(id, true);
                        setMessages(prev => [...prev, { ...d, _id: id }]);
                    }
                });
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [activeRoom]);

    // socket join/leave on room change
    useEffect(() => {
        if (!user || !activeRoom) return;

        connectSocket();

        const onMsg = (msg) => {
            if (msg.room !== activeRoom) return; // ignore other rooms
            const senderLabel = labelFor(msg.sender);
            if (senderLabel === myLabel && pendingByText.current.has(msg.text)) {
                const { tmpId, ts } = pendingByText.current.get(msg.text) || {};
                if (ts && Date.now() - ts <= 10000 && tmpId) {
                    pendingByText.current.delete(msg.text);
                    setMessages(prev => {
                        const next = [...prev];
                        const i = next.findIndex(x => x._id === tmpId);
                        if (i !== -1) next[i] = msg;
                        else next.push(msg);
                        msgIndex.current.set(msg._id, true);
                        return next;
                    });
                    return;
                }
                pendingByText.current.delete(msg.text);
            }
            if (!msgIndex.current.has(msg._id)) {
                msgIndex.current.set(msg._id, true);
                setMessages(prev => [...prev, msg]);
            }
        };

        socket.emit("join_room", activeRoom);
        socket.on("chat_message", onMsg);

        return () => {
            socket.off("chat_message", onMsg);
            socket.emit("leave_room", activeRoom);
        };
    }, [activeRoom, myLabel, user?._id]);

    // auto-scroll
    useEffect(() => {
        const el = scrollerRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [messages.length]);

    const sendMessage = (e) => {
        e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed) return;

        const tmpId = `tmp-${Date.now()}`;
        setMessages(prev => [...prev, {
            _id: tmpId, text: trimmed, sender: myLabel, createdAt: new Date().toISOString(), room: activeRoom
        }]);
        msgIndex.current.set(tmpId, true);
        setText("");
        pendingByText.current.set(trimmed, { tmpId, ts: Date.now() });

        socket.emit("chat_message", { room: activeRoom, text: trimmed }, (saved) => {
            if (saved?._id) {
                pendingByText.current.delete(trimmed);
                setMessages(prev => {
                    const next = [...prev];
                    const i = next.findIndex(m => m._id === tmpId);
                    if (i !== -1) next[i] = saved; else next.push(saved);
                    msgIndex.current.set(saved._id, true);
                    return next;
                });
            }
        });
    };

    const activeMeta = rooms.find(r => r.id === activeRoom);

    return (
        <div className="grid grid-cols-12 gap-4 min-h-[80vh]">
            {/* Sidebar */}
            <aside className="col-span-12 md:col-span-3 rounded-2xl border bg-background/70 backdrop-blur overflow-hidden">
                <div className="p-3 text-sm font-medium">Chats</div>
                <div className="space-y-1 px-2 pb-3">
                    {rooms.map((r) => (
                        <button
                            key={r.id}
                            onClick={() => setActiveRoom(r.id)}
                            className={`w-full text-left rounded-xl px-3 py-2 hover:bg-muted transition ${activeRoom === r.id ? "bg-muted" : ""
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-muted overflow-hidden">
                                    {r.cover ? (
                                        <img src={r.cover} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">
                                            <MessageSquareText className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>
                                <span className="truncate">{r.title}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Chat area */}
            <main className="col-span-12 md:col-span-9">
                {/* Header */}
                <div className="mb-3 flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow">
                        <MessageSquareText className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold">{activeMeta?.title ?? "Chat"}</h1>
                        <p className="text-xs text-muted-foreground">
                            {activeRoom === "global" ? "Everyone" : "Event room"}
                        </p>
                    </div>
                </div>

                <div className="rounded-2xl border bg-background/70 backdrop-blur overflow-hidden">
                    <div ref={scrollerRef} className="h-[60vh] overflow-y-auto p-4 space-y-2">
                        {loading ? (
                            <div className="flex items-center justify-center text-muted-foreground py-10">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
                            </div>
                        ) : (
                            messages.map((m) => (
                                <div key={m._id} className="flex gap-2">
                                    <div className="text-xs text-muted-foreground mt-1 min-w-[70px]">
                                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs text-muted-foreground">
                                            {labelFor(m.sender)}
                                        </div>
                                        <div className={`inline-block rounded-xl px-3 py-2 ${labelFor(m.sender) === myLabel ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                                            {m.text}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <form onSubmit={sendMessage} className="border-t p-3 flex gap-2">
                        <textarea
                            rows={1}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onInput={(e) => {
                                e.currentTarget.style.height = "auto";
                                e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                            }}
                            placeholder={`Message ${activeRoom === "global" ? "Everyone" : "this event"}…`}
                            className="min-h-10 max-h-28 flex-1 resize-none rounded-xl border bg-background px-3 py-2 leading-6 outline-none focus:border-primary/40"
                        />
                        <button
                            type="submit"
                            disabled={!text.trim()}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 text-primary-foreground shadow hover:brightness-110 disabled:opacity-50"
                        >
                            <Send className="h-4 w-4" />
                            Send
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
