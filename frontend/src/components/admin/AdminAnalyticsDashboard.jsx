import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    BarChart2,
    FileCheck2,
    Users,
    Gavel,
    ShieldAlert,
    Settings,
    LogOut,
    HeartPulse,
    UserCircle2,
    Stethoscope,
    Wallet,
    CalendarCheck2
} from "lucide-react";
import { adminGetAnalytics } from "../../services/api";
import "./AdminAnalyticsDashboard.css";

// Sidebar items with a `path` navigate to their built page. Items without
// a `path` don't have routes/pages built yet in this project — they're
// kept as visual placeholders so the nav matches the approved design
// without linking anywhere broken.
const NAV_ITEMS = [
    { key: "analytics", label: "Platform Analytics", icon: BarChart2, path: "/admin/analytics" },
    { key: "verification", label: "Therapist Verification", icon: FileCheck2, path: "/admin/verification" },
    { key: "users", label: "User Management", icon: Users, path: "/admin/users" },
    { key: "approvals", label: "Group Approvals", icon: Gavel, path: "/admin/group-approvals" },
    { key: "logs", label: "Disciplinary Logs", icon: ShieldAlert, path: null },
    { key: "settings", label: "System Settings", icon: Settings, path: null }
];

const MONTH_LABELS = {
    "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
    "05": "May", "06": "Jun", "07": "Jul", "08": "Aug",
    "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec"
};

const AdminAnalyticsDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await adminGetAnalytics();
                setStats(data);
            } catch (err) {
                console.error("Failed to fetch analytics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const maxMonthCount = stats?.sessionsByMonth?.length
        ? Math.max(...stats.sessionsByMonth.map((m) => m.count))
        : 0;

    const confirmed = stats?.appointmentRatio?.confirmed || 0;
    const cancelled = stats?.appointmentRatio?.cancelled || 0;
    const totalAppointments = confirmed + cancelled;
    const confirmedPct = totalAppointments ? Math.round((confirmed / totalAppointments) * 100) : 0;
    const cancelledPct = 100 - confirmedPct;

    return (
        <div className="apa-shell">
            <aside className="apa-sidebar">
                <div className="apa-brand">
                    <div className="apa-brand-mark" />
                    <div>
                        <span className="apa-brand-name">Smart Recovery Portal</span>
                    </div>
                </div>

                <nav className="apa-nav">
                    {NAV_ITEMS.map(({ key, label, icon: Icon, path }) => {
                        const isCurrent = window.location.pathname === path;
                        return (
                            <button
                                key={key}
                                type="button"
                                className={`apa-nav-item ${isCurrent ? "apa-nav-item-active" : ""}`}
                                disabled={!path}
                                onClick={() => path && navigate(path)}
                                title={path ? label : `${label} (coming soon)`}
                                style={{ cursor: path ? "pointer" : "not-allowed" }}
                            >
                                <Icon size={18} />
                                <span>{label}</span>
                            </button>
                        );
                    })}
                </nav>

                <button type="button" className="apa-logout" onClick={handleLogout}>
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </aside>

            <div className="apa-main">
                <header className="apa-topbar">
                    <div className="apa-topbar-title">
                        <h1>Platform Analytics</h1>
                        <span className="apa-badge-pill">Aggregated Data Only</span>
                    </div>
                    <div className="apa-topbar-right">
                        <span className="apa-system-health">
                            <HeartPulse size={16} />
                            System Healthy
                        </span>
                        <span className="apa-admin-avatar">
                            <UserCircle2 size={28} />
                        </span>
                    </div>
                </header>

                {loading ? (
                    <p className="apa-loading">Loading analytics...</p>
                ) : !stats ? (
                    <p className="apa-empty">No analytics data available.</p>
                ) : (
                    <>
                        <div className="apa-stat-cards">
                            <div className="apa-stat-card">
                                <div className="apa-stat-icon apa-icon-patients">
                                    <Users size={22} />
                                </div>
                                <div>
                                    <div className="apa-stat-value">{stats.totalPatients}</div>
                                    <div className="apa-stat-label">Total Registered Patients</div>
                                </div>
                            </div>

                            <div className="apa-stat-card">
                                <div className="apa-stat-icon apa-icon-therapists">
                                    <Stethoscope size={22} />
                                </div>
                                <div>
                                    <div className="apa-stat-value">{stats.activeTherapists}</div>
                                    <div className="apa-stat-label">Total Active Therapists</div>
                                </div>
                            </div>

                            <div className="apa-stat-card">
                                <div className="apa-stat-icon apa-icon-sessions">
                                    <CalendarCheck2 size={22} />
                                </div>
                                <div>
                                    <div className="apa-stat-value">
                                        {stats.sessionsByMonth.reduce((sum, m) => sum + m.count, 0)}
                                    </div>
                                    <div className="apa-stat-label">Total Sessions Completed</div>
                                </div>
                            </div>

                            <div className="apa-stat-card">
                                <div className="apa-stat-icon apa-icon-revenue">
                                    <Wallet size={22} />
                                </div>
                                <div>
                                    <div className="apa-stat-value">
                                        ৳{Number(stats.totalRevenue).toLocaleString()}
                                    </div>
                                    <div className="apa-stat-label">Total Platform Revenue</div>
                                </div>
                            </div>
                        </div>

                        <div className="apa-panels">
                            <section className="apa-chart-panel">
                                <h2>Sessions Completed by Month</h2>
                                {stats.sessionsByMonth.length === 0 ? (
                                    <p className="apa-empty">No completed sessions yet.</p>
                                ) : (
                                    <div className="apa-bar-chart">
                                        {stats.sessionsByMonth.map((m) => {
                                            const [, monthNum] = m.month.split("-");
                                            const heightPct = maxMonthCount
                                                ? (m.count / maxMonthCount) * 100
                                                : 0;
                                            return (
                                                <div className="apa-bar-col" key={m.month}>
                                                    <div className="apa-bar-count">{m.count}</div>
                                                    <div className="apa-bar-track">
                                                        <div
                                                            className="apa-bar-fill"
                                                            style={{ height: `${heightPct}%` }}
                                                        />
                                                    </div>
                                                    <div className="apa-bar-label">
                                                        {MONTH_LABELS[monthNum] || monthNum}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>

                            <section className="apa-ratio-panel">
                                <h2>Confirmed vs Cancelled Appointments</h2>
                                {totalAppointments === 0 ? (
                                    <p className="apa-empty">No appointment data yet.</p>
                                ) : (
                                    <>
                                        <div className="apa-ratio-bar">
                                            <div
                                                className="apa-ratio-confirmed"
                                                style={{ width: `${confirmedPct}%` }}
                                            />
                                            <div
                                                className="apa-ratio-cancelled"
                                                style={{ width: `${cancelledPct}%` }}
                                            />
                                        </div>
                                        <div className="apa-ratio-legend">
                                            <div className="apa-ratio-legend-item">
                                                <span className="apa-dot apa-dot-confirmed" />
                                                Confirmed — {confirmed} ({confirmedPct}%)
                                            </div>
                                            <div className="apa-ratio-legend-item">
                                                <span className="apa-dot apa-dot-cancelled" />
                                                Cancelled — {cancelled} ({cancelledPct}%)
                                            </div>
                                        </div>
                                    </>
                                )}
                            </section>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminAnalyticsDashboard;