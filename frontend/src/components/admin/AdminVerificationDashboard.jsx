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
    X,
    CheckCircle2,
    XCircle,
    CalendarClock,
    FileText,
    HeartPulse,
    UserCircle2
} from "lucide-react";
import {
    adminGetApplications,
    adminGetApplicationDetails,
    adminApproveApplication,
    adminRejectApplication,
    adminScheduleViva,
    SERVER_BASE_URL
} from "../../services/api";
import "./AdminVerificationDashboard.css";

const STATUS_META = {
    pending: { label: "Pending", className: "status-pending" },
    under_review: { label: "Under Review", className: "status-review" },
    approved: { label: "Approved", className: "status-approved" },
    rejected: { label: "Rejected", className: "status-rejected" }
};

const NAV_ITEMS = [
    { key: "analytics", label: "Platform Analytics", icon: BarChart2, path: "/admin/analytics" },
    { key: "verification", label: "Therapist Verification", icon: FileCheck2, active: true, path: "/admin/verification" },
    { key: "users", label: "User Management", icon: Users, path: "/admin/users" },
    { key: "approvals", label: "Group Approvals", icon: Gavel, path: "/admin/group-approvals" },
    { key: "logs", label: "Disciplinary Logs", icon: ShieldAlert },
    { key: "settings", label: "System Settings", icon: Settings }
];

const PAGE_SIZE = 4;

