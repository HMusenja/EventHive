import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllEvents } from "@/api/eventsApi";

export default function ChatHub() {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                const data = await getAllEvents();
                setEvents(data || []);
            } catch (e) {
                console.error("[ChatHub] failed to load events", e);
            }
        })();
    }, []);

    return (
        <div className="mx-auto max-w-3xl py-10 px-4">
            <h1 className="text-3xl font-bold mb-6">Chat Hub</h1>

            <div className="mb-8">
                <Link
                    to="/chat/global"
                    className="inline-flex items-center rounded-lg border px-4 py-2 hover:bg-muted"
                >
                    🌐 Join Global Chat
                </Link>
            </div>

            <h2 className="text-xl font-semibold mb-3">Event Chats</h2>
            <ul className="space-y-2">
                {events.map((ev) => (
                    <li key={ev._id}>
                        <Link
                            to={`/events/${ev._id}/chat`}
                            state={{ coverImage: ev.coverImage, title: ev.title, subtitle: ev.subtitle }}
                            className="block rounded-lg border px-4 py-2 hover:bg-muted"
                        >
                            {ev.title}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
