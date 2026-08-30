import { useState, useEffect } from 'react';
import { Briefcase, DollarSign, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { getMyEarnings } from '../../services/api';
import './EarningsJobs.css';

const monthLabel = (ym) => {
    const [y, m] = ym.split('-');
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString([], { month: 'short', year: '2-digit' });
};

const EarningsJobs = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const summary = await getMyEarnings();
                setData(summary);
                setError('');
            } catch (err) {
                console.error('Failed to load earnings', err);
                setError(err.response?.data?.message || 'Could not load your earnings.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const maxRevenue = data ? Math.max(1, ...data.monthlyBreakdown.map((m) => Number(m.revenue))) : 1;

    return (
        <div className="ej-container">
            <header className="ej-header">
                <div className="ej-header-icon"><Briefcase size={22} /></div>
                <div>
                    <h1>Earnings</h1>
                    <p>Track your session activity and income over time.</p>
                </div>
            </header>

            {error && <div className="ej-alert">{error}</div>}

            {loading ? (
                <p className="ej-state-msg">Loading earnings...</p>
            ) : data && (
                <>
                    <div className="ej-stats-grid">
                        <div className="ej-stat-tile">
                            <span className="ej-stat-icon"><DollarSign size={16} /></span>
                            <span className="ej-stat-label">Total Earned</span>
                            <span className="ej-stat-value">৳{data.totalRevenue.toLocaleString()}</span>
                        </div>
                        <div className="ej-stat-tile">
                            <span className="ej-stat-icon"><CheckCircle2 size={16} /></span>
                            <span className="ej-stat-label">Completed Sessions</span>
                            <span className="ej-stat-value">{data.completedSessions}</span>
                        </div>
                        <div className="ej-stat-tile">
                            <span className="ej-stat-icon"><Clock size={16} /></span>
                            <span className="ej-stat-label">Upcoming Sessions</span>
                            <span className="ej-stat-value">{data.upcomingSessions}</span>
                        </div>
                        <div className="ej-stat-tile">
                            <span className="ej-stat-icon"><XCircle size={16} /></span>
                            <span className="ej-stat-label">Cancelled</span>
                            <span className="ej-stat-value">{data.cancelledSessions}</span>
                        </div>
                    </div>

                    <div className="ej-month-card">
                        <h3>This Month</h3>
                        <div className="ej-month-row">
                            <span>৳{data.currentMonthRevenue.toLocaleString()} earned</span>
                            <span>{data.currentMonthSessions} completed session{data.currentMonthSessions === 1 ? '' : 's'}</span>
                        </div>
                    </div>

                    <div className="ej-chart-card">
                        <h3>Earnings — Last 6 Months</h3>
                        {data.monthlyBreakdown.length === 0 ? (
                            <p className="ej-state-msg">No completed sessions yet in this window.</p>
                        ) : (
                            <div className="ej-bar-chart">
                                {data.monthlyBreakdown.map((m) => (
                                    <div className="ej-bar-col" key={m.month}>
                                        <div className="ej-bar-amount">৳{Number(m.revenue).toLocaleString()}</div>
                                        <div className="ej-bar-track">
                                            <div
                                                className="ej-bar-fill"
                                                style={{ height: `${Math.max(4, (Number(m.revenue) / maxRevenue) * 100)}%` }}
                                            />
                                        </div>
                                        <div className="ej-bar-label">{monthLabel(m.month)}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default EarningsJobs;
