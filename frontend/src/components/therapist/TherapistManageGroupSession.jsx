import { useState, useEffect } from "react";
import {
    Users,
    Calendar,
    CheckCircle2,
    XCircle,
    FileText,
    Clock,
    UserCheck,
    UserX,
    Save,
    AlertCircle
} from "lucide-react";
import {
    therapistGetMyProposals,
    therapistGetEnrolledPatients,
    therapistMarkAttendance,
    therapistWriteSessionNotes
} from "../../services/api";
import "./TherapistManageGroupSession.css";

const STATUS_META = {
    requested: { label: "Requested", className: "tms-status-requested" },
    confirmed: { label: "Confirmed", className: "tms-status-confirmed" },
    attended: { label: "Attended", className: "tms-status-attended" },
    absent: { label: "Absent", className: "tms-status-absent" }
};

const TherapistManageGroupSession = () => {
    const [sessions, setSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [selectedSession, setSelectedSession] = useState(null);

    const [enrolled, setEnrolled] = useState([]);
    const [loadingEnrolled, setLoadingEnrolled] = useState(false);
    const [markingId, setMarkingId] = useState(null);

    const [notes, setNotes] = useState("");
    const [savingNotes, setSavingNotes] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [editingLockedNotes, setEditingLockedNotes] = useState(false);

    const fetchSessions = async () => {
        setLoadingSessions(true);
        try {
            const data = await therapistGetMyProposals();
            const approvedOnly = (Array.isArray(data) ? data : []).filter(
                (s) => s.status === "approved" || s.status === "completed"
            );
            setSessions(approvedOnly);
        } catch (err) {
            console.error("Failed to fetch sessions", err);
            setSessions([]);
        } finally {
            setLoadingSessions(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const openSession = async (session) => {
        setSelectedSession(session);
        setNotes(session.session_notes || "");
        setEditingLockedNotes(false);
        setLoadingEnrolled(true);
        try {
            const data = await therapistGetEnrolledPatients(session.id);
            setEnrolled(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch enrolled patients", err);
            setEnrolled([]);
        } finally {
            setLoadingEnrolled(false);
        }
    };

    const handleMarkAttendance = async (enrollmentId, attended) => {
        setMarkingId(enrollmentId);
        try {
            await therapistMarkAttendance(enrollmentId, attended);
            setEnrolled((prev) =>
                prev.map((p) =>
                    p.enrollment_id === enrollmentId
                        ? { ...p, status: attended ? "attended" : "absent" }
                        : p
                )
            );
        } catch (err) {
            console.error("Failed to mark attendance", err);
        } finally {
            setMarkingId(null);
        }
    };

    const handleSaveNotes = async () => {
        if (!notes.trim() || !selectedSession) return;
        setSavingNotes(true);
        setMessage({ text: "", type: "" });
        try {
            const res = await therapistWriteSessionNotes(selectedSession.id, notes);
            setMessage({ text: res.message || "Session notes saved.", type: "success" });
            fetchSessions();
            setSelectedSession((prev) => prev && { ...prev, status: "completed" });
            setEditingLockedNotes(false);
        } catch (err) {
            console.error("Failed to save notes", err);
            setMessage({
                text: err.response?.data?.message || "Failed to save notes. Try again.",
                type: "error"
            });
        } finally {
            setSavingNotes(false);
            setTimeout(() => setMessage({ text: "", type: "" }), 4000);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
    };

    const initials = (name) => {
        if (!name) return "?";
        const parts = name.trim().split(" ");
        return (parts[0]?.[0] || "").concat(parts[1]?.[0] || "").toUpperCase();
    };

    return (
        <div className="tms-container">
            <header className="tms-header">
                <div>
                    <h1>Manage Group Sessions</h1>
                    <p>View enrolled patients, mark attendance, and write shared session notes.</p>
                </div>
            </header>

            {message.text && (
                <div className={`tms-alert ${message.type === "success" ? "tms-alert-success" : "tms-alert-error"}`}>
                    {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span>{message.text}</span>
                </div>
            )}

            <div className="tms-grid">
                {/* Session list */}
                <section className="tms-card tms-list-card">
                    <div className="tms-card-title">
                        <Calendar size={20} />
                        <h2>Your Approved Sessions</h2>
                    </div>

                    {loadingSessions ? (
                        <p className="tms-state-msg">Loading sessions...</p>
                    ) : sessions.length === 0 ? (
                        <p className="tms-state-msg">
                            No approved sessions yet. Once admin approves a proposal, it will appear here.
                        </p>
                    ) : (
                        <div className="tms-session-list">
                            {sessions.map((session) => (
                                <button
                                    key={session.id}
                                    type="button"
                                    className={`tms-session-item ${selectedSession?.id === session.id ? "tms-session-item-active" : ""}`}
                                    onClick={() => openSession(session)}
                                >
                                    <div className="tms-session-item-top">
                                        <span className="tms-session-title">{session.title}</span>
                                        {session.status === "completed" && (
                                            <span className="tms-completed-pill">
                                                <CheckCircle2 size={12} /> Completed
                                            </span>
                                        )}
                                    </div>
                                    <span className="tms-session-sub">
                                        <Clock size={12} /> {formatDate(session.start_time)}
                                    </span>
                                    <span className="tms-session-sub">
                                        <Users size={12} /> {session.enrolled_count || 0} / {session.max_participants} enrolled
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                {/* Detail panel */}
                {selectedSession && (
                    <section className="tms-card tms-detail-card">
                        <div className="tms-card-title">
                            <Users size={20} />
                            <h2>{selectedSession.title}</h2>
                        </div>
                        <p className="tms-detail-sub">
                            <Clock size={13} /> {formatDate(selectedSession.start_time)}
                        </p>

                        <div className="tms-section-label">Enrolled Patients</div>

                        {loadingEnrolled ? (
                            <p className="tms-state-msg">Loading enrolled patients...</p>
                        ) : enrolled.length === 0 ? (
                            <p className="tms-state-msg">No patients have joined this session yet.</p>
                        ) : (
                            <div className="tms-patient-list">
                                {enrolled.map((p) => {
                                    const status = STATUS_META[p.status] || STATUS_META.requested;
                                    return (
                                        <div key={p.enrollment_id} className="tms-patient-row">
                                            <div className="tms-patient-info">
                                                <span className="tms-avatar">{initials(p.display_name)}</span>
                                                <div>
                                                    <div className="tms-patient-name">{p.display_name}</div>
                                                    <div className="tms-patient-email">{p.email}</div>
                                                </div>
                                            </div>

                                            <div className="tms-patient-actions">
                                                <span className={`tms-status ${status.className}`}>
                                                    {status.label}
                                                </span>
                                                <button
                                                    type="button"
                                                    className="tms-attend-btn tms-attend-present"
                                                    disabled={markingId === p.enrollment_id}
                                                    onClick={() => handleMarkAttendance(p.enrollment_id, true)}
                                                    title="Mark present"
                                                >
                                                    <UserCheck size={15} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="tms-attend-btn tms-attend-absent"
                                                    disabled={markingId === p.enrollment_id}
                                                    onClick={() => handleMarkAttendance(p.enrollment_id, false)}
                                                    title="Mark absent"
                                                >
                                                    <UserX size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="tms-section-label">
                            <FileText size={14} /> Shared Session Notes
                        </div>

                        {selectedSession.status === "completed" && !editingLockedNotes ? (
                            <>
                                <p className="tms-notes-hint">
                                    This session is completed and its notes are locked.
                                </p>
                                <textarea
                                    className="tms-notes-textarea"
                                    rows="5"
                                    value={notes}
                                    disabled
                                />
                                <button
                                    type="button"
                                    className="tms-btn-save"
                                    onClick={() => setEditingLockedNotes(true)}
                                >
                                    <FileText size={16} />
                                    Edit Notes
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="tms-notes-hint">
                                    One shared note for the whole group — not per patient. Saving marks this session as completed.
                                </p>
                                <textarea
                                    className="tms-notes-textarea"
                                    rows="5"
                                    placeholder="Summarize what was covered, group progress, and any follow-ups..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="tms-btn-save"
                                    disabled={savingNotes || !notes.trim()}
                                    onClick={handleSaveNotes}
                                >
                                    <Save size={16} />
                                    {savingNotes ? "Saving..." : "Save Notes & Mark Completed"}
                                </button>
                            </>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
};

export default TherapistManageGroupSession;