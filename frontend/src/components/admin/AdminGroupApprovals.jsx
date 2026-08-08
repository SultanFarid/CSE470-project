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
    HeartPulse,
    UserCircle2,
    Calendar,
    Clock,
    Users2,
    DollarSign,
    Tag
} from "lucide-react";
// API functions - update paths according to your api.js exports
import {
    adminGetGroupProposals,
    adminApproveGroupProposal,
    adminRejectGroupProposal
} from "../../services/api";
import "./AdminVerificationDashboard.css"; // Reusing exact same CSS styles!

const STATUS_META = {
    pending: { label: "Pending Approval", className: "status-pending" },
    approved: { label: "Approved", className: "status-approved" },
    rejected: { label: "Rejected", className: "status-rejected" }
};

const NAV_ITEMS = [
    { key: "analytics", label: "Platform Analytics", icon: BarChart2, path: "/admin/analytics" },
    { key: "verification", label: "Therapist Verification", icon: FileCheck2, path: "/admin/verification" },
    { key: "users", label: "User Management", icon: Users, path: "/admin/users" },
    { key: "approvals", label: "Group Approvals", icon: Gavel, active: true, path: "/admin/group-approvals" },
    { key: "logs", label: "Disciplinary Logs", icon: ShieldAlert },
    { key: "settings", label: "System Settings", icon: Settings }
];

const PAGE_SIZE = 4;

