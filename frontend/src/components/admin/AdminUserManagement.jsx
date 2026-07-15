import { useState, useEffect } from "react";
import {
    adminGetAllUsers,
    adminGetUserDetails,
    adminSuspendUser,
    adminDeactivateUser,
    adminReactivateUser
} from "../../services/api";
import "./AdminUserManagement.css";

const STATUS_BADGE = {
    active: "badge-active",
    suspended: "badge-suspended",
    deactivated: "badge-deactivated"
};

const AdminUserManagement = () => {
    const [users, setUsers]               = useState([]);
    const [search, setSearch]             = useState("");
    const [roleFilter, setRoleFilter]     = useState("all");
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading]           = useState(true);
    const [actionMsg, setActionMsg]       = useState("");
    const [confirmModal, setConfirmModal] = useState({
        show: false, type: "",
        userId: null, userName: ""
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await adminGetAllUsers(
                search, roleFilter
            );
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Fetch error:", err);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, [roleFilter]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers();
    };

    const handleView = async (userId) => {
        try {
            const data = await adminGetUserDetails(userId);
            setSelectedUser(data);
        } catch (err) {
            console.error("Detail fetch error:", err);
        }
    };

    const openConfirm = (type, userId, userName) => {
        setConfirmModal({
            show: true, type, userId, userName
        });
    };

    const closeConfirm = () => {
        setConfirmModal({
            show: false, type: "",
            userId: null, userName: ""
        });
    };

    const handleConfirm = async () => {
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
            console.error("Action error:", err);
        }
    };

    const formatDate = (d) => {
        if (!d) return "Never";
        return new Date(d).toLocaleString();
    };

    return (
        <div className="aum-container">
            <div className="aum-header">
                <h2 className="aum-title">
                    User Management
                </h2>
                <p className="aum-subtitle">
                    Search, view, and manage all users
                </p>
            </div>

            {actionMsg && (
                <div className="aum-action-msg">
                    {actionMsg}
                </div>
            )}

            <div className="aum-controls">
                <form className="aum-search-form"
                      onSubmit={handleSearch}>
                    <input
                        type="text"
                        className="aum-search-input"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)}
                    />
                    <button type="submit"
                            className="aum-search-btn">
                        Search
                    </button>
                </form>
                <div className="aum-filter-group">
                    <label className="aum-filter-label">
                        Role:
                    </label>
                    <select
                        className="aum-filter-select"
                        value={roleFilter}
                        onChange={(e) =>
                            setRoleFilter(e.target.value)}
                    >
                        <option value="all">All</option>
                        <option value="patient">
                            Patient
                        </option>
                        <option value="therapist">
                            Therapist
                        </option>
                    </select>
                </div>
            </div>

            <div className="aum-main-layout">
                <div className="aum-table-wrapper">
                    {loading ? (
                        <p className="aum-loading">
                            Loading users...
                        </p>
                    ) : users.length === 0 ? (
                        <p className="aum-empty">
                            No users found.
                        </p>
                    ) : (
                        <table className="aum-table">
                            <thead>
                                <tr>
                                    <th>Name / Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Last Login</th>
                                    <th>Sessions</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className="aum-user-name">
                                                {user.display_name}
                                            </div>
                                            <div className="aum-user-email">
                                                {user.email}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="aum-role-pill">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`aum-badge ${STATUS_BADGE[user.status] || 'badge-active'}`}>
                                                {user.status || 'active'}
                                            </span>
                                        </td>
                                        <td className="aum-date">
                                            {formatDate(
                                                user.last_login
                                            )}
                                        </td>
                                        <td className="aum-sessions">
                                            {user.total_sessions || 0}
                                        </td>
                                        <td>
                                            <button
                                                className="aum-btn aum-btn-view"
                                                onClick={() =>
                                                    handleView(user.id)}
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {selectedUser && (
                    <div className="aum-detail-panel">
                        <div className="aum-detail-header">
                            <h3 className="aum-detail-title">
                                Account Details
                            </h3>
                            <button
                                className="aum-detail-close"
                                onClick={() =>
                                    setSelectedUser(null)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="aum-detail-body">
                            {[
                                ["Name", selectedUser.display_name],
                                ["Email", selectedUser.email],
                                ["Role", selectedUser.role],
                                ["Total Sessions", selectedUser.total_sessions || 0],
                                ["Last Login", formatDate(selectedUser.last_login)],
                                ["Registered", formatDate(selectedUser.created_at)],
                                ["Location", selectedUser.location]
                            ].map(([label, value]) =>
                                value !== undefined &&
                                value !== null && (
                                <div key={label}
                                     className="aum-detail-row">
                                    <span className="aum-detail-label">
                                        {label}
                                    </span>
                                    <span className="aum-detail-value">
                                        {value}
                                    </span>
                                </div>
                            ))}
                            <div className="aum-detail-row">
                                <span className="aum-detail-label">
                                    Status
                                </span>
                                <span className={`aum-badge ${STATUS_BADGE[selectedUser.status] || 'badge-active'}`}>
                                    {selectedUser.status || 'active'}
                                </span>
                            </div>
                        </div>

                        <div className="aum-detail-actions">
                            {(!selectedUser.status ||
                              selectedUser.status === 'active') && (
                                <>
                                    <button
                                        className="aum-btn aum-btn-suspend"
                                        onClick={() => openConfirm(
                                            'suspend',
                                            selectedUser.id,
                                            selectedUser.display_name
                                        )}
                                    >
                                        Suspend Account
                                    </button>
                                    <button
                                        className="aum-btn aum-btn-deactivate"
                                        onClick={() => openConfirm(
                                            'deactivate',
                                            selectedUser.id,
                                            selectedUser.display_name
                                        )}
                                    >
                                        Deactivate Permanently
                                    </button>
                                </>
                            )}
                            {selectedUser.status === 'suspended' && (
                                <>
                                    <button
                                        className="aum-btn aum-btn-reactivate"
                                        onClick={() => openConfirm(
                                            'reactivate',
                                            selectedUser.id,
                                            selectedUser.display_name
                                        )}
                                    >
                                        Reactivate Account
                                    </button>
                                    <button
                                        className="aum-btn aum-btn-deactivate"
                                        onClick={() => openConfirm(
                                            'deactivate',
                                            selectedUser.id,
                                            selectedUser.display_name
                                        )}
                                    >
                                        Deactivate Permanently
                                    </button>
                                </>
                            )}
                            {selectedUser.status ===
                                'deactivated' && (
                                <p className="aum-deactivated-note">
                                    This account is permanently
                                    deactivated.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {confirmModal.show && (
                <div className="aum-modal-overlay">
                    <div className="aum-modal">
                        <h3 className="aum-modal-title">
                            Confirm Action
                        </h3>
                        <p className="aum-modal-text">
                            Are you sure you want to{" "}
                            <strong>
                                {confirmModal.type}
                            </strong>{" "}
                            the account of{" "}
                            <strong>
                                {confirmModal.userName}
                            </strong>?
                            {confirmModal.type ===
                                'deactivate' &&
                                " This is permanent."}
                        </p>
                        <p className="aum-modal-note">
                            User will receive an automated
                            notification.
                        </p>
                        <div className="aum-modal-actions">
                            <button
                                className="aum-btn aum-btn-confirm"
                                onClick={handleConfirm}
                            >
                                Yes, confirm
                            </button>
                            <button
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