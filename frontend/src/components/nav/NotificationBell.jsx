import { Link, useNavigate } from "react-router-dom";
import { Bell, Clock } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/context/NotificationContext";

function timeAgo(ts) {
    if (!ts) return "Just now";
    const d = new Date(ts);
    const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
    if (s < 60) return `${Math.floor(s)}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return d.toLocaleDateString();
}

const iconFor = (n) =>
    n.type === "message" ? "💬" :
        n.type === "checkin" ? "✅" :
            n.type === "meeting" ? "📅" : "🔔";

export default function NotificationBell({
    className = "relative inline-flex items-center justify-center h-9 w-9 rounded-xl border border-border hover:bg-muted transition",
    badgeClassName = "absolute -top-1 -right-1 text-[10px] leading-none rounded-full bg-destructive text-destructive-foreground px-1.5 py-1",
}) {
    const navigate = useNavigate();
    const {
        notifications,
        unreadCount,
        markNotificationRead,
        removeNotification,
        markAllAsRead,
    } = useNotifications();

    const resolveLink = (n) => {
        if (n?.meta?.link) return n.meta.link;
        if (n?.meta?.meetingId) return "/account/meetings";
        if (n?.meta?.eventId) return `/events/${n.meta.eventId}`;
        return "/account";
    };

    const openOne = async (n) => {
        try { await markNotificationRead(n._id); }
        finally { navigate(resolveLink(n)); }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className={className} aria-label="Notifications">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className={badgeClassName}>
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2">
                    <div className="font-semibold">Notifications</div>
                    <div className="text-xs text-muted-foreground">{unreadCount} unread</div>
                </div>

                {/* List */}
                <div className="max-h-80 overflow-auto">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground">No notifications yet</div>
                    ) : (
                        <ul className="px-2 pb-2 space-y-2">
                            {notifications.map((n) => (
                                <li
                                    key={n._id}
                                    className="rounded-lg border border-border bg-background p-3 hover:bg-muted/40 transition"
                                >
                                    <div
                                        className="flex items-start gap-3 cursor-pointer"
                                        onClick={() => openOne(n)}
                                    >
                                        <div className="text-xl leading-none pt-0.5">{iconFor(n)}</div>

                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-semibold">{n.title || "Notification"}</div>
                                            <div className="text-xs text-muted-foreground break-words">
                                                {n.message || ""}
                                            </div>

                                            {/* Actions */}
                                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                                                {n.meta?.meetingId && (
                                                    <Link
                                                        to="/account/meetings"
                                                        className="text-primary underline"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        Open meeting
                                                    </Link>
                                                )}
                                                {!n.readAt && n.meta?.meetingId && <span className="opacity-40">·</span>}
                                                {!n.readAt && (
                                                    <button
                                                        className="text-primary underline"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            markNotificationRead(n._id);
                                                        }}
                                                    >
                                                        Mark as read
                                                    </button>
                                                )}
                                            </div>

                                            {/* Meta */}
                                            <div className="mt-1 text-[10px] opacity-60 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {timeAgo(n.createdAt)}
                                            </div>
                                        </div>

                                        <button
                                            className="text-xs text-muted-foreground ml-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeNotification(n._id);
                                            }}
                                            aria-label="Remove notification"
                                            title="Remove"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <div className="flex items-center justify-end px-3 py-2">
                            <button
                                className="text-xs text-primary underline"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    markAllAsRead();
                                }}
                            >
                                Mark all as read
                            </button>
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
