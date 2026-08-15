import { useState, useEffect } from 'react';
import { ClipboardList, AlertTriangle, Users } from 'lucide-react';
import { getMyCaseload } from '../../services/api';
import './ActiveCaseload.css';

const adherenceClass = (rate) => {
    if (rate === null) return 'neutral';
    return rate >= 75 ? 'success' : rate >= 40 ? 'warning' : 'danger';
};

const formatDate = (dateStr) => {
    if (!dateStr) return 'No sessions yet';
    return new Date(dateStr).toLocaleDateString([], { dateStyle: 'medium' });
};

const ActiveCaseload = () => {
    const [caseload, setCaseload] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await getMyCaseload();
                setCaseload(Array.isArray(data) ? data : []);
                setError('');
            } catch (err) {
                console.error('Failed to load caseload', err);
                setError(err.response?.data?.message || 'Could not load your caseload.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const redFlags = caseload.filter((c) => c.adherence_rate !== null && c.adherence_rate < 40);

    return (
        <div className="cl-container">
            <header className="cl-header">
                <div className="cl-header-icon"><ClipboardList size={22} /></div>
                <div>
                    <h1>My Patients</h1>
                    <p>See how each patient is keeping up with their daily care plan.</p>
                </div>
            </header>

            {error && <div className="cl-alert">{error}</div>}

            {redFlags.length > 0 && (
                <div className="cl-redflag-banner">
                    <AlertTriangle size={16} />
                    <span>
                        {redFlags.length} patient{redFlags.length > 1 ? 's' : ''} may need a check-in this week.
                    </span>
                </div>
            )}

            {loading ? (
                <p className="cl-state-msg">Loading caseload...</p>
            ) : caseload.length === 0 ? (
                <div className="cl-empty">
                    <Users size={28} />
                    <p>No patients yet. Once someone books a session with you, they'll show up here.</p>
                </div>
            ) : (
                <div className="cl-table-wrap">
                    <table className="cl-table">
                        <thead>
                            <tr>
                                <th>Patient</th>
                                <th>Sessions</th>
                                <th>Last Session</th>
                                <th>Care Plan Items</th>
                                <th>This Week's Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            {caseload.map((c) => {
                                const level = adherenceClass(c.adherence_rate);
                                return (
                                    <tr key={c.patient_id} className={level === 'danger' ? 'cl-row-flagged' : ''}>
                                        <td>
                                            <div className="cl-patient-cell">
                                                <span className="cl-patient-name">{c.patient_name}</span>
                                                <span className="cl-patient-email">{c.email}</span>
                                            </div>
                                        </td>
                                        <td>{c.total_sessions}</td>
                                        <td>{formatDate(c.last_session_date)}</td>
                                        <td>{c.active_items}</td>
                                        <td>
                                            {c.adherence_rate === null ? (
                                                <span className="cl-no-plan">No care plan yet</span>
                                            ) : (
                                                <div className="cl-adherence-cell">
                                                    <div className="cl-progress-bar">
                                                        <div
                                                            className={`cl-bar-fill fill-${level}`}
                                                            style={{ width: `${c.adherence_rate}%` }}
                                                        />
                                                    </div>
                                                    <span className={`cl-percent text-${level}`}>{c.adherence_rate}%</span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ActiveCaseload;
