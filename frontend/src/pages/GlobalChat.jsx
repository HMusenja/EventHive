// src/pages/GlobalChat.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import socket, { connectSocket } from "@/lib/socket";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { Send, Smile, Paperclip, Loader2, MessageSquareText } from "lucide-react";

/* ------------ helpers (same as your Chat) ------------ */
const labelFor = (sender) => {
    if (!sender) return "Anon";
    if (typeof sender === "string") return sender;
    return sender.fullName || sender.username || "Anon";
};
const initials = (name) =>
    String(name || "??")
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
const formatTime = (d) => {
    try {
        const dd = new Date(d);
        return dd.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
        return "";
    }
};
/* Tiny emoji palette */
const COMMON_EMOJIS =
    "😀 😁 😂 🤣 😊 🙂 🙃 😉 😍 😘 🤗 🤩 🤔 😏 😴 😮 😱 😅 😆 😇 🤤 😋 😎 🥳 🤠 😤 😡 😭 😢 🤯 🤬 🙏 🤝 👍 👎 👏 ✨ 🎉 💯 🔥 💡 🧠 🫶 ❤️ 🩷 🧡 💛 💚 💙 💜 🤍 🤎 🖤 ☕ 🍀 🌟 🌈 🌊 🌞 🌙 💫 📎 📌 📨".split(
        " "
    );

