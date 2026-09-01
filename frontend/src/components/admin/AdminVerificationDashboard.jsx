import { useState, useEffect, useMemo } from "react";
import {
    Search,
    X,
    CheckCircle2,
    XCircle,
    CalendarClock,
    FileText
} from "lucide-react";
import AdminLayout from "./AdminLayout";
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

const PAGE_SIZE = 4;

const AdminVerificationDashboard = () => {
    const [applications, setApplications] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedApp, setSelectedApp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionMsg, setActionMsg] = useState("");
    const [page, setPage] = useState(1);

    const [inlineAction, setInlineAction] = useState({ type: null });
    const [inlineVivaDate, setInlineVivaDate] = useState("");
    const [inlineVivaNotes, setInlineVivaNotes] = useState("");
    const [actionProcessing, setActionProcessing] = useState(false);

    const [confirmModal, setConfirmModal] = useState({
        show: false, type: "", appId: null, applicantName: ""
    });
    const [vivaModal, setVivaModal] = useState({
        show: false, appId: null, date: "", notes: ""
    });

    const executeApplicationAction = async (type, appId) => {
        setActionProcessing(true);
        try {
            let res;
            if (type === "approve") res = await adminApproveApplication(appId);
            else if (type === "reject") res = await adminRejectApplication(appId);

            const msg = res.generatedPassword
                ? `${res.message} — New login for ${res.accountEmail}: ${res.generatedPassword} (share this with applicant)`
                : res.message;

            setActionMsg(msg);
            setInlineAction({ type: null });
            setSelectedApp(null);
            fetchApplications();
            setTimeout(() => setActionMsg(""), res.generatedPassword ? 15000 : 4000);
        } catch (err) {
            console.error("Application action failed:", err);
            setActionMsg(err.response?.data?.message || "Failed to update application.");
            setTimeout(() => setActionMsg(""), 4000);
        } finally {
            setActionProcessing(false);
        }
    };

    const executeScheduleViva = async (appId) => {
        if (!inlineVivaDate) return;
        setActionProcessing(true);
        try {
            const res = await adminScheduleViva(appId, inlineVivaDate, inlineVivaNotes);
            setActionMsg(res.message);
            setInlineAction({ type: null });
            setInlineVivaDate("");
            setInlineVivaNotes("");
            setSelectedApp(null);
            fetchApplications();
            setTimeout(() => setActionMsg(""), 4000);
        } catch (err) {
            console.error("Failed to schedule viva:", err);
            setActionMsg(err.response?.data?.message || "Failed to schedule viva.");
            setTimeout(() => setActionMsg(""), 4000);
        } finally {
            setActionProcessing(false);
        }
    };

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

            const msg = res.generatedPassword
                ? `${res.message} — New login for ${res.accountEmail}: ${res.generatedPassword} (share this with the applicant; there's no auto-email yet)`
                : res.message;

            setActionMsg(msg);
            closeConfirm();
            setSelectedApp(null);
            fetchApplications();
            setTimeout(() => setActionMsg(""), res.generatedPassword ? 15000 : 3000);
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

    const initials = (name) => {
        if (!name) return "?";
        const parts = name.trim().split(" ");
        return (parts[0]?.[0] || "").concat(parts[1]?.[0] || "").toUpperCase();
    };

    // employment_history / professional_references are stored as JSON text;
    // shape isn't fixed, so render generically rather than assuming exact keys.
    const safeParseArray = (raw) => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    const labelize = (key) => key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    const money = (val) => (val || val === 0) ? `$${Number(val).toLocaleString()}` : "—";

    return (
        <AdminLayout pageTitle="Therapist Verification" badgeText="Admin Control">
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
                <section className="avd-directory-panel" style={{ width: '100%' }}>
                    <div className="avd-panel-header">
                        <h2>Therapist Applications Directory</h2>
                        <span className="avd-count">
                            {visibleApps.length} Applications Found
                        </span>
                    </div>

                    {loading ? (
                        <div className="avd-loading-state">
                            <div className="avd-spinner" />
                            <p>Loading applications...</p>
                        </div>
                    ) : pagedApps.length === 0 ? (
                        <div className="avd-empty-state">
                            <p className="avd-empty-title">No applications found</p>
                            <p className="avd-empty-subtitle">Try changing your search query or status filter.</p>
                        </div>
                    ) : (
                        <div className="avd-card-list">
                            {pagedApps.map((app) => {
                                const status = STATUS_META[app.status] || STATUS_META.pending;
                                return (
                                    <div
                                        key={app.id}
                                        className="avd-card-horizontal"
                                        onClick={() => handleViewDetails(app.id)}
                                    >
                                        {/* Left Avatar */}
                                        <div className="avd-card-avatar-wrap">
                                            <span className="avd-avatar avd-avatar-md">
                                                {initials(app.display_name)}
                                            </span>
                                        </div>

                                        {/* Middle Info Column */}
                                        <div className="avd-card-content">
                                            <div className="avd-card-top-row">
                                                <h3 className="avd-card-name">{app.display_name}</h3>
                                                <span className={`avd-status ${status.className}`}>
                                                    <span className="avd-status-dot" />
                                                    {status.label}
                                                </span>
                                            </div>

                                            <div className="avd-card-meta-row">
                                                <span className="avd-meta-item">
                                                    <strong>Position:</strong> {app.position_applied || "Clinical Therapist"}
                                                </span>
                                                <span className="avd-meta-dot">·</span>
                                                <span className="avd-meta-item">
                                                    <strong>License:</strong> {app.primary_license || "Under Verification"}
                                                </span>
                                                <span className="avd-meta-dot">·</span>
                                                <span className="avd-meta-item">
                                                    <strong>Email:</strong> {app.email}
                                                </span>
                                            </div>

                                            <div className="avd-card-footer-row">
                                                <span className="avd-applied-date">
                                                    Applied on {formatDate(app.created_at)}
                                                </span>
                                                {app.viva_scheduled_at && (
                                                    <span className="avd-viva-badge">
                                                        <CalendarClock size={12} /> Viva: {formatDate(app.viva_scheduled_at)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right Action Button */}
                                        <div className="avd-card-action">
                                            <button
                                                type="button"
                                                className="avd-request-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewDetails(app.id);
                                                }}
                                            >
                                                <FileText size={14} />
                                                <span>Review Application</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
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
            </div>

            {/* Application Detail Modal Dialog Overlay */}
            {selectedApp && (
                <div className="avd-review-modal-overlay" onClick={() => setSelectedApp(null)}>
                    <div className="avd-review-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="avd-modal-header-bar">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <h2 className="avd-modal-header-title">Therapist Application Details</h2>
                                <span className={`avd-status ${(STATUS_META[selectedApp.status] || STATUS_META.pending).className}`}>
                                    <span className="avd-status-dot" />
                                    {(STATUS_META[selectedApp.status] || STATUS_META.pending).label}
                                </span>
                            </div>
                            <button
                                type="button"
                                className="avd-detail-close"
                                onClick={() => setSelectedApp(null)}
                                title="Close modal"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="avd-modal-body-scroll">
                            {/* Applicant Snapshot Tile */}
                            <div className="avd-applicant-hero-tile">
                                <span className="avd-avatar avd-avatar-xl">
                                    {initials(selectedApp.display_name)}
                                </span>
                                <div>
                                    <h3 className="avd-hero-name">{selectedApp.display_name}</h3>
                                    <p className="avd-hero-sub">
                                        {selectedApp.position_applied || "Therapist Applicant"} • {selectedApp.email}
                                    </p>
                                    {(selectedApp.address || selectedApp.phone) && (
                                        <p className="avd-hero-contact">
                                            {[selectedApp.phone, selectedApp.address].filter(Boolean).join(" • ")}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Section 1: Application Status & Timeline */}
                            <div className="avd-modal-section">
                                <div className="avd-section-heading">Application Timeline &amp; Status</div>
                                <div className="avd-grid-2">
                                    <div className="avd-ledger-row"><span>Applied Date</span><strong>{formatDate(selectedApp.created_at)}</strong></div>
                                    <div className="avd-ledger-row"><span>Current Status</span><strong>{(STATUS_META[selectedApp.status] || STATUS_META.pending).label}</strong></div>
                                </div>
                                {selectedApp.viva_scheduled_at && (
                                    <div className="avd-viva-callout">
                                        <CalendarClock size={16} color="#7c3aed" />
                                        <div>
                                            <strong>Viva Interview Scheduled:</strong> {formatDate(selectedApp.viva_scheduled_at)}
                                            {selectedApp.viva_notes && <p style={{ margin: '2px 0 0', fontSize: '12px' }}>{selectedApp.viva_notes}</p>}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Section 2: Personal & Contact Details */}
                            <div className="avd-modal-section">
                                <div className="avd-section-heading">Personal &amp; Contact Information</div>
                                <div className="avd-grid-2">
                                    <div className="avd-ledger-row"><span>National ID / Passport</span><strong>{selectedApp.national_id || "—"}</strong></div>
                                    <div className="avd-ledger-row"><span>Phone Number</span><strong>{selectedApp.phone || "—"}</strong></div>
                                    <div className="avd-ledger-row"><span>Emergency Contact</span><strong>{selectedApp.emergency_contact || "—"}</strong></div>
                                    <div className="avd-ledger-row"><span>Residential Address</span><strong>{selectedApp.address || "—"}</strong></div>
                                </div>
                            </div>

                            {/* Section 3: Position & Employment Terms */}
                            <div className="avd-modal-section">
                                <div className="avd-section-heading">Position &amp; Compensation Preferences</div>
                                <div className="avd-grid-2">
                                    <div className="avd-ledger-row"><span>Position Applied</span><strong>{selectedApp.position_applied || "—"}</strong></div>
                                    <div className="avd-ledger-row"><span>Employment Type</span><strong>{selectedApp.employment_type || "—"}</strong></div>
                                    <div className="avd-ledger-row"><span>Shift Availability</span><strong>{selectedApp.shift_availability || "—"}</strong></div>
                                    <div className="avd-ledger-row"><span>Preferred Start Date</span><strong>{formatDate(selectedApp.start_date)}</strong></div>
                                    <div className="avd-ledger-row"><span>Desired Salary / Fee</span><strong>{money(selectedApp.desired_salary)}</strong></div>
                                </div>
                            </div>

                            {/* Section 4: Licensing & Certifications */}
                            <div className="avd-modal-section">
                                <div className="avd-section-heading">Licensing &amp; Professional Credentials</div>
                                <div className="avd-grid-2">
                                    <div className="avd-ledger-row"><span>Primary License</span><strong>{selectedApp.primary_license || "—"}</strong></div>
                                    <div className="avd-ledger-row"><span>NPI Number</span><strong>{selectedApp.npi || "—"}</strong></div>
                                    <div className="avd-ledger-row"><span>Basic Certifications</span><strong>{selectedApp.basic_certs || "—"}</strong></div>
                                    <div className="avd-ledger-row"><span>Specialty Certifications</span><strong>{selectedApp.specialty_certs || "—"}</strong></div>
                                </div>
                            </div>

                            {/* Section 5: Experience & Modalities */}
                            <div className="avd-modal-section">
                                <div className="avd-section-heading">Clinical Experience &amp; Competencies</div>
                                <div className="avd-ledger-row-block"><span>Education History</span><strong>{selectedApp.education_history || "—"}</strong></div>
                                <div className="avd-grid-2" style={{ marginTop: '8px' }}>
                                    <div className="avd-ledger-row"><span>EMR Experience</span><strong>{selectedApp.emr_experience || "—"}</strong></div>
                                    <div className="avd-ledger-row"><span>Languages Spoken</span><strong>{selectedApp.languages || "—"}</strong></div>
                                    <div className="avd-ledger-row"><span>Therapeutic Modalities</span><strong>{selectedApp.therapeutic_modalities || "—"}</strong></div>
                                </div>
                            </div>

                            {/* Section 6: Employment History */}
                            {safeParseArray(selectedApp.employment_history).length > 0 && (
                                <div className="avd-modal-section">
                                    <div className="avd-section-heading">Employment History</div>
                                    {safeParseArray(selectedApp.employment_history).map((entry, i) => (
                                        <div key={i} className="avd-entry-card">
                                            {Object.entries(entry)
                                                .filter(([, v]) => v !== "" && v != null)
                                                .map(([k, v]) => (
                                                    <div key={k} className="avd-ledger-row">
                                                        <span>{labelize(k)}</span>
                                                        <strong>{String(v)}</strong>
                                                    </div>
                                                ))}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Section 7: Professional References */}
                            {safeParseArray(selectedApp.professional_references).length > 0 && (
                                <div className="avd-modal-section">
                                    <div className="avd-section-heading">Professional References</div>
                                    {safeParseArray(selectedApp.professional_references).map((entry, i) => (
                                        <div key={i} className="avd-entry-card">
                                            {Object.entries(entry)
                                                .filter(([, v]) => v !== "" && v != null)
                                                .map(([k, v]) => (
                                                    <div key={k} className="avd-ledger-row">
                                                        <span>{labelize(k)}</span>
                                                        <strong>{String(v)}</strong>
                                                    </div>
                                                ))}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Section 8: Compliance & Background Disclosures */}
                            <div className="avd-modal-section">
                                <div className="avd-section-heading">Compliance &amp; Background Declarations</div>
                                <div className="avd-grid-2">
                                    <div className="avd-ledger-row"><span>Malpractice History</span><strong>{selectedApp.malpractice_history || "None disclosed"}</strong></div>
                                    <div className="avd-ledger-row"><span>License Suspension</span><span className={`avd-yn ${selectedApp.license_suspension ? "avd-yn-warn" : "avd-yn-ok"}`}>{selectedApp.license_suspension ? "Yes" : "No"}</span></div>
                                    <div className="avd-ledger-row"><span>Criminal Record</span><span className={`avd-yn ${selectedApp.criminal_record ? "avd-yn-warn" : "avd-yn-ok"}`}>{selectedApp.criminal_record ? "Yes" : "No"}</span></div>
                                    <div className="avd-ledger-row"><span>OIG / Exclusion List</span><span className={`avd-yn ${selectedApp.oig_exclusion ? "avd-yn-warn" : "avd-yn-ok"}`}>{selectedApp.oig_exclusion ? "Yes" : "No"}</span></div>
                                    <div className="avd-ledger-row"><span>Immunization Proof</span><span className={`avd-yn ${selectedApp.immunization_proof ? "avd-yn-ok" : "avd-yn-warn"}`}>{selectedApp.immunization_proof ? "Yes" : "No"}</span></div>
                                    <div className="avd-ledger-row"><span>Truthfulness Attestation</span><span className={`avd-yn ${selectedApp.truthfulness_attestation ? "avd-yn-ok" : "avd-yn-warn"}`}>{selectedApp.truthfulness_attestation ? "Yes" : "No"}</span></div>
                                </div>
                            </div>

                            {/* Section 9: Uploaded Document Attachment */}
                            {selectedApp.document_url && (
                                <div className="avd-modal-section" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                                    <div className="avd-section-heading">Uploaded Credential Document</div>
                                    <a
                                        href={`${SERVER_BASE_URL}${selectedApp.document_url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="avd-doc-link"
                                    >
                                        <FileText size={16} />
                                        View / Download Official Uploaded Document
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Modal Action Buttons Footer */}
                        <div className="avd-modal-footer-actions">
                            {inlineAction.type === 'approve' && (
                                <div className="avd-inline-confirm-box avd-inline-approve">
                                    <div className="avd-inline-text">
                                        <strong>Approve Application?</strong>
                                        <p>This will upgrade <strong>{selectedApp.display_name}</strong> to Therapist and generate their login credentials.</p>
                                    </div>
                                    <div className="avd-inline-btns">
                                        <button
                                            type="button"
                                            className="avd-btn avd-btn-confirm-act"
                                            onClick={() => executeApplicationAction('approve', selectedApp.id)}
                                            disabled={actionProcessing}
                                        >
                                            <CheckCircle2 size={15} />
                                            {actionProcessing ? 'Approving...' : 'Yes, Confirm Approval'}
                                        </button>
                                        <button
                                            type="button"
                                            className="avd-btn avd-btn-cancel-act"
                                            onClick={() => setInlineAction({ type: null })}
                                            disabled={actionProcessing}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {inlineAction.type === 'reject' && (
                                <div className="avd-inline-confirm-box avd-inline-reject">
                                    <div className="avd-inline-text">
                                        <strong>Reject Application?</strong>
                                        <p>Are you sure you want to reject the application of <strong>{selectedApp.display_name}</strong>?</p>
                                    </div>
                                    <div className="avd-inline-btns">
                                        <button
                                            type="button"
                                            className="avd-btn avd-btn-reject-act"
                                            onClick={() => executeApplicationAction('reject', selectedApp.id)}
                                            disabled={actionProcessing}
                                        >
                                            <XCircle size={15} />
                                            {actionProcessing ? 'Rejecting...' : 'Yes, Confirm Rejection'}
                                        </button>
                                        <button
                                            type="button"
                                            className="avd-btn avd-btn-cancel-act"
                                            onClick={() => setInlineAction({ type: null })}
                                            disabled={actionProcessing}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {inlineAction.type === 'viva' && (
                                <div className="avd-inline-confirm-box avd-inline-viva">
                                    <div className="avd-inline-text">
                                        <strong>Schedule Viva / Examination</strong>
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                                            <label style={{ fontSize: '12px', fontWeight: '600' }}>
                                                Date &amp; Time:
                                                <input
                                                    type="datetime-local"
                                                    className="as-input"
                                                    style={{ padding: '6px 10px', fontSize: '12px', marginTop: '2px', display: 'block' }}
                                                    value={inlineVivaDate}
                                                    onChange={(e) => setInlineVivaDate(e.target.value)}
                                                />
                                            </label>
                                            <label style={{ fontSize: '12px', fontWeight: '600', flex: 1, minWidth: '160px' }}>
                                                Notes (optional):
                                                <input
                                                    type="text"
                                                    className="as-input"
                                                    placeholder="e.g. Bring official degree documents"
                                                    style={{ padding: '6px 10px', fontSize: '12px', marginTop: '2px', display: 'block', width: '100%' }}
                                                    value={inlineVivaNotes}
                                                    onChange={(e) => setInlineVivaNotes(e.target.value)}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                    <div className="avd-inline-btns" style={{ marginTop: '10px' }}>
                                        <button
                                            type="button"
                                            className="avd-btn avd-btn-viva-act"
                                            onClick={() => executeScheduleViva(selectedApp.id)}
                                            disabled={!inlineVivaDate || actionProcessing}
                                        >
                                            <CalendarClock size={15} />
                                            {actionProcessing ? 'Scheduling...' : 'Confirm Viva Schedule'}
                                        </button>
                                        <button
                                            type="button"
                                            className="avd-btn avd-btn-cancel-act"
                                            onClick={() => setInlineAction({ type: null })}
                                            disabled={actionProcessing}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!inlineAction.type && (
                                <>
                                    {(selectedApp.status === "pending" || selectedApp.status === "under_review") ? (
                                        <>
                                            <button
                                                type="button"
                                                className="avd-btn avd-btn-approve"
                                                onClick={() => setInlineAction({ type: 'approve' })}
                                            >
                                                <CheckCircle2 size={16} />
                                                Approve &amp; Upgrade Role
                                            </button>
                                            <button
                                                type="button"
                                                className="avd-btn avd-btn-viva"
                                                onClick={() => setInlineAction({ type: 'viva' })}
                                            >
                                                <CalendarClock size={16} />
                                                Schedule Viva
                                            </button>
                                            <button
                                                type="button"
                                                className="avd-btn avd-btn-reject"
                                                onClick={() => setInlineAction({ type: 'reject' })}
                                            >
                                                <XCircle size={16} />
                                                Reject Application
                                            </button>
                                        </>
                                    ) : (
                                        <div className="avd-decided-note">
                                            Application marked as <strong>{(STATUS_META[selectedApp.status] || STATUS_META.pending).label}</strong>.
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        className="avd-btn avd-btn-cancel"
                                        onClick={() => setSelectedApp(null)}
                                    >
                                        Close View
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
        </AdminLayout>
    );
};

export default AdminVerificationDashboard;
