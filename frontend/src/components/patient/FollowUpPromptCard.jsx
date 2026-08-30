import React, { useState } from 'react';
import { CalendarClock, CheckCircle, XCircle } from 'lucide-react';
import { respondToFollowUp } from '../../services/api';
import './FollowUpPromptCard.css';

/**
 * Feature 12 extension — Follow-Up Accept/Decline Prompt Card
 *
 * Shown when the therapist has proposed a follow-up date in the
 * Prescription Builder and the patient hasn't responded yet. Accepting
 * notifies the therapist (handled server-side); declining just resolves
 * the prompt quietly.
 *
 * Props:
 *  pendingFollowUp — object returned by getPendingFollowUp()
 *  onResolved      — callback: (accepted: boolean) called after a response is saved
 */
export default function FollowUpPromptCard({ pendingFollowUp, onResolved }) {
    const [responding, setResponding] = useState(false);
    const [error, setError] = useState('');

    if (!pendingFollowUp) return null;

    const { prescription_id, doctor_name, follow_up_date, follow_up_notes } = pendingFollowUp;
    const formattedDate = follow_up_date
        ? new Date(follow_up_date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
        : null;

    const respond = async (accept) => {
        setResponding(true);
        setError('');
        try {
            await respondToFollowUp(prescription_id, accept);
            onResolved(accept);
        } catch (err) {
            setError('Could not save your response. Please try again.');
            setResponding(false);
        }
    };

    return (
        <div className="fupc-wrapper">
            <div className="fupc-card">
                <div className="fupc-header">
                    <div className="fupc-icon-wrap">
                        <CalendarClock size={18} />
                    </div>
                    <div className="fupc-header-text">
                        <span className="fupc-label">Follow-Up Suggested by Dr. {doctor_name}</span>
                        {formattedDate && <span className="fupc-sublabel">Proposed for {formattedDate}</span>}
                    </div>
                </div>

                {follow_up_notes && <p className="fupc-notes">"{follow_up_notes}"</p>}

                {error && <p className="fupc-error">{error}</p>}

                <div className="fupc-actions">
                    <button
                        className="fupc-btn-accept"
                        onClick={() => respond(true)}
                        disabled={responding}
                    >
                        <CheckCircle size={15} />
                        {responding ? 'Saving...' : 'Accept Follow-Up'}
                    </button>
                    <button
                        className="fupc-btn-decline"
                        onClick={() => respond(false)}
                        disabled={responding}
                    >
                        <XCircle size={15} />
                        Decline
                    </button>
                </div>
            </div>
        </div>
    );
}
