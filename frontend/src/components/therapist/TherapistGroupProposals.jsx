import { useState, useEffect } from "react";
import { 
    PlusCircle, 
    Calendar, 
    Users, 
    Tag, 
    FileText, 
    Clock, 
    CheckCircle2, 
    XCircle, 
    AlertCircle 
} from "lucide-react";
import { therapistProposeGroup, therapistGetMyProposals } from "../../services/api";
import "./TherapistGroupProposals.css";

const STATUS_META = {
    pending: { label: "Pending Approval", icon: Clock, className: "status-pending" },
    approved: { label: "Approved", icon: CheckCircle2, className: "status-approved" },
    rejected: { label: "Rejected", icon: XCircle, className: "status-rejected" }
};

const TherapistGroupProposals = () => {
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        start_time: "",
        max_participants: 10,
        description: ""
    });

    const fetchMyProposals = async () => {
        setLoading(true);
        try {
            const data = await therapistGetMyProposals();
            setProposals(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch proposals", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyProposals();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage({ text: "", type: "" });

        try {
            const res = await therapistProposeGroup(formData);
            setMessage({ 
                text: res.message || "Group session proposal submitted for Admin approval!", 
                type: "success" 
            });
            // Reset Form
            setFormData({
                title: "",
                start_time: "",
                max_participants: 10,
                description: ""
            });
            fetchMyProposals();
        } catch (err) {
            console.error("Failed to propose group session", err);
            setMessage({ 
                text: err.response?.data?.message || "Failed to submit proposal. Try again.", 
                type: "error" 
            });
        } finally {
            setSubmitting(false);
            setTimeout(() => setMessage({ text: "", type: "" }), 4000);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    };

    return (
        <div className="tgp-container">
            <header className="tgp-header">
                <div>
                    <h1>Group Session Proposals</h1>
                    <p>Propose new group therapy sessions and track your submitted proposals.</p>
                </div>
            </header>

            {message.text && (
                <div className={`tgp-alert ${message.type === "success" ? "tgp-alert-success" : "tgp-alert-error"}`}>
                    {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span>{message.text}</span>
                </div>
            )}

            <div className="tgp-grid">
                {/* Proposal Form Card */}
                <section className="tgp-card tgp-form-card">
                    <div className="tgp-card-title">
                        <PlusCircle size={20} />
                        <h2>Propose New Session</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="tgp-form">
                        <div className="tgp-field">
                            <label><Tag size={14} /> Session Title</label>
                            <input
                                type="text"
                                name="title"
                                required
                                placeholder="e.g. Mindfulness & Anxiety Support Group"
                                value={formData.title}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="tgp-field-group">
                            <div className="tgp-field">
                                <label><Calendar size={14} /> Date &amp; Time</label>
                                <input
                                    type="datetime-local"
                                    name="start_time"
                                    required
                                    value={formData.start_time}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="tgp-field">
                                <label><Users size={14} /> Capacity (Max Seats)</label>
                                <input
                                    type="number"
                                    name="max_participants"
                                    min="2"
                                    max="50"
                                    required
                                    value={formData.max_participants}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="tgp-field">
                            <label><FileText size={14} /> Session Description</label>
                            <textarea
                                name="description"
                                rows="3"
                                placeholder="Describe what patients can expect from this group session..."
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>

                        <button type="submit" className="tgp-btn-submit" disabled={submitting}>
                            {submitting ? "Submitting..." : "Submit Proposal for Approval"}
                        </button>
                    </form>
                </section>

                {/* Proposals History Card */}
                <section className="tgp-card tgp-list-card">
                    <div className="tgp-card-title">
                        <Clock size={20} />
                        <h2>My Proposals ({proposals.length})</h2>
                    </div>

                    {loading ? (
                        <p className="tgp-state-msg">Loading proposals...</p>
                    ) : proposals.length === 0 ? (
                        <p className="tgp-state-msg">You haven't submitted any group proposals yet.</p>
                    ) : (
                        <div className="tgp-list">
                            {proposals.map((item) => {
                                const status = STATUS_META[item.status] || STATUS_META.pending;
                                const StatusIcon = status.icon;

                                return (
                                    <div key={item.id} className="tgp-item">
                                        <div className="tgp-item-header">
                                            <h3>{item.title}</h3>
                                            <span className={`tgp-status ${status.className}`}>
                                                <StatusIcon size={14} />
                                                {status.label}
                                            </span>
                                        </div>

                                        <p className="tgp-item-sub">{formatDate(item.start_time)}</p>

                                        <div className="tgp-item-meta">
                                            <span><Users size={13} /> {item.max_participants} seats</span>
                                        </div>

                                        {item.status === "rejected" && item.rejection_reason && (
                                            <div className="tgp-rejection-note">
                                                <strong>Reason for Rejection:</strong> {item.rejection_reason}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default TherapistGroupProposals;