const AdminGroupApprovals = () => {
    const navigate = useNavigate();

    const [proposals, setProposals] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionMsg, setActionMsg] = useState("");
    const [page, setPage] = useState(1);

    const [confirmModal, setConfirmModal] = useState({
        show: false, type: "", proposalId: null, title: "", rejectionReason: ""
    });

    const fetchProposals = async () => {
        setLoading(true);
        try {
            const filterStatus = statusFilter === "all" ? undefined : statusFilter;
            const data = await adminGetGroupProposals(filterStatus);
            setProposals(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch group proposals", err);
            setProposals([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProposals(); }, [statusFilter]);
    useEffect(() => { setPage(1); }, [search, statusFilter]);

    const visibleProposals = useMemo(() => {
        if (!search.trim()) return proposals;
        const q = search.toLowerCase();
        return proposals.filter(
            (p) =>
                p.title?.toLowerCase().includes(q) ||
                p.therapist_name?.toLowerCase().includes(q) 
        );
    }, [proposals, search]);

    const totalPages = Math.max(1, Math.ceil(visibleProposals.length / PAGE_SIZE));
    const pagedProposals = visibleProposals.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
    );

    const openConfirm = (type, proposalId, title) => {
        setConfirmModal({ show: true, type, proposalId, title, rejectionReason: "" });
    };

    const closeConfirm = () => {
        setConfirmModal({ show: false, type: "", proposalId: null, title: "", rejectionReason: "" });
    };

    const handleConfirmAction = async () => {
        const { type, proposalId, rejectionReason } = confirmModal;
        try {
            let res;
            if (type === "approve") {
                res = await adminApproveGroupProposal(proposalId);
            } else if (type === "reject") {
                res = await adminRejectGroupProposal(proposalId, rejectionReason);
            }

            setActionMsg(res.message || `Session proposal ${type}d successfully!`);
            closeConfirm();
            setSelectedProposal(null);
            fetchProposals();
            setTimeout(() => setActionMsg(""), 3000);
        } catch (err) {
            console.error("Action failed", err);
        }
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const initials = (name) => {
        if (!name) return "T";
        const parts = name.trim().split(" ");
        return (parts[0]?.[0] || "").concat(parts[1]?.[0] || "").toUpperCase();
    };

    return (
        <div className="avd-shell">
            {/* Sidebar */}
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

            {/* Main Area */}
            <div className="avd-main">
                <header className="avd-topbar">
                    <div className="avd-topbar-title">
                        <h1>Group Session Approvals</h1>
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
                            placeholder="Search by title or therapist..."
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
                        <option value="approved">Status: Approved</option>
                        <option value="rejected">Status: Rejected</option>
                    </select>
                </div>

                <div className="avd-panels">
                    {/* Directory Panel */}
                    <section className="avd-directory-panel">
                        <div className="avd-panel-header">
                            <h2>Submitted Proposals</h2>
                            <span className="avd-count">
                                {visibleProposals.length} Proposals Found
                            </span>
                        </div>

                        {loading ? (
                            <p className="avd-loading">Loading proposals...</p>
                        ) : pagedProposals.length === 0 ? (
                            <p className="avd-empty">No group session proposals found.</p>
                        ) : (
                            <table className="avd-table">
                                <thead>
                                    <tr>
                                        <th>Therapist &amp; Session Title</th>                   
                                        <th>Schedule</th>
                                        <th>Capacity</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagedProposals.map((item) => {
                                        const status = STATUS_META[item.status] || STATUS_META.pending;
                                        return (
                                            <tr
                                                key={item.id}
                                                className={selectedProposal?.id === item.id ? "avd-row-active" : ""}
                                                onClick={() => setSelectedProposal(item)}
                                            >
                                                <td>
                                                    <div className="avd-user-cell">
                                                        <span className="avd-avatar">
                                                            {initials(item.therapist_name)}
                                                        </span>
                                                        <div>
                                                            <div className="avd-user-name">
                                                                {item.title}
                                                            </div>
                                                            <div className="avd-user-email">
                                                                By {item.therapist_name || "Therapist"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                        
                                                <td>{formatDateTime(item.start_time)}</td>
                                                <td>
                                                    {item.max_participants || 10} seats 
                                                </td>
                                                <td>
                                                    <span className={`avd-status ${status.className}`}>
                                                        <span className="avd-status-dot" />
                                                        {status.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}

                        <div className="avd-pagination">
                            <span>
                                Showing {visibleProposals.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
                                {" "}to {Math.min(page * PAGE_SIZE, visibleProposals.length)}
                                {" "}of {visibleProposals.length} entries
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

                    {/* Detail Panel */}
                    {selectedProposal && (
                        <section className="avd-detail-panel">
                            <div className="avd-detail-header">
                                <h2>Proposal Review</h2>
                                <button
                                    type="button"
                                    className="avd-detail-close"
                                    onClick={() => setSelectedProposal(null)}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="avd-detail-identity">
                                <span className="avd-avatar avd-avatar-lg">
                                    {initials(selectedProposal.therapist_name)}
                                </span>
                                <div>
                                    <div className="avd-detail-name">
                                        {selectedProposal.title}
                                    </div>
                                    <div className="avd-detail-sub">
                                        Proposed by: {selectedProposal.therapist_name}
                                    </div>
                                </div>
                            </div>

                            <div className="avd-ledger">
                                <div className="avd-ledger-title">
                                    Session Details
                                                     
                                </div>
                                <div className="avd-ledger-row">
                                    <span><Calendar size={13} style={{ display: 'inline', marginRight: 4 }} /> Date</span>
                                    <strong>{formatDateTime(selectedProposal.start_time)}</strong>
                                </div>
                                <div className="avd-ledger-row">
                                    <span><Users2 size={13} style={{ display: 'inline', marginRight: 4 }} /> Max Capacity</span>
                                    <strong>{selectedProposal.max_participants || 10} Participants</strong>
                                </div>
                                <div className="avd-ledger-row">
                                    <span>Status</span>
                                    <span className={`avd-status ${(STATUS_META[selectedProposal.status] || STATUS_META.pending).className}`}>
                                        <span className="avd-status-dot" />
                                        {(STATUS_META[selectedProposal.status] || STATUS_META.pending).label}
                                    </span>
                                </div>
                            </div>

                            {selectedProposal.description && (
                                <div className="avd-ledger" style={{ marginTop: 12 }}>
                                    <div className="avd-ledger-title">Description</div>
                                    <p style={{ fontSize: 13, color: '#4a4d68', margin: 0, lineHeight: 1.4 }}>
                                        {selectedProposal.description}
                                    </p>
                                </div>
                            )}

                            <div className="avd-action-zone">
                                <div className="avd-action-title">
                                    Review Action
                                </div>
                                <p className="avd-action-copy">
                                    Approving makes this group session visible on the Patient Dashboard for enrollment.
                                </p>

                                {selectedProposal.status === "pending" && (
                                    <>
                                        <button
                                            type="button"
                                            className="avd-btn avd-btn-approve"
                                            onClick={() => openConfirm("approve", selectedProposal.id, selectedProposal.title)}
                                        >
                                            <CheckCircle2 size={16} />
                                            Approve Proposal
                                        </button>
                                        <button
                                            type="button"
                                            className="avd-btn avd-btn-reject"
                                            onClick={() => openConfirm("reject", selectedProposal.id, selectedProposal.title)}
                                        >
                                            <XCircle size={16} />
                                            Reject Proposal
                                        </button>
                                    </>
                                )}

                                {selectedProposal.status === "approved" && (
                                    <p className="avd-decided-note">
                                        This group session has already been approved.
                                    </p>
                                )}
                                {selectedProposal.status === "rejected" && (
                                    <p className="avd-decided-note">
                                        This proposal was rejected.
                                    </p>
                                )}
                            </div>
                        </section>
                    )}
                </div>
            </div>

            {/* Confirm / Reject Modal */}
            {confirmModal.show && (
                <div className="avd-modal-overlay">
                    <div className="avd-modal">
                        <h3 className="avd-modal-title">
                            {confirmModal.type === "approve" ? "Approve Group Session" : "Reject Group Session"}
                        </h3>
                        <p className="avd-modal-text">
                            Are you sure you want to <strong>{confirmModal.type}</strong> the proposal:{" "}
                            <strong>"{confirmModal.title}"</strong>?
                        </p>

                        {confirmModal.type === "reject" && (
                            <label className="avd-modal-label">
                                Reason for Rejection (Optional)
                                <textarea
                                    className="avd-modal-textarea"
                                    value={confirmModal.rejectionReason}
                                    onChange={(e) => setConfirmModal((v) => ({ ...v, rejectionReason: e.target.value }))}
                                    placeholder="Provide feedback to the therapist..."
                                />
                            </label>
                        )}

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
        </div>
    );
};

export default AdminGroupApprovals;