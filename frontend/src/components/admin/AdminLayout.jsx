import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    BarChart2,
    FileCheck2,
    Users,
    Gavel,
    Settings,
    LogOut,
    HeartPulse,
    UserCircle2,
    ChevronUp,
    Clock,
    RotateCcw,
} from "lucide-react";
import {
    setSystemTimeOverride,
    clearSystemTimeOverride,
    getSystemTimeOverrideString,
    hasSystemTimeOverride,
} from "../../utils/systemTime";
import "./AdminLayout.css";

// Every admin page in the sidebar, in the order they should appear.
const NAV_ITEMS = [
    { key: "analytics",    label: "Platform Analytics",    icon: BarChart2,  path: "/admin/analytics" },
    { key: "verification", label: "Therapist Verification", icon: FileCheck2, path: "/admin/verification" },
    { key: "users",        label: "User Management",        icon: Users,      path: "/admin/users" },
    { key: "approvals",    label: "Group Approvals",        icon: Gavel,      path: "/admin/group-approvals" },
    { key: "settings",     label: "System Settings",        icon: Settings,   path: "/admin/settings" },
];

/**
 * Wraps every admin page with the same sidebar and top bar.
 *
 * Usage:
 *   <AdminLayout pageTitle="User Management" badgeText="Admin Control">
 *     ...page content...
 *   </AdminLayout>
 */
const AdminLayout = ({ pageTitle, badgeText, children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Dev Tools panel state
    const [devOpen, setDevOpen] = useState(false);
    const [devDate, setDevDate] = useState(() => {
        const s = getSystemTimeOverrideString();
        return s ? s.slice(0, 10) : "";
    });
    const [devTime, setDevTime] = useState(() => {
        const s = getSystemTimeOverrideString();
        return s ? s.slice(11, 16) : "00:00";
    });
    const [overrideActive, setOverrideActive] = useState(hasSystemTimeOverride);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const handleSetOverride = () => {
        if (!devDate) return;
        const iso = `${devDate}T${devTime || "00:00"}`;
        setSystemTimeOverride(iso);
        setOverrideActive(true);
    };

    const handleResetOverride = () => {
        clearSystemTimeOverride();
        setOverrideActive(false);
        setDevDate("");
        setDevTime("00:00");
    };

    return (
        <div className="admin-shell">
            <aside className="admin-sidebar">
                <div className="admin-brand">
                    <div className="admin-brand-mark" />
                    <span className="admin-brand-name">Smart Recovery Portal</span>
                </div>

                <nav className="admin-nav">
                    {NAV_ITEMS.map(({ key, label, icon: Icon, path }) => {
                        const isActive = path === location.pathname;
                        return (
                            <button
                                key={key}
                                type="button"
                                className={`admin-nav-item ${isActive ? "admin-nav-item-active" : ""}`}
                                disabled={!path}
                                onClick={() => path && navigate(path)}
                                title={path ? label : `${label} (coming soon)`}
                            >
                                <Icon size={18} />
                                <span>{label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* ── Dev Tools Panel ── */}
                <div className="dev-tools-section">
                    <button
                        className={`dev-tools-toggle ${devOpen ? "dev-open" : ""}`}
                        onClick={() => setDevOpen(v => !v)}
                        title="Developer tools — testing only"
                    >
                        <Clock size={14} />
                        <span>Dev Tools</span>
                        <ChevronUp
                            size={14}
                            className={`dev-chevron ${devOpen ? "dev-chevron-open" : ""}`}
                        />
                    </button>

                    {devOpen && (
                        <div className="dev-tools-panel">
                            <p className="dev-tools-heading">Override System Date &amp; Time</p>
                            <p className="dev-tools-hint">
                                ⚠ Testing only. Affects this browser tab only.
                            </p>

                            <label className="dev-label">Date</label>
                            <input
                                type="date"
                                className="dev-input"
                                value={devDate}
                                onChange={e => setDevDate(e.target.value)}
                            />

                            <label className="dev-label">Time</label>
                            <input
                                type="time"
                                className="dev-input"
                                value={devTime}
                                onChange={e => setDevTime(e.target.value)}
                            />

                            <div className="dev-btn-row">
                                <button
                                    className="dev-btn-set"
                                    onClick={handleSetOverride}
                                    disabled={!devDate}
                                >
                                    Set Override
                                </button>
                                <button
                                    className="dev-btn-reset"
                                    onClick={handleResetOverride}
                                    disabled={!overrideActive}
                                    title="Reset to real system time"
                                >
                                    <RotateCcw size={13} />
                                </button>
                            </div>

                            {overrideActive && (
                                <p className="dev-active-label">
                                    🕐 Override active: {getSystemTimeOverrideString()?.replace("T", " ")}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <button type="button" className="admin-logout" onClick={handleLogout}>
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </aside>

            <div className="admin-main">
                <header className="admin-topbar">
                    <div className="admin-topbar-title">
                        <h1>{pageTitle}</h1>
                        {badgeText && <span className="admin-badge-pill">{badgeText}</span>}
                    </div>
                    <div className="admin-topbar-right">
                        {overrideActive && (
                            <span className="admin-time-override-badge">
                                🕐 Time Override Active
                            </span>
                        )}
                        <span className="admin-system-health">
                            <HeartPulse size={16} />
                            System Healthy
                        </span>
                        <span className="admin-avatar">
                            <UserCircle2 size={28} />
                        </span>
                    </div>
                </header>

                {children}
            </div>
        </div>
    );
};

export default AdminLayout;
