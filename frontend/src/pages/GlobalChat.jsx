import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import socket, { connectSocket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";
import { Loader2, MessageSquareText, Globe, Search } from "lucide-react";


/** --------- helpers --------- */
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


/** Tiny emoji palette (same as event chat) */
const COMMON_EMOJIS =
   "😀 😁 😂 🤣 😊 🙂 🙃 😉 😍 😘 🤗 🤩 🤔 😏 😴 😮 😱 😅 😆 😇 🤤 😋 😎 🥳 🤠 😤 😡 😭 😢 🤯 🤬 🙏 🤝 👍 👎 👏 ✨ 🎉 💯 🔥 💡 🧠 🫶 ❤️ 🩷 🧡 💛 💚 💙 💜 🤍 🤎 🖤 ☕ 🍀 🌟 🌈 🌊 🌞 🌙 💫 📎 📌 📨".split(
       " "
   );


/** --------- main --------- */
export default function GlobalChat() {
   // Support /chat/global and /chat/event/:eventId (optional)
   const { eventId } = useParams();
   const navigate = useNavigate();
   const { user } = useAuth();


   // selected room state
   const [activeRoom, setActiveRoom] = useState(
       eventId ? { kind: "event", id: String(eventId) } : { kind: "global", id: "global" }
   );


   // events list for the sidebar
   const [events, setEvents] = useState([]);
   const [eventsLoading, setEventsLoading] = useState(true);
   const [eventsQuery, setEventsQuery] = useState("");


   // chat state
   const [messages, setMessages] = useState([]);
   const [loadingHistory, setLoadingHistory] = useState(true);
   const [text, setText] = useState("");
   const [showEmoji, setShowEmoji] = useState(false);


   const myLabel = useMemo(
       () => user?.fullName || user?.username || "Anon",
       [user?.fullName, user?.username]
   );


   // dedupe helpers
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


   /** ----- fetch events for the sidebar ----- */
   useEffect(() => {
       let alive = true;
       (async () => {
           try {
               setEventsLoading(true);
               // Adjust params to match your events listing controller
               const { data } = await api.get("events", {
                   params: { limit: 25, sort: "startAt:asc" },
               });
               if (!alive) return;
               setEvents(Array.isArray(data) ? data : data?.events || []);
           } catch (e) {
               console.error("[global-chat] Failed to load events", e);
               if (alive) setEvents([]);
           } finally {
               if (alive) setEventsLoading(false);
           }
       })();
       return () => { alive = false; };
   }, []);


   /** ----- figure out bg cover from selected room ----- */
   const activeEvent = useMemo(() => {
       if (activeRoom.kind !== "event") return null;
       return events.find((e) => String(e._id) === String(activeRoom.id)) || null;
   }, [activeRoom, events]);


   const heroImage = useMemo(() => {
       const e = activeEvent;
       if (!e) return null;
       return (
           e.coverImage ||
           e.cover?.url ||
           e.bannerUrl ||
           e.images?.banner ||
           e.heroImage ||
           null
       );
   }, [activeEvent]);


   /** ----- load history for current room ----- */
   const roomKey = activeRoom.kind === "global" ? "global" : String(activeRoom.id);


   useEffect(() => {
       let alive = true;
       setLoadingHistory(true);
       msgIndex.current = new Map();
       setMessages([]);


       (async () => {
           try {
               if (activeRoom.kind === "global") {
                   const { data } = await api.get("chat/global/messages");
                   if (!alive) return;
                   (data || []).forEach(upsert);
               } else {
                   const { data } = await api.get(`events/${activeRoom.id}/messages`);
                   if (!alive) return;
                   (data || []).forEach(upsert);
               }
           } catch (e) {
               console.error("[global-chat] load history failed", e);
           } finally {
               if (alive) setLoadingHistory(false);
           }
       })();


       return () => { alive = false; };
   }, [roomKey, activeRoom.kind, activeRoom.id]);


   /** ----- socket join/leave + listeners (unified 'chat_message') ----- */
   useEffect(() => {
       if (!user) return;


       connectSocket();


       const rk = roomKey; // capture
       socket.emit("join_room", rk);


       const onMsg = (payload) => {
           // payload: { _id, text, sender, createdAt, room }
           if (!payload || payload.room !== rk) {
               // (optional) could increment unread for other rooms here
               return;
           }
           const senderLabel = labelFor(payload.sender);
           if (senderLabel === myLabel && pendingByText.current.has(payload.text)) {
               const { tmpId, ts } = pendingByText.current.get(payload.text) || {};
               if (ts && Date.now() - ts <= 10_000 && tmpId) {
                   pendingByText.current.delete(payload.text);
                   replaceTmpWithSaved(tmpId, payload);
                   return;
               }
               pendingByText.current.delete(payload.text);
           }
           upsert(payload);
       };


       socket.on("chat_message", onMsg);


       return () => {
           socket.off("chat_message", onMsg);
           socket.emit("leave_room", rk);
       };
       // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [roomKey, user?._id, myLabel]);


   /** ----- auto-scroll ----- */
   const scrollerRef = useRef(null);
   useEffect(() => {
       const el = scrollerRef.current;
       if (!el) return;
       el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
   }, [messages.length]);


   /** ----- emoji / textarea helpers ----- */
   const textareaRef = useRef(null);
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


   /** ----- group rows by day (same pattern) ----- */
   const rows = useMemo(() => {
       const out = [];
       let last = null;
       for (const m of messages) {
           if (!last || !isSameDay(last.createdAt, m.createdAt)) {
               out.push({
                   _kind: "day",
                   key: `day-${new Date(m.createdAt).toDateString()}`,
                   label: new Date(m.createdAt).toLocaleDateString(undefined, {
                       weekday: "short",
                       month: "short",
                       day: "numeric",
                   }),
               });
           }
           out.push({ _kind: "msg", ...m });
           last = m;
       }
       return out;
   }, [messages]);


   /** ----- send ----- */
   const sendMessage = (e) => {
       e.preventDefault();
       const trimmed = text.trim();
       if (!trimmed) return;


       const tmpId = `tmp-${Date.now()}`;
       const tmp = {
           _id: tmpId,
           text: trimmed,
           sender: myLabel,
           createdAt: new Date().toISOString(),
           room: roomKey,
       };
       if (!msgIndex.current.has(tmpId)) {
           msgIndex.current.set(tmpId, true);
           setMessages((prev) => [...prev, tmp]);
       }
       setText("");
       pendingByText.current.set(trimmed, { tmpId, ts: Date.now() });


       socket.emit("chat_message", { room: roomKey, text: trimmed }, (saved) => {
           if (saved && saved._id) {
               pendingByText.current.delete(trimmed);
               replaceTmpWithSaved(tmpId, saved);
           }
       });
   };


   /** ----- sidebar filter ----- */
   const filteredEvents = useMemo(() => {
       const q = eventsQuery.trim().toLowerCase();
       if (!q) return events;
       return events.filter((e) =>
           [e.title, e.subtitle, e.slug]
               .filter(Boolean)
               .some((t) => String(t).toLowerCase().includes(q))
       );
   }, [events, eventsQuery]);


   /** ----- header texts ----- */
   const headerTitle =
       activeRoom.kind === "global"
           ? "Global Chat"
           : activeEvent?.title || "Event Chat";


   const headerSubtitle =
       activeRoom.kind === "global"
           ? "Everyone in one place ✨"
           : activeEvent?.subtitle || activeEvent?.slug || "";


   return (
       <div className="relative min-h-screen">
           {/* background: selected room cover or gradient */}
           {heroImage ? (
               <div className="pointer-events-none absolute inset-0 -z-10">
                   <img
                       src={heroImage}
                       alt={activeEvent?.title || "Event cover"}
                       className="h-full w-full object-cover"
                       loading="lazy"
                       decoding="async"
                   />
                   {/* readable overlay */}
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-white" />
               </div>
           ) : (
               <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/10 to-white" />
           )}


           <div className="mx-auto max-w-7xl px-3 md:px-6 py-6 grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)] gap-4">
               {/* Sidebar */}
               <aside className="rounded-2xl border bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50 p-3 md:p-4 space-y-4">
                   <div className="flex items-center gap-2">
                       <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow">
                           <MessageSquareText className="h-4 w-4" />
                       </div>
                       <div>
                           <div className="font-semibold leading-tight">Chats</div>
                           <div className="text-xs text-muted-foreground">Global & events</div>
                       </div>
                   </div>


                   <button
                       className={`w-full text-left rounded-xl px-3 py-2 border transition flex items-center gap-2
             ${activeRoom.kind === "global" ? "bg-muted border-border" : "hover:bg-muted"}
           `}
                       onClick={() => {
                           setActiveRoom({ kind: "global", id: "global" });
                           navigate("/chat/global", { replace: false });
                       }}
                   >
                       <Globe className="h-4 w-4" />
                       <span className="font-medium">Global chat</span>
                   </button>


                   <div className="relative">
                       <input
                           className="w-full rounded-xl border bg-background pl-8 pr-3 py-2 text-sm"
                           placeholder="Search events…"
                           value={eventsQuery}
                           onChange={(e) => setEventsQuery(e.target.value)}
                       />
                       <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                   </div>


                   <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                       {eventsLoading && (
                           <div className="flex items-center justify-center py-6 text-muted-foreground">
                               <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                               Loading events…
                           </div>
                       )}
                       {!eventsLoading && filteredEvents.length === 0 && (
                           <div className="text-xs text-muted-foreground">No events found.</div>
                       )}
                       {filteredEvents.map((e) => {
                           const active = activeRoom.kind === "event" && String(activeRoom.id) === String(e._id);
                           const thumb =
                               e.coverImage || e.cover?.url || e.bannerUrl || e.images?.banner || e.heroImage;
                           return (
                               <button
                                   key={e._id}
                                   className={`w-full text-left rounded-xl px-2.5 py-2 border transition flex items-center gap-3
                   ${active ? "bg-muted border-border" : "hover:bg-muted"}
                 `}
                                   onClick={() => {
                                       setActiveRoom({ kind: "event", id: String(e._id) });
                                       navigate(`/chat/event/${e._id}`, { replace: false });
                                   }}
                                   title={e.title}
                               >
                                   <div className="h-8 w-8 rounded-lg overflow-hidden bg-muted shrink-0">
                                       {thumb ? (
                                           <img src={thumb} className="h-full w-full object-cover" />
                                       ) : (
                                           <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">
                                               {initials(e.title)}
                                           </div>
                                       )}
                                   </div>
                                   <div className="min-w-0">
                                       <div className="truncate text-sm font-medium">{e.title}</div>
                                       {!!e.subtitle && (
                                           <div className="truncate text-[11px] text-muted-foreground">
                                               {e.subtitle}
                                           </div>
                                       )}
                                   </div>
                               </button>
                           );
                       })}
                   </div>
               </aside>


               {/* Chat panel */}
               <section className="rounded-2xl border bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50 shadow-sm">
                   {/* Header */}
                   <div className="flex items-center gap-3 border-b p-3 md:p-4">
                       <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-md">
                           <MessageSquareText className="h-5 w-5" />
                       </div>
                       <div>
                           <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                               {headerTitle}
                           </h1>
                           {!!headerSubtitle && (
                               <p className="text-xs text-muted-foreground">{headerSubtitle}</p>
                           )}
                       </div>
                   </div>


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
                       onSubmit={sendMessage}
                       className="relative border-t p-3 md:p-4"
                   >
                       <div className="flex items-end gap-2">
                           <textarea
                               ref={textareaRef}
                               rows={1}
                               value={text}
                               onChange={(e) => setText(e.target.value)}
                               onInput={(e) => {
                                   e.currentTarget.style.height = "auto";
                                   e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                               }}
                               placeholder={`Message ${activeRoom.kind === "global" ? "Global chat" : "this event"}…`}
                               className="min-h-10 max-h-28 flex-1 resize-none rounded-xl border bg-background px-3 py-2 leading-6 outline-none ring-0 focus:border-primary/40"
                           />


                           <button
                               type="button"
                               className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-background transition ${showEmoji ? "bg-muted" : "hover:bg-muted"}`}
                               title="Emoji"
                               onClick={() => setShowEmoji((v) => !v)}
                           >
                               🙂
                           </button>


                           <button
                               type="submit"
                               disabled={!text.trim()}
                               className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-primary-foreground shadow hover:brightness-110 disabled:opacity-50"
                           >
                               Send
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
               </section>
           </div>
       </div>
   );
}


/** --------- bubble --------- */
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



