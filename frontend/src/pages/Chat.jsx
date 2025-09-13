import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import socket, { connectSocket } from "@/lib/socket";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { Send, Smile, Paperclip, Loader2, MessageSquareText } from "lucide-react";

/* ------------ helpers ------------ */
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

const isSameDay = (a, b) => {
    const da = new Date(a), db = new Date(b);
    return (
        da.getFullYear() === db.getFullYear() &&
        da.getMonth() === db.getMonth() &&
        da.getDate() === db.getDate()
    );
};

/* Tiny emoji palette */
const COMMON_EMOJIS =
    "😀 😁 😂 🤣 😊 🙂 🙃 😉 😍 😘 🤗 🤩 🤔 😏 😴 😮 😱 😅 😆 😇 🤤 😋 😎 🥳 🤠 😤 😡 😭 😢 🤯 🤬 🙏 🤝 👍 👎 👏 ✨ 🎉 💯 🔥 💡 🧠 🫶 ❤️ 🩷 🧡 💛 💚 💙 💜 🤍 🤎 🖤 ☕ 🍀 🌟 🌈 🌊 🌞 🌙 💫 📎 📌 📨".split(
        " "
    );

/* ------------ main component ------------ */
export default function ChatPage() {
    const { eventId: idParam, slug } = useParams();
    const eventKey = idParam ?? slug;

    const location = useLocation();
    const coverFromNav = location.state?.coverImage || null;   // ← from EventHero
    const titleFromNav = location.state?.title || "";
    const subtitleFromNav = location.state?.subtitle || "";

    const { user } = useAuth();
    const myLabel = useMemo(
        () => user?.fullName || user?.username || "Anon",
        [user?.fullName, user?.username]
    );

    const [event, setEvent] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [showEmoji, setShowEmoji] = useState(false);

    // avoid duplicates
    const msgIndex = useRef(new Map());
    const pendingByText = useRef(new Map());

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

    // Load event
    useEffect(() => {
        if (!eventKey) return;
        let alive = true;
        (async () => {
            try {
                const { data } = await api.get(`events/${eventKey}`);
                if (!alive) return;
                setEvent(data);
            } catch (e) {
                console.error("[chat] Failed to load event", e);
            }
        })();
        return () => {
            alive = false;
        };
    }, [eventKey]);

    // Load history
    useEffect(() => {
        if (!eventKey) return;
        let alive = true;
        setLoadingHistory(true);
        (async () => {
            try {
                const { data } = await api.get(`events/${eventKey}/messages`);
                if (!alive) return;
                msgIndex.current = new Map();
                setMessages([]);
                data.forEach(upsert);
            } catch (e) {
                console.error("[chat] Failed to load messages", e);
            } finally {
                if (alive) setLoadingHistory(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [eventKey]);

    // Socket join + listeners
    useEffect(() => {
        if (!user || !event?._id) return;

        connectSocket();

        const roomId = String(event._id);
        const onMsg = (msg) => {
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
        socket.emit("join_room", roomId);
        socket.on("event_message", onMsg);

        return () => {
            socket.off("event_message", onMsg);
            socket.off("connect_error", onErr);
            socket.emit("leave_room", roomId);
        };
    }, [event?._id, myLabel, user?._id]);

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

    // unified hero image (first available key)
    const heroImage = useMemo(() => {
        return (
            coverFromNav ||
            event?.coverImage ||
            event?.cover?.url ||
            event?.bannerUrl ||
            event?.images?.banner ||
            event?.heroImage ||
            null
        );
    }, [coverFromNav, event]);

    // group rows by day
    const rows = [];
    let last = null;
    for (const m of messages) {
        if (!last || !isSameDay(last.createdAt, m.createdAt)) {
            rows.push({
                _kind: "day",
                key: `day-${new Date(m.createdAt).toDateString()}`,
                label: new Date(m.createdAt).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                }),
            });
        }
        rows.push({ _kind: "msg", ...m });
        last = m;
    }

    const sendMessage = (e) => {
        e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed || !event?._id) return;

        const tmpId = `tmp-${Date.now()}`;
        const tmp = {
            _id: tmpId,
            text: trimmed,
            sender: myLabel,
            createdAt: new Date().toISOString(),
        };
        if (!msgIndex.current.has(tmpId)) {
            msgIndex.current.set(tmpId, true);
            setMessages((prev) => [...prev, tmp]);
        }
        setText("");
        pendingByText.current.set(trimmed, { tmpId, ts: Date.now() });

        socket.emit(
            "event_message",
            { eventId: String(event._id), text: trimmed },
            (saved) => {
                if (saved && saved._id) {
                    pendingByText.current.delete(trimmed);
                    replaceTmpWithSaved(tmpId, saved);
                }
            }
        );
    };

    const title = event?.title ?? "Event Chat";
    const subTitle = event?.subtitle || event?.slug || "";

    useEffect(() => {
        console.log("chat route coverFromNav:", coverFromNav);
        console.log("event cover candidates:", {
            coverImage: event?.coverImage,
            coverUrl: event?.cover?.url,
            bannerUrl: event?.bannerUrl,
            imagesBanner: event?.images?.banner,
            heroImage: event?.heroImage,
        });
    }, [event, coverFromNav]);

    return (
        <div className="relative min-h-screen">
            {/* single background from the event */}
            {/* Background layer (image optional) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {heroImage && (
                    <img
                        src={heroImage}
                        alt={event?.title || "Event cover"}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                    />
                )}
                {/* black bottom → white top */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-white" />
            </div>

            <div className="mx-auto max-w-3xl py-8 px-3 md:px-0">
                {/* Header */}
                <div className="mb-4 flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-md">
                        <MessageSquareText className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                            {title}
                        </h1>
                        {!!subTitle && (
                            <p className="text-sm text-muted-foreground">{subTitle}</p>
                        )}
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

                        {!loadingHistory && rows.length === 0 && (
                            <div className="text-center text-muted-foreground py-10">
                                Be the first to say hello ✨
                            </div>
                        )}

                        {rows.map((row) =>
                            row._kind === "day" ? (
                                <div key={row.key} className="sticky top-2 z-10">
                                    <div className="mx-auto w-max rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground shadow-sm">
                                        {row.label}
                                    </div>
                                </div>
                            ) : (
                                <MessageBubble
                                    key={row._id}
                                    msg={row}
                                    isMe={labelFor(row.sender) === myLabel}
                                />
                            )
                        )}
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
                                disabled={!text.trim() || !event?._id}
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

/* --- Bubble component --- */
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
