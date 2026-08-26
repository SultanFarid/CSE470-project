import React, { useState } from 'react';
import { Sparkles, CheckCircle, X, ChevronRight, Pill, Play } from 'lucide-react';
import { acceptCarePlan } from '../../services/api';
import './CarePlanPromptCard.css';

/**
 * Feature 6 — Care Plan Opt-In Prompt Card
 *
 * Shown inside the Daily Care Plan section when the therapist has written
 * new care plan tasks that the patient hasn't accepted yet. The patient can
 * click "Add to My Checklist" to accept, or "Not Now" to dismiss for this session.
 *
 * Props:
 *  pendingCarePlan  — object returned by getPendingCarePlan()
 *  onAccepted       — callback: (newTasks[]) called after successful acceptance
 *  onDismiss        — callback: () called when patient clicks "Not Now"
 */
export default function CarePlanPromptCard({ pendingCarePlan, onAccepted, onDismiss }) {
    const [accepting, setAccepting] = useState(false);
    const [error, setError] = useState('');

    if (!pendingCarePlan) return null;

    const { prescription_id, doctor_name, items = [] } = pendingCarePlan;
    const taskCount = items.length;

    const handleAccept = async () => {
        setAccepting(true);
        setError('');
        try {
            await acceptCarePlan(prescription_id);
            onAccepted(items);
        } catch (err) {
            setError('Could not add tasks. Please try again.');
            setAccepting(false);
        }
    };

    return (
        <div className="cppc-wrapper">
            <div className="cppc-card">
                {/* Header row */}
                <div className="cppc-header">
                    <div className="cppc-icon-wrap">
                        <Sparkles size={18} />
                    </div>
                    <div className="cppc-header-text">
                        <span className="cppc-label">New Care Plan from Dr. {doctor_name}</span>
                        <span className="cppc-sublabel">
                            {taskCount} task{taskCount !== 1 ? 's' : ''} ready to add to your daily checklist
                        </span>
                    </div>
                    <button
                        className="cppc-dismiss-btn"
                        onClick={onDismiss}
                        title="Dismiss for now"
                        aria-label="Dismiss"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Task preview */}
                <ul className="cppc-task-list">
                    {items.slice(0, 4).map((item) => (
                        <li key={item.id} className="cppc-task-item">
                            {item.item_type === 'medication' ? (
                                <Pill size={13} className="cppc-task-icon cppc-icon-med" />
                            ) : (
                                <Play size={13} className="cppc-task-icon cppc-icon-ex" />
                            )}
                            <span>{item.title}</span>
                        </li>
                    ))}
                    {items.length > 4 && (
                        <li className="cppc-task-more">
                            <ChevronRight size={13} />
                            <span>+{items.length - 4} more task{items.length - 4 !== 1 ? 's' : ''}</span>
                        </li>
                    )}
                </ul>

                {error && <p className="cppc-error">{error}</p>}

                {/* Action buttons */}
                <div className="cppc-actions">
                    <button
                        className="cppc-btn-accept"
                        onClick={handleAccept}
                        disabled={accepting}
                    >
                        <CheckCircle size={15} />
                        {accepting ? 'Adding...' : 'Yes, Add to My Checklist'}
                    </button>
                    <button
                        className="cppc-btn-later"
                        onClick={onDismiss}
                        disabled={accepting}
                    >
                        Not Now
                    </button>
                </div>
            </div>
        </div>
    );
}
