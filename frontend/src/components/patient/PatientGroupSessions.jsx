import { useState, useEffect, useMemo } from "react";
import { 
    Users, 
    Calendar, 
    DollarSign, 
    Search, 
    Tag, 
    User, 
    CheckCircle2, 
    AlertCircle,
    UserPlus
} from "lucide-react";
// 1. Correct Function Import
import { 
    patientGetOpenGroupSessions, 
    patientJoinGroupSession, 
    patientGetMyEnrollments 
} from '../../services/api';
import "./PatientGroupSessions.css";

const PatientGroupSessions = () => {
    const [sessions, setSessions] = useState([]);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [joiningId, setJoiningId] = useState(null);
    const [message, setMessage] = useState({ text: "", type: "" });

    const fetchSessions = async () => {
        setLoading(true);
        try {
            // 2. Fixed Function Call
            const data = await patientGetOpenGroupSessions();
            setSessions(Array.isArray(data) ? data : (data?.data || []));
        } catch (err) {
            console.error("Failed to fetch group sessions", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    // 3. Search Filter Handling both `topic` and `title`
    const filteredSessions = useMemo(() => {
        return sessions.filter((s) => {
            const title = s.topic || s.title || "";
            const therapist = s.therapist_name || "";

            const matchesSearch = 
                title.toLowerCase().includes(search.toLowerCase()) ||
                therapist.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = 
                categoryFilter === "all" || s.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [sessions, search, categoryFilter]);

    const handleJoin = async (sessionId) => {
        setJoiningId(sessionId);
        setMessage({ text: "", type: "" });
        try {
            const res = await patientJoinGroupSession(sessionId);
            setMessage({ 
                text: res.message || "Successfully sent join request for group session!", 
                type: "success" 
            });
            fetchSessions(); // Refresh list to update joined status
        } catch (err) {
            console.error("Failed to join session", err);
            setMessage({ 
                text: err.response?.data?.message || "Failed to join session. Please try again.", 
                type: "error" 
            });
        } finally {
            setJoiningId(null);
            setTimeout(() => setMessage({ text: "", type: "" }), 4000);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    };

    return (
        <div className="pgs-container">
            <header className="pgs-header">
                <div>
                    <h1>Explore Group Therapy Sessions</h1>
                    <p>Connect with peers and professional therapists in guided group recovery sessions.</p>
                </div>
            </header>

            {message.text && (
                <div className={`pgs-alert ${message.type === "success" ? "pgs-alert-success" : "pgs-alert-error"}`}>
                    {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Filter Bar */}
            <div className="pgs-toolbar">
                <div className="pgs-search">
                    <Search size={16} className="pgs-search-icon" />
                    <input
                        type="text"
                        placeholder="Search by topic or therapist..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <select 
                    className="pgs-select" 
                    value={categoryFilter} 
                    onChange={(e) => setCategoryFilter(e.target.value)}
                >
                    <option value="all">All Categories</option>
                    <option value="Anxiety & Stress">Anxiety &amp; Stress</option>
                    <option value="Depression Support">Depression Support</option>
                    <option value="Addiction Recovery">Addiction Recovery</option>
                    <option value="Trauma & Healing">Trauma &amp; Healing</option>
                    <option value="General Wellness">General Wellness</option>
                </select>
            </div>

            {/* Session Cards Grid */}
            {loading ? (
                <p className="pgs-state-msg">Loading available group sessions...</p>
            ) : filteredSessions.length === 0 ? (
                <p className="pgs-state-msg">No active group sessions available at the moment.</p>
            ) : (
                <div className="pgs-grid">
                    {filteredSessions.map((session) => {
                        const maxCapacity = session.capacity || session.max_participants || 0;
                        const enrolledCount = session.enrolled_count || 0;
                        const isFull = enrolledCount >= maxCapacity;
                        const isJoined = session.is_joined;

                        return (
                            <div key={session.id} className="pgs-card">
                                <div className="pgs-card-badge">
                                    <Tag size={12} />
                                    <span>{session.category || "General"}</span>
                                </div>

                                {/* 4. Display title safely */}
                                <h2 className="pgs-card-title">{session.topic || session.title || "Untitled Session"}</h2>
                                <p className="pgs-therapist">
                                    <User size={14} /> Guided by {session.therapist_name || "Therapist"}
                                </p>

                                <p className="pgs-desc">{session.description || "No detailed description provided."}</p>

                                <div className="pgs-meta">
                                    <div>
                                        <Calendar size={14} />
                                        {/* 5. Display date safely */}
                                        <span>{formatDate(session.scheduled_at || session.start_time)}</span>
                                    </div>
                                    <div>
                                        <Users size={14} />
                                        {/* 6. Display capacity safely */}
                                        <span>
                                            {enrolledCount} / {maxCapacity} Enrolled
                                        </span>
                                    </div>
                                    <div>
                                        <DollarSign size={14} />
                                        <span>{session.fee > 0 ? `$${session.fee}` : "Free"}</span>
                                    </div>
                                </div>

                                <div className="pgs-card-footer">
                                    {isJoined ? (
                                        <button className="pgs-btn pgs-btn-joined" disabled>
                                            <CheckCircle2 size={16} /> Joined
                                        </button>
                                    ) : isFull ? (
                                        <button className="pgs-btn pgs-btn-full" disabled>
                                            Session Full
                                        </button>
                                    ) : (
                                        <button
                                            className="pgs-btn pgs-btn-join"
                                            disabled={joiningId === session.id}
                                            onClick={() => handleJoin(session.id)}
                                        >
                                            <UserPlus size={16} />
                                            {joiningId === session.id ? "Joining..." : "Join Session"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PatientGroupSessions;