/* ------------ main component ------------ */
export default function GlobalChat() {
    const { user } = useAuth();
    const myLabel = useMemo(
        () => user?.fullName || user?.username || "Anon",
        [user?.fullName, user?.username]
    );

    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [showEmoji, setShowEmoji] = useState(false);

    // de-dupe + optimistic controls
    const msgIndex = useRef(new Map());          // _id -> true
    const pendingByText = useRef(new Map());     // text -> { tmpId, ts }
    const upsert = (m) => {
        if (!m?._id) m._id = `tmp-${Date.now()}-${Math.random()}`;
        if (msgIndex.current.has(m._id)) return;
        msgIndex.current.set(m._id, true);
        setMessages((prev) => [...prev, m]);
    };
    const replaceTmpWithSaved = (tmpId, saved) => {
        msgIndex.current.set(saved._id, true);
        setMessages((prev) => {
            const next = prev.slice();
            const idx = next.findIndex((x) => x._id === tmpId);
            if (idx !== -1) next.splice(idx, 1, saved);
            else next.push(saved);
            return next;
        });
    };

    // Load history for GLOBAL
    useEffect(() => {
        let alive = true;
        setLoadingHistory(true);
        (async () => {
            try {
                const { data } = await api.get("chat/global/messages");
                if (!alive) return;
                msgIndex.current = new Map();
                setMessages([]);
                data.forEach(upsert);
            } catch (e) {
                console.error("[global-chat] Failed to load messages", e);
            } finally {
                if (alive) setLoadingHistory(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    // Socket join + listeners for GLOBAL
    useEffect(() => {
        if (!user) return;

        connectSocket();

        const ROOM = "global";
        const onMsg = (msg) => {
            // Reconcile my optimistic msg with server broadcast/ack
            const senderLabel = labelFor(msg.sender);
            if (senderLabel === myLabel && pendingByText.current.has(msg.text)) {
                const { tmpId, ts } = pendingByText.current.get(msg.text) || {};
                if (ts && Date.now() - ts <= 10_000 && tmpId) {
                    pendingByText.current.delete(msg.text);
                    replaceTmpWithSaved(tmpId, msg);
                    return;
                }
                pendingByText.current.delete(msg.text);
            }
            upsert(msg);
        };
        const onErr = (err) =>
            console.error("[socket] connect_error:", err?.message || err);

        socket.on("connect_error", onErr);
        socket.emit("join_room", ROOM);
        socket.on("chat_message", onMsg);

        return () => {
            socket.off("chat_message", onMsg);
            socket.off("connect_error", onErr);
            socket.emit("leave_room", ROOM);
        };
    }, [myLabel, user?._id]);

    // auto-scroll
    const scrollerRef = useRef(null);
    useEffect(() => {
        const el = scrollerRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, [messages.length]);

    // emoji picker
    const composerRef = useRef(null);
    const textareaRef = useRef(null);
    useEffect(() => {
        const onDocClick = (e) => {
            if (!composerRef.current) return;
            if (!composerRef.current.contains(e.target)) setShowEmoji(false);
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);
    const insertEmoji = (emoji) => {
        const el = textareaRef.current;
        if (!el) {
            setText((t) => t + emoji);
            return;
        }
        const start = el.selectionStart ?? text.length;
        const end = el.selectionEnd ?? text.length;
        const next = text.slice(0, start) + emoji + text.slice(end);
        setText(next);
        setTimeout(() => {
            el.focus();
            const pos = start + emoji.length;
            el.setSelectionRange(pos, pos);
        }, 0);
    };

    // Send (GLOBAL)
    const sendMessage = (e) => {
        e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed) return;

        const tmpId = `tmp-${Date.now()}`;
        const tmp = {
            _id: tmpId,
            text: trimmed,
            sender: myLabel,               // string works with your labelFor()
            createdAt: new Date().toISOString(),
            room: "global",
        };

        if (!msgIndex.current.has(tmpId)) {
            msgIndex.current.set(tmpId, true);
            setMessages((prev) => [...prev, tmp]);
        }
        setText("");
        pendingByText.current.set(trimmed, { tmpId, ts: Date.now() });

        socket.emit(
            "chat_message",
            { room: "global", text: trimmed },
            (saved) => {
                // ack from server (if provided)
                if (saved && saved._id) {
                    pendingByText.current.delete(trimmed);
                    replaceTmpWithSaved(tmpId, saved);
                }
            }
        );
    };

    return (
        <div className="relative min-h-screen">
            {/* black → white backdrop (simple + readable) */}
            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/10 to-white" />

            <div className="mx-auto max-w-3xl py-8 px-3 md:px-0">
                {/* Header */}
                <div className="mb-4 flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-md">
                        <MessageSquareText className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                            🌍 Global Chat
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Say hi to everyone across events
                        </p>
                    </div>
                </div>

                {/* Chat Card */}
                <div className="rounded-2xl border border-border/60 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50 shadow-sm">
                    {/* History */}
                    <div
                        ref={scrollerRef}
                        className="h-[60vh] w-full overflow-y-auto rounded-2xl p-4 md:p-6 space-y-3 bg-gradient-to-b from-muted/60 to-transparent"
                    >
                        {loadingHistory && (
                            <div className="flex items-center justify-center py-10 text-muted-foreground">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading messages…
                            </div>
                        )}

                        {!loadingHistory && messages.length === 0 && (
                            <div className="text-center text-muted-foreground py-10">
                                Be the first to say hello ✨
                            </div>
                        )}

                        {messages.map((m) => (
                            <MessageBubble
                                key={m._id}
                                msg={m}
                                isMe={labelFor(m.sender) === myLabel}
                            />
                        ))}
                    </div>

                    {/* Composer */}
                    <form
                        ref={composerRef}
                        onSubmit={sendMessage}
                        className="relative border-t border-border/60 p-3 md:p-4"
                    >
                        <div className="flex items-end gap-2">
                            <button
                                type="button"
                                className="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-background hover:bg-muted transition"
                                title="Attach"
                                onClick={(e) => e.preventDefault()}
                            >
                                <Paperclip className="h-5 w-5" />
                            </button>

                            <textarea
                                ref={textareaRef}
                                rows={1}
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                onInput={(e) => {
                                    e.currentTarget.style.height = "auto";
                                    e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                                }}
                                placeholder="Type your message…"
                                className="min-h-10 max-h-28 flex-1 resize-none rounded-xl border bg-background px-3 py-2 leading-6 outline-none ring-0 focus:border-primary/40"
                            />

                            <button
                                type="button"
                                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-background transition ${showEmoji ? "bg-muted" : "hover:bg-muted"
                                    }`}
                                title="Emoji"
                                onClick={() => setShowEmoji((v) => !v)}
                            >
                                <Smile className="h-5 w-5" />
                            </button>

                            <button
                                type="submit"
                                disabled={!text.trim()}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-primary-foreground shadow hover:brightness-110 disabled:opacity-50"
                            >
                                <Send className="h-4 w-4" />
                                <span className="font-medium">Send</span>
                            </button>
                        </div>

                        {/* Emoji popover */}
                        {showEmoji && (
                            <div className="absolute bottom-16 right-3 z-20 w-[320px] rounded-2xl border bg-background p-2 shadow-xl">
                                <input
                                    type="text"
                                    placeholder="Search emojis…"
                                    className="mb-2 w-full rounded-lg border bg-background px-2 py-1 text-sm"
                                    onChange={(e) => {
                                        const q = e.target.value.trim().toLowerCase();
                                        const root = e.currentTarget.nextSibling;
                                        for (const btn of root.querySelectorAll("button[data-emoji]")) {
                                            const em = btn.getAttribute("data-emoji-label") || "";
                                            btn.style.display = em.includes(q) ? "" : "none";
                                        }
                                    }}
                                />
                                <div className="max-h-60 overflow-y-auto pr-1">
                                    <div className="grid grid-cols-8 gap-1">
                                        {COMMON_EMOJIS.map((em, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                data-emoji
                                                data-emoji-label={em}
                                                className="h-8 w-8 select-none rounded-lg hover:bg-muted"
                                                onClick={() => {
                                                    insertEmoji(em);
                                                    textareaRef.current?.focus();
                                                }}
                                                title={em}
                                            >
                                                {em}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-2 flex justify-end">
                                    <button
                                        type="button"
                                        className="text-sm text-muted-foreground hover:text-foreground"
                                        onClick={() => setShowEmoji(false)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}

/* --- Bubble (same style as event chat) --- */
function MessageBubble({ msg, isMe }) {
    const who = labelFor(msg.sender);
    const when = formatTime(msg.createdAt);

    if (isMe) {
        return (
            <div className="flex w-full justify-end">
                <div className="max-w-[80%]">
                    <div className="mb-1 text-right text-[11px] text-muted-foreground">
                        You • {when}
                    </div>
                    <div className="rounded-2xl rounded-br-sm bg-gradient-to-br from-indigo-600 to-fuchsia-600 px-4 py-2 text-white shadow-md">
                        {msg.text}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full items-start gap-2">
            <div className="mt-5 flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-muted font-semibold text-foreground/70">
                {initials(who)}
            </div>
            <div className="max-w-[80%]">
                <div className="mb-1 text-[11px] text-muted-foreground">
                    {who} • {when}
                </div>
                <div className="rounded-2xl rounded-tl-sm border border-border/60 bg-background px-4 py-2 shadow-sm">
                    {msg.text}
                </div>
            </div>
        </div>
    );
}
