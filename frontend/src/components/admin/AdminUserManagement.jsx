import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    BarChart2,
    FileCheck2,
    Users,
    Gavel,
    ShieldAlert,
    Settings,
    LogOut,
    Search,
    Download,
    X,
    ShieldOff,
    Ban,
    CheckCircle2,
    HeartPulse,
    UserCircle2
} from "lucide-react";
import {
    adminGetAllUsers,
    adminGetUserDetails,
    adminSuspendUser,
    adminDeactivateUser,
    adminReactivateUser
} from "../../services/api";
import "./AdminUserManagement.css";

const ROLE_BADGE = {
    patient: "role-patient",
    therapist: "role-therapist"
};

const STATUS_META = {
    active: { label: "Active", className: "status-active" },
    suspended: { label: "Suspended", className: "status-suspended" },
    deactivated: { label: "Deactivated", className: "status-deactivated" }
};

// Sidebar items outside "User Management" don't have routes/pages built
// yet in this project — they're kept as visual placeholders so the nav
// matches the approved design without linking anywhere broken.
const NAV_ITEMS = [
    { key: "analytics", label: "Platform Analytics", icon: BarChart2 },
    { key: "verification", label: "Therapist Verification", icon: FileCheck2 },
    { key: "users", label: "User Management", icon: Users, active: true },
    { key: "approvals", label: "Group Approvals", icon: Gavel },
    { key: "logs", label: "Disciplinary Logs", icon: ShieldAlert },
    { key: "settings", label: "System Settings", icon: Settings }
];

const PAGE_SIZE = 4;

