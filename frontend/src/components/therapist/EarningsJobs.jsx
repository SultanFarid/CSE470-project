import { useState, useEffect } from 'react';
import { Briefcase, DollarSign, CheckCircle2, Clock, XCircle, Wallet, TrendingUp, ArrowDownCircle, ArrowUpCircle, Landmark } from 'lucide-react';
import { getMyEarnings, getMyWallet, redeemWallet } from '../../services/api';
import './EarningsJobs.css';

const monthLabel = (ym) => {
    const [y, m] = ym.split('-');
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString([], { month: 'short', year: '2-digit' });
};

const emptyRedeemForm = { amount: '', accountHolderName: '', bankName: '', accountNumber: '', branchName: '' };

const EarningsJobs = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [wallet, setWallet] = useState(null);
    const [walletLoading, setWalletLoading] = useState(true);
    const [showRedeemForm, setShowRedeemForm] = useState(false);
    const [redeemForm, setRedeemForm] = useState(emptyRedeemForm);
    const [redeeming, setRedeeming] = useState(false);
    const [redeemMessage, setRedeemMessage] = useState({ text: '', type: '' });

    const loadWallet = async () => {
        setWalletLoading(true);
        try {
            const w = await getMyWallet();
            setWallet(w);
        } catch (err) {
            console.error('Failed to load wallet', err);
        } finally {
            setWalletLoading(false);
        }
    };

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
        loadWallet();
    }, []);

    const handleRedeemChange = (field, value) => setRedeemForm((prev) => ({ ...prev, [field]: value }));

    const handleRedeemSubmit = async (e) => {
        e.preventDefault();
        setRedeemMessage({ text: '', type: '' });

        const amount = Number(redeemForm.amount);
        if (!amount || amount <= 0) {
            setRedeemMessage({ text: 'Enter a valid amount.', type: 'error' });
            return;
        }
        if (wallet && amount > wallet.balance) {
            setRedeemMessage({ text: 'That amount is more than your available wallet balance.', type: 'error' });
            return;
        }
        if (!redeemForm.accountHolderName.trim() || !redeemForm.bankName.trim() || !redeemForm.accountNumber.trim()) {
            setRedeemMessage({ text: 'Account holder name, bank name, and account number are required.', type: 'error' });
            return;
        }

        setRedeeming(true);
        try {
            await redeemWallet({ amount, ...redeemForm });
            setRedeemMessage({ text: 'Redeemed successfully — funds are on their way to your bank.', type: 'success' });
            setRedeemForm(emptyRedeemForm);
            setShowRedeemForm(false);
            await loadWallet();
        } catch (err) {
            setRedeemMessage({ text: err.response?.data?.message || 'Could not process your redeem request.', type: 'error' });
        } finally {
            setRedeeming(false);
        }
    };

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
                            <span className="ej-stat-value">${data.totalRevenue.toLocaleString()}</span>
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
                        <div className="ej-stat-tile">
                            <span className="ej-stat-icon"><TrendingUp size={16} /></span>
                            <span className="ej-stat-label">Estimated Earnings</span>
                            <span className="ej-stat-value">${data.estimatedEarnings.toLocaleString()}</span>
                        </div>
                    </div>
                    <p className="ej-estimate-note">
                        Estimated Earnings is the fee total for your {data.confirmedSessions} confirmed, not-yet-completed session{data.confirmedSessions === 1 ? '' : 's'} — a forecast, not money in your wallet yet.
                    </p>

                    <div className="ej-month-card">
                        <h3>This Month</h3>
                        <div className="ej-month-row">
                            <span>${data.currentMonthRevenue.toLocaleString()} earned</span>
                            <span>{data.currentMonthSessions} completed session{data.currentMonthSessions === 1 ? '' : 's'}</span>
                        </div>
                    </div>

                    <div className="ej-wallet-card">
                        <div className="ej-wallet-header">
                            <div className="ej-wallet-balance-block">
                                <span className="ej-wallet-icon"><Wallet size={18} /></span>
                                <div>
                                    <span className="ej-wallet-label">Wallet Balance</span>
                                    <span className="ej-wallet-balance">
                                        {walletLoading ? '...' : `$${(wallet?.balance ?? 0).toLocaleString()}`}
                                    </span>
                                </div>
                            </div>
                            <button
                                className="ej-btn-redeem"
                                onClick={() => { setShowRedeemForm((v) => !v); setRedeemMessage({ text: '', type: '' }); }}
                                disabled={walletLoading || !wallet?.balance}
                            >
                                <Landmark size={14} /> Redeem Earnings
                            </button>
                        </div>

                        {redeemMessage.text && (
                            <p className={`ej-redeem-msg ej-redeem-msg-${redeemMessage.type}`}>{redeemMessage.text}</p>
                        )}

                        {showRedeemForm && (
                            <form className="ej-redeem-form" onSubmit={handleRedeemSubmit}>
                                <div className="ej-redeem-row">
                                    <label>Amount to redeem ($)</label>
                                    <input
                                        type="number" min="1" step="0.01"
                                        placeholder={`Up to $${(wallet?.balance ?? 0).toLocaleString()}`}
                                        value={redeemForm.amount}
                                        onChange={(e) => handleRedeemChange('amount', e.target.value)}
                                    />
                                </div>
                                <div className="ej-redeem-row">
                                    <label>Account holder name</label>
                                    <input
                                        type="text"
                                        value={redeemForm.accountHolderName}
                                        onChange={(e) => handleRedeemChange('accountHolderName', e.target.value)}
                                    />
                                </div>
                                <div className="ej-redeem-row-split">
                                    <div className="ej-redeem-row">
                                        <label>Bank name</label>
                                        <input
                                            type="text"
                                            value={redeemForm.bankName}
                                            onChange={(e) => handleRedeemChange('bankName', e.target.value)}
                                        />
                                    </div>
                                    <div className="ej-redeem-row">
                                        <label>Branch (optional)</label>
                                        <input
                                            type="text"
                                            value={redeemForm.branchName}
                                            onChange={(e) => handleRedeemChange('branchName', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="ej-redeem-row">
                                    <label>Account number</label>
                                    <input
                                        type="text"
                                        value={redeemForm.accountNumber}
                                        onChange={(e) => handleRedeemChange('accountNumber', e.target.value)}
                                    />
                                </div>
                                <div className="ej-redeem-actions">
                                    <button type="submit" className="ej-btn-redeem-submit" disabled={redeeming}>
                                        {redeeming ? 'Processing...' : 'Confirm Redeem'}
                                    </button>
                                    <button type="button" className="ej-btn-redeem-cancel" onClick={() => setShowRedeemForm(false)} disabled={redeeming}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        {!walletLoading && wallet && (wallet.transactions.length > 0 || wallet.withdrawals.length > 0) && (
                            <div className="ej-wallet-history">
                                <h4>Recent Activity</h4>
                                <ul className="ej-tx-list">
                                    {wallet.transactions.slice(0, 8).map((tx) => (
                                        <li key={`tx-${tx.id}`} className="ej-tx-row">
                                            <span className={`ej-tx-icon ej-tx-${tx.type}`}>
                                                {tx.type === 'credit' ? <ArrowUpCircle size={15} /> : <ArrowDownCircle size={15} />}
                                            </span>
                                            <span className="ej-tx-desc">{tx.description}</span>
                                            <span className="ej-tx-date">{new Date(tx.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                            <span className={`ej-tx-amount ej-tx-${tx.type}`}>
                                                {tx.type === 'credit' ? '+' : '−'}${Number(tx.amount).toLocaleString()}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="ej-chart-card">
                        <h3>Earnings — Last 6 Months</h3>
                        {data.monthlyBreakdown.length === 0 ? (
                            <p className="ej-state-msg">No completed sessions yet in this window.</p>
                        ) : (
                            <div className="ej-bar-chart">
                                {data.monthlyBreakdown.map((m) => (
                                    <div className="ej-bar-col" key={m.month}>
                                        <div className="ej-bar-amount">${Number(m.revenue).toLocaleString()}</div>
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