const AdminVerificationDashboard = () => {
    const navigate = useNavigate();

    const [applications, setApplications] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedApp, setSelectedApp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionMsg, setActionMsg] = useState("");
    const [page, setPage] = useState(1);

    const [confirmModal, setConfirmModal] = useState({
        show: false, type: "", appId: null, applicantName: ""
    });
    const [vivaModal, setVivaModal] = useState({
        show: false, appId: null, date: "", notes: ""
    });

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const data = await adminGetApplications(
                statusFilter === "all" ? "" : statusFilter
            );
            setApplications(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch applications", err);
            setApplications([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchApplications(); }, [statusFilter]);
    useEffect(() => { setPage(1); }, [search, statusFilter]);

    const visibleApps = useMemo(() => {
        if (!search.trim()) return applications;
        const q = search.toLowerCase();
        return applications.filter(
            (a) =>
                a.display_name?.toLowerCase().includes(q) ||
                a.email?.toLowerCase().includes(q)
        );
    }, [applications, search]);

    const totalPages = Math.max(1, Math.ceil(visibleApps.length / PAGE_SIZE));
    const pagedApps = visibleApps.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
    );

    const handleViewDetails = async (appId) => {
        try {
            const data = await adminGetApplicationDetails(appId);
            setSelectedApp(data);
        } catch (err) {
            console.error("Failed to fetch application details", err);
        }
    };

    const openConfirm = (type, appId, applicantName) => {
        setConfirmModal({ show: true, type, appId, applicantName });
    };

    const closeConfirm = () => {
        setConfirmModal({ show: false, type: "", appId: null, applicantName: "" });
    };

    const handleConfirmAction = async () => {
        const { type, appId } = confirmModal;
        try {
            let res;
            if (type === "approve") res = await adminApproveApplication(appId);
            else if (type === "reject") res = await adminRejectApplication(appId);

            setActionMsg(res.message);
            closeConfirm();
            setSelectedApp(null);
            fetchApplications();
            setTimeout(() => setActionMsg(""), 3000);
        } catch (err) {
            console.error("Action failed", err);
        }
    };

    const openVivaModal = (appId) => {
        setVivaModal({ show: true, appId, date: "", notes: "" });
    };

    const closeVivaModal = () => {
        setVivaModal({ show: false, appId: null, date: "", notes: "" });
    };

    const handleScheduleViva = async () => {
        const { appId, date, notes } = vivaModal;
        if (!date) return;
        try {
            const res = await adminScheduleViva(appId, date, notes);
            setActionMsg(res.message);
            closeVivaModal();
            setSelectedApp(null);
            fetchApplications();
            setTimeout(() => setActionMsg(""), 3000);
        } catch (err) {
            console.error("Failed to schedule viva", err);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString();
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
        <div className="avd-shell">
            <aside className="avd-sidebar">
                <div className="avd-brand">
                    <div className="avd-brand-mark" />
                    <div>
                        <span className="avd-brand-name">Smart Recovery Portal</span>
                    </div>
                </div>

                <nav className="avd-nav">
                    {NAV_ITEMS.map(({ key, label, icon: Icon, active, path }) => (
                        <button
                            key={key}
                            type="button"
                            className={`avd-nav-item ${active ? "avd-nav-item-active" : ""}`}
                            disabled={!path}
                            onClick={() => path && navigate(path)}
                            title={path ? label : `${label} (coming soon)`}
                            style={{ cursor: path ? "pointer" : "not-allowed" }}
                        >
                            <Icon size={18} />
                            <span>{label}</span>
                        </button>
                    ))}
                </nav>

                <button type="button" className="avd-logout" onClick={handleLogout}>
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </aside>

            <div className="avd-main">
                <header className="avd-topbar">
                    <div className="avd-topbar-title">
                        <h1>Therapist Verification</h1>
                        <span className="avd-badge-pill">Admin Control</span>
                    </div>
                    <div className="avd-topbar-right">
                        <span className="avd-system-health">
                            <HeartPulse size={16} />
                            System Healthy
                        </span>
                        <span className="avd-admin-avatar">
                            <UserCircle2 size={28} />
                        </span>
                    </div>
                </header>

                {actionMsg && <div className="avd-action-msg">{actionMsg}</div>}

                <div className="avd-toolbar">
                    <div className="avd-search-form">
                        <Search size={16} className="avd-search-icon" />
                        <input
                            type="text"
                            className="avd-search-input"
                            placeholder="Search applicants by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <select
                        className="avd-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Status: All</option>
                        <option value="pending">Status: Pending</option>
                        <option value="under_review">Status: Under Review</option>
                        <option value="approved">Status: Approved</option>
                        <option value="rejected">Status: Rejected</option>
                    </select>
                </div>

                <div className="avd-panels">
                    <section className="avd-directory-panel">
                        <div className="avd-panel-header">
                            <h2>Therapist Applications</h2>
                            <span className="avd-count">
                                {visibleApps.length} Applications Found
                            </span>
                        </div>

                        {loading ? (
                            <p className="avd-loading">Loading applications...</p>
                        ) : pagedApps.length === 0 ? (
                            <p className="avd-empty">No applications found.</p>
                        ) : (
                            <table className="avd-table">
                                <thead>
                                    <tr>
                                        <th>Applicant &amp; Email</th>
                                        <th>Position Applied</th>
                                        <th>License</th>
                                        <th>Status</th>
                                        <th>Applied On</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagedApps.map((app) => {
                                        const status = STATUS_META[app.status] || STATUS_META.pending;
                                        return (
                                            <tr
                                                key={app.id}
                                                className={selectedApp?.id === app.id ? "avd-row-active" : ""}
                                                onClick={() => handleViewDetails(app.id)}
                                            >
                                                <td>
                                                    <div className="avd-user-cell">
                                                        <span className="avd-avatar">
                                                            {initials(app.display_name)}
                                                        </span>
                                                        <div>
                                                            <div className="avd-user-name">
                                                                {app.display_name}
                                                            </div>
                                                            <div className="avd-user-email">
                                                                {app.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{app.position_applied || "—"}</td>
                                                <td>{app.primary_license || "—"}</td>
                                                <td>
                                                    <span className={`avd-status ${status.className}`}>
                                                        <span className="avd-status-dot" />
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td>{formatDate(app.created_at)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}

                        <div className="avd-pagination">
                            <span>
                                Showing {visibleApps.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
                                {" "}to {Math.min(page * PAGE_SIZE, visibleApps.length)}
                                {" "}of {visibleApps.length} entries
                            </span>
                            <div className="avd-pagination-btns">
                                <button
                                    type="button"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                >
                                    Prev
                                </button>
                                <button
                                    type="button"
                                    className="avd-pagination-next"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </section>

                    {selectedApp && (
                        <section className="avd-detail-panel">
                            <div className="avd-detail-header">
                                <h2>Application Review</h2>
                                <button
                                    type="button"
                                    className="avd-detail-close"
                                    onClick={() => setSelectedApp(null)}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="avd-detail-identity">
                                <span className="avd-avatar avd-avatar-lg">
                                    {initials(selectedApp.display_name)}
                                </span>
                                <div>
                                    <div className="avd-detail-name">
                                        {selectedApp.display_name}
                                    </div>
                                    <div className="avd-detail-sub">
                                        {selectedApp.position_applied || "Therapist Applicant"}
                                        {" • "}
                                        {selectedApp.email}
                                    </div>
                                </div>
                            </div>

                            <div className="avd-ledger">
                                <div className="avd-ledger-title">
                                    Application Details
                                </div>
                                <div className="avd-ledger-row">
                                    <span>Primary License</span>
                                    <strong>{selectedApp.primary_license || "—"}</strong>
                                </div>
                                <div className="avd-ledger-row">
                                    <span>Applied On</span>
                                    <strong>{formatDate(selectedApp.created_at)}</strong>
                                </div>
                                {selectedApp.viva_scheduled_at && (
                                    <div className="avd-ledger-row">
                                        <span>Viva Scheduled</span>
                                        <strong>{formatDate(selectedApp.viva_scheduled_at)}</strong>
                                    </div>
                                )}
                                <div className="avd-ledger-row">
                                    <span>Status</span>
                                    <span className={`avd-status ${(STATUS_META[selectedApp.status] || STATUS_META.pending).className}`}>
                                        <span className="avd-status-dot" />
                                        {(STATUS_META[selectedApp.status] || STATUS_META.pending).label}
                                    </span>
                                </div>
                            </div>

                            {selectedApp.document_url && (
                                <a
                                    href={`${SERVER_BASE_URL}${selectedApp.document_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="avd-doc-link"
                                >
                                    <FileText size={16} />
                                    View Uploaded Document
                                </a>
                            )}

                            <div className="avd-action-zone">
                                <div className="avd-action-title">
                                    Review Decision
                                </div>
                                <p className="avd-action-copy">
                                    Approving upgrades this applicant's account to a
                                    Therapist role and notifies them automatically.
                                </p>

                                {(selectedApp.status === "pending" || selectedApp.status === "under_review") && (
                                    <>
                                        <button
                                            type="button"
                                            className="avd-btn avd-btn-approve"
                                            onClick={() => openConfirm("approve", selectedApp.id, selectedApp.display_name)}
                                        >
                                            <CheckCircle2 size={16} />
                                            Approve Application
                                        </button>
                                        <button
                                            type="button"
                                            className="avd-btn avd-btn-reject"
                                            onClick={() => openConfirm("reject", selectedApp.id, selectedApp.display_name)}
                                        >
                                            <XCircle size={16} />
                                            Reject Application
                                        </button>
                                        <button
                                            type="button"
                                            className="avd-btn avd-btn-viva"
                                            onClick={() => openVivaModal(selectedApp.id)}
                                        >
                                            <CalendarClock size={16} />
                                            Schedule Viva
                                        </button>
                                    </>
                                )}

                                {selectedApp.status === "approved" && (
                                    <p className="avd-decided-note">
                                        This application has already been approved.
                                    </p>
                                )}
                                {selectedApp.status === "rejected" && (
                                    <p className="avd-decided-note">
                                        This application has already been rejected.
                                    </p>
                                )}
                            </div>
                        </section>
                    )}
                </div>
            </div>

            {confirmModal.show && (
                <div className="avd-modal-overlay">
                    <div className="avd-modal">
                        <h3 className="avd-modal-title">Confirm Action</h3>
                        <p className="avd-modal-text">
                            Are you sure you want to{" "}
                            <strong>{confirmModal.type}</strong> the application of{" "}
                            <strong>{confirmModal.applicantName}</strong>?
                        </p>
                        <p className="avd-modal-note">
                            The applicant will receive an automated notification.
                        </p>
                        <div className="avd-modal-actions">
                            <button
                                type="button"
                                className="avd-btn avd-btn-confirm"
                                onClick={handleConfirmAction}
                            >
                                Yes, confirm
                            </button>
                            <button
                                type="button"
                                className="avd-btn avd-btn-cancel"
                                onClick={closeConfirm}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {vivaModal.show && (
                <div className="avd-modal-overlay">
                    <div className="avd-modal">
                        <h3 className="avd-modal-title">Schedule Viva</h3>
                        <label className="avd-modal-label">
                            Date &amp; Time
                            <input
                                type="datetime-local"
                                className="avd-modal-input"
                                value={vivaModal.date}
                                onChange={(e) => setVivaModal((v) => ({ ...v, date: e.target.value }))}
                            />
                        </label>
                        <label className="avd-modal-label">
                            Notes (optional)
                            <textarea
                                className="avd-modal-textarea"
                                value={vivaModal.notes}
                                onChange={(e) => setVivaModal((v) => ({ ...v, notes: e.target.value }))}
                                placeholder="e.g. Bring original license documents"
                            />
                        </label>
                        <div className="avd-modal-actions">
                            <button
                                type="button"
                                className="avd-btn avd-btn-confirm"
                                onClick={handleScheduleViva}
                                disabled={!vivaModal.date}
                            >
                                Schedule
                            </button>
                            <button
                                type="button"
                                className="avd-btn avd-btn-cancel"
                                onClick={closeVivaModal}
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

export default AdminVerificationDashboard;