const AdminUserManagement = () => {
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionMsg, setActionMsg] = useState("");
    const [page, setPage] = useState(1);
    const [confirmModal, setConfirmModal] = useState({
        show: false, type: "",
        userId: null, userName: ""
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await adminGetAllUsers(
                search, roleFilter === "all" ? "" : roleFilter
            );
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch users", err);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, [roleFilter]);
    useEffect(() => { setPage(1); }, [search, roleFilter, statusFilter]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers();
    };

    const visibleUsers = useMemo(() => {
        if (statusFilter === "all") return users;
        return users.filter((u) => u.status === statusFilter);
    }, [users, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(visibleUsers.length / PAGE_SIZE));
    const pagedUsers = visibleUsers.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
    );

    const handleViewDetails = async (userId) => {
        try {
            const data = await adminGetUserDetails(userId);
            setSelectedUser(data);
        } catch (err) {
            console.error("Failed to fetch details", err);
        }
    };

    const openConfirm = (type, userId, userName) => {
        setConfirmModal({ show: true, type, userId, userName });
    };

    const closeConfirm = () => {
        setConfirmModal({
            show: false, type: "",
            userId: null, userName: ""
        });
    };

    const handleConfirmAction = async () => {
        const { type, userId } = confirmModal;
        try {
            let res;
            if (type === "suspend")
                res = await adminSuspendUser(userId);
            else if (type === "deactivate")
                res = await adminDeactivateUser(userId);
            else if (type === "reactivate")
                res = await adminReactivateUser(userId);

            setActionMsg(res.message);
            closeConfirm();
            setSelectedUser(null);
            fetchUsers();
            setTimeout(() => setActionMsg(""), 3000);
        } catch (err) {
            console.error("Action failed", err);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "Never";
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now - d;
        const diffH = Math.floor(diffMs / 3600000);
        if (diffH < 1) return "Just now";
        if (diffH < 24) return `${diffH}h ago`;
        const diffD = Math.floor(diffH / 24);
        if (diffD < 30) return `${diffD}d ago`;
        return d.toLocaleDateString();
    };

    const handleExportCsv = () => {
        const header = ["Name", "Email", "Role", "Status", "Sessions", "Last Login"];
        const rows = visibleUsers.map((u) => [
            u.display_name, u.email, u.role, u.status,
            u.total_sessions, u.last_login || "Never"
        ]);
        const csv = [header, ...rows]
            .map((row) => row.map((cell) => `"${String(cell ?? "")}"`).join(","))
            .join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "user-directory.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const initials = (name) => {
        if (!name) return "?";
        const parts = name.trim().split(" ");
        return (parts[0]?.[0] || "").concat(parts[1]?.[0] || "").toUpperCase();
    };

    return (
        <div className="aum-shell">
            <aside className="aum-sidebar">
                <div className="aum-brand">
                    <div className="aum-brand-mark" />
                    <div>
                        <span className="aum-brand-name">Smart Recovery Portal</span>
                    </div>
                </div>

                <nav className="aum-nav">
                    {NAV_ITEMS.map(({ key, label, icon: Icon, active }) => (
                        <button
                            key={key}
                            type="button"
                            className={`aum-nav-item ${active ? "aum-nav-item-active" : ""}`}
                            disabled={!active}
                            title={active ? label : `${label} (coming soon)`}
                        >
                            <Icon size={18} />
                            <span>{label}</span>
                        </button>
                    ))}
                </nav>

                <button type="button" className="aum-logout" onClick={handleLogout}>
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </aside>

            <div className="aum-main">
                <header className="aum-topbar">
                    <div className="aum-topbar-title">
                        <h1>User Management</h1>
                        <span className="aum-badge-pill">Admin Control</span>
                    </div>
                    <div className="aum-topbar-right">
                        <span className="aum-system-health">
                            <HeartPulse size={16} />
                            System Healthy
                        </span>
                        <span className="aum-admin-avatar">
                            <UserCircle2 size={28} />
                        </span>
                    </div>
                </header>

                {actionMsg && <div className="aum-action-msg">{actionMsg}</div>}

                <div className="aum-toolbar">
                    <form className="aum-search-form" onSubmit={handleSearch}>
                        <Search size={16} className="aum-search-icon" />
                        <input
                            type="text"
                            className="aum-search-input"
                            placeholder="Search users by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </form>

                    <select
                        className="aum-select"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">Role: All Roles</option>
                        <option value="patient">Role: Patient</option>
                        <option value="therapist">Role: Therapist</option>
                    </select>

                    <select
                        className="aum-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Status: All</option>
                        <option value="active">Status: Active</option>
                        <option value="suspended">Status: Suspended</option>
                        <option value="deactivated">Status: Deactivated</option>
                    </select>

                    <button
                        type="button"
                        className="aum-export-btn"
                        onClick={handleExportCsv}
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>

                <div className="aum-panels">
                    <section className="aum-directory-panel">
                        <div className="aum-panel-header">
                            <h2>Registered User Directory</h2>
                            <span className="aum-count">
                                {visibleUsers.length} Users Found
                            </span>
                        </div>

                        {loading ? (
                            <p className="aum-loading">Loading users...</p>
                        ) : pagedUsers.length === 0 ? (
                            <p className="aum-empty">No users found.</p>
                        ) : (
                            <table className="aum-table">
                                <thead>
                                    <tr>
                                        <th>User Name &amp; Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Sessions</th>
                                        <th>Login</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagedUsers.map((user) => {
                                        const status = STATUS_META[user.status] || STATUS_META.active;
                                        return (
                                            <tr
                                                key={user.id}
                                                className={selectedUser?.id === user.id ? "aum-row-active" : ""}
                                                onClick={() => handleViewDetails(user.id)}
                                            >
                                                <td>
                                                    <div className="aum-user-cell">
                                                        <span className="aum-avatar">
                                                            {initials(user.display_name)}
                                                        </span>
                                                        <div>
                                                            <div className="aum-user-name">
                                                                {user.display_name}
                                                            </div>
                                                            <div className="aum-user-email">
                                                                {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`aum-role-pill ${ROLE_BADGE[user.role] || ""}`}>
                                                        {user.role === "therapist" ? "Therapist" : "Patient"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`aum-status ${status.className}`}>
                                                        <span className="aum-status-dot" />
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="aum-sessions">{user.total_sessions}</td>
                                                <td className="aum-login">{formatDate(user.last_login)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}

                        <div className="aum-pagination">
                            <span>
                                Showing {visibleUsers.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
                                {" "}to {Math.min(page * PAGE_SIZE, visibleUsers.length)}
                                {" "}of {visibleUsers.length} entries
                            </span>
                            <div className="aum-pagination-btns">
                                <button
                                    type="button"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                >
                                    Prev
                                </button>
                                <button
                                    type="button"
                                    className="aum-pagination-next"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </section>

                    {selectedUser && (
                        <section className="aum-detail-panel">
                            <div className="aum-detail-header">
                                <h2>Account Details &amp; Governance</h2>
                                <button
                                    type="button"
                                    className="aum-detail-close"
                                    onClick={() => setSelectedUser(null)}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="aum-detail-identity">
                                <span className="aum-avatar aum-avatar-lg">
                                    {initials(selectedUser.display_name)}
                                </span>
                                <div>
                                    <div className="aum-detail-name">
                                        {selectedUser.display_name}
                                    </div>
                                    <div className="aum-detail-sub">
                                        {selectedUser.role === "therapist" ? "Therapist" : "Patient"}
                                        {" • "}
                                        {selectedUser.email}
                                    </div>
                                    {(selectedUser.location || selectedUser.contact_number) && (
                                        <div className="aum-detail-sub">
                                            {[selectedUser.location, selectedUser.contact_number]
                                                .filter(Boolean).join(" • ")}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="aum-ledger">
                                <div className="aum-ledger-title">
                                    Activity &amp; Clinical Ledger
                                </div>
                                <div className="aum-ledger-row">
                                    <span>Total Sessions Completed</span>
                                    <strong>{selectedUser.total_sessions}</strong>
                                </div>
                                <div className="aum-ledger-row">
                                    <span>Last System Login</span>
                                    <strong>{formatDate(selectedUser.last_login)}</strong>
                                </div>
                                <div className="aum-ledger-row">
                                    <span>Registered On</span>
                                    <strong>
                                        {selectedUser.created_at
                                            ? new Date(selectedUser.created_at).toLocaleDateString()
                                            : "—"}
                                    </strong>
                                </div>
                                <div className="aum-ledger-row">
                                    <span>Account Status</span>
                                    <span className={`aum-status ${(STATUS_META[selectedUser.status] || STATUS_META.active).className}`}>
                                        <span className="aum-status-dot" />
                                        {(STATUS_META[selectedUser.status] || STATUS_META.active).label}
                                    </span>
                                </div>
                            </div>

                            <div className="aum-danger-zone">
                                <div className="aum-danger-title">
                                    <ShieldOff size={16} />
                                    Disciplinary Danger Zone
                                </div>
                                <p className="aum-danger-copy">
                                    Executing an action below restricts login immediately
                                    and sends the user an automated notification.
                                </p>

                                {selectedUser.status === "active" && (
                                    <>
                                        <button
                                            type="button"
                                            className="aum-btn aum-btn-suspend"
                                            onClick={() => openConfirm("suspend", selectedUser.id, selectedUser.display_name)}
                                        >
                                            <ShieldOff size={16} />
                                            Suspend Account Temporarily
                                        </button>
                                        <button
                                            type="button"
                                            className="aum-btn aum-btn-deactivate"
                                            onClick={() => openConfirm("deactivate", selectedUser.id, selectedUser.display_name)}
                                        >
                                            <Ban size={16} />
                                            Deactivate Permanently
                                        </button>
                                    </>
                                )}

                                {selectedUser.status === "suspended" && (
                                    <>
                                        <button
                                            type="button"
                                            className="aum-btn aum-btn-reactivate"
                                            onClick={() => openConfirm("reactivate", selectedUser.id, selectedUser.display_name)}
                                        >
                                            <CheckCircle2 size={16} />
                                            Reactivate Account
                                        </button>
                                        <button
                                            type="button"
                                            className="aum-btn aum-btn-deactivate"
                                            onClick={() => openConfirm("deactivate", selectedUser.id, selectedUser.display_name)}
                                        >
                                            <Ban size={16} />
                                            Deactivate Permanently
                                        </button>
                                    </>
                                )}

                                {selectedUser.status === "deactivated" && (
                                    <p className="aum-deactivated-note">
                                        This account is permanently deactivated.
                                    </p>
                                )}
                            </div>
                        </section>
                    )}
                </div>
            </div>

            {confirmModal.show && (
                <div className="aum-modal-overlay">
                    <div className="aum-modal">
                        <h3 className="aum-modal-title">Confirm Action</h3>
                        <p className="aum-modal-text">
                            Are you sure you want to{" "}
                            <strong>{confirmModal.type}</strong> the account of{" "}
                            <strong>{confirmModal.userName}</strong>?
                            {confirmModal.type === "deactivate" &&
                                " This action is permanent."}
                        </p>
                        <p className="aum-modal-note">
                            The user will receive an automated notification.
                        </p>
                        <div className="aum-modal-actions">
                            <button
                                type="button"
                                className="aum-btn aum-btn-confirm"
                                onClick={handleConfirmAction}
                            >
                                Yes, confirm
                            </button>
                            <button
                                type="button"
                                className="aum-btn aum-btn-cancel"
                                onClick={closeConfirm}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUserManagement;