import { useNavigate, useLocation } from "react-router-dom";
import {
    BarChart2,
    FileCheck2,
    Users,
    Gavel,
    ShieldAlert,
    Settings,
    LogOut,
    HeartPulse,
    UserCircle2
} from "lucide-react";
import "./AdminLayout.css";

// Every admin page in the sidebar, in the order they should appear.
// Pages without a `path` yet (Disciplinary Logs, System Settings) haven't
// been built, so they show up disabled instead of linking to nothing.
const NAV_ITEMS = [
    { key: "analytics", label: "Platform Analytics", icon: BarChart2, path: "/admin/analytics" },
    { key: "verification", label: "Therapist Verification", icon: FileCheck2, path: "/admin/verification" },
    { key: "users", label: "User Management", icon: Users, path: "/admin/users" },
    { key: "approvals", label: "Group Approvals", icon: Gavel, path: "/admin/group-approvals" },
    { key: "logs", label: "Disciplinary Logs", icon: ShieldAlert, path: null },
    { key: "settings", label: "System Settings", icon: Settings, path: null }
];

/**
 * Wraps every admin page with the same sidebar and top bar, so the nav
 * only has to be built once instead of copy-pasted into each page.
 *
 * Usage:
 *   <AdminLayout pageTitle="User Management" badgeText="Admin Control">
 *     ...page content...
 *   </AdminLayout>
 */
const AdminLayout = ({ pageTitle, badgeText, children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
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
