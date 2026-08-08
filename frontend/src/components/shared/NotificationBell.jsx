import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, CheckCheck, CalendarClock, Dumbbell, Info } from "lucide-react";
import {
    getMyNotifications,
    getUnreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead
} from "../../services/api";
import "./NotificationBell.css";

const TYPE_ICON = {
    booking_alert: CalendarClock,
    session_reminder: CalendarClock,
    exercise_reminder: Dumbbell,
    admin_action: Info,
    general: Info
};

// Poll for the unread count periodically so the badge stays fresh even
// if the user leaves the dropdown closed for a while.
const POLL_INTERVAL_MS = 30000;

const NotificationBell = () => {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef(null);

    const refreshUnreadCount = useCallback(async () => {
        try {
            const count = await getUnreadNotificationCount();
            setUnreadCount(count);
        } catch (err) {
            console.error("Failed to fetch unread count", err);
        }
    }, []);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getMyNotifications();
            setNotifications(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshUnreadCount();
        const interval = setInterval(refreshUnreadCount, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [refreshUnreadCount]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleOpen = () => {
        const next = !open;
        setOpen(next);
        if (next) fetchNotifications();
    };

    const handleItemClick = async (notif) => {
        if (!notif.is_read) {
            try {
                await markNotificationRead(notif.id);
                setNotifications((prev) =>
                    prev.map((n) => (n.id === notif.id ? { ...n, is_read: 1 } : n))
                );
                setUnreadCount((c) => Math.max(0, c - 1));
            } catch (err) {
                console.error("Failed to mark as read", err);
            }
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Failed to mark all as read", err);
        }
    };

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now - d;
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return "Just now";
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffH = Math.floor(diffMin / 60);
        if (diffH < 24) return `${diffH}h ago`;
        const diffD = Math.floor(diffH / 24);
        if (diffD < 7) return `${diffD}d ago`;
        return d.toLocaleDateString();
    };

    return (
        <div className="nbell-wrapper" ref={wrapperRef}>
            <button
                type="button"
                className="nbell-trigger"
                onClick={toggleOpen}
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="nbell-badge">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="nbell-dropdown">
                    <div className="nbell-header">
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                className="nbell-mark-all"
                                onClick={handleMarkAllRead}
                            >
                                <CheckCheck size={14} />
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="nbell-list">
                        {loading ? (
                            <p className="nbell-empty">Loading...</p>
                        ) : notifications.length === 0 ? (
                            <p className="nbell-empty">No notifications yet.</p>
                        ) : (
                            notifications.map((notif) => {
                                const Icon = TYPE_ICON[notif.type] || Info;
                                return (
                                    <button
                                        type="button"
                                        key={notif.id}
                                        className={`nbell-item ${notif.is_read ? "" : "nbell-item-unread"}`}
                                        onClick={() => handleItemClick(notif)}
                                    >
                                        <span className="nbell-item-icon">
                                            <Icon size={16} />
                                        </span>
                                        <span className="nbell-item-body">
                                            <span className="nbell-item-message">
                                                {notif.message}
                                            </span>
                                            <span className="nbell-item-time">
                                                {formatTime(notif.created_at)}
                                            </span>
                                        </span>
                                        {!notif.is_read && <span className="nbell-item-dot" />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;