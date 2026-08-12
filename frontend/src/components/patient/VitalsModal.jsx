import React from 'react';
import { X, ChevronLeft, ChevronRight, Sliders, Search, ArrowRight, Star } from 'lucide-react';

export default function VitalsModal({
  showVitalsModal,
  closeVitalsModal,
  vitalsStep,
  setVitalsStep,
  vitalsData,
  toggleConcern,
  setVitalsField,
  isVitalsStepValid,
  goVitalsNext,
  goVitalsBack,
  handleFindWithAI,
  handleSearchManually,
  aiMatches,
  openBookingModal,
  TOTAL_VITALS_QUESTION_STEPS,
  CONCERN_OPTIONS,
  DURATION_OPTIONS,
  SEVERITY_OPTIONS,
  GENDER_PREF_OPTIONS,
  LANGUAGE_PREF_OPTIONS,
  FORMAT_PREF_OPTIONS
}) {
  if (!showVitalsModal) return null;

  return (
    <div className="edit-modal-overlay" onClick={closeVitalsModal}>
      <div className="edit-modal-box vitals-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="tasks-modal-header">
          <span className="vitals-header-tag">Vitals Check (Initial Assessment)</span>
          <button className="tasks-modal-close-btn" onClick={closeVitalsModal}>
            <X size={20} />
          </button>
        </div>

        {/* Progress bar across question steps */}
        {vitalsStep < TOTAL_VITALS_QUESTION_STEPS && (
          <div className="vitals-progress-wrap">
            <div className="vitals-progress-track">
              <div
                className="vitals-progress-fill"
                style={{ width: `${((vitalsStep + 1) / TOTAL_VITALS_QUESTION_STEPS) * 100}%` }}
              />
            </div>
            <span className="vitals-progress-label">Step {vitalsStep + 1} of {TOTAL_VITALS_QUESTION_STEPS}</span>
          </div>
        )}

        {/* STEP 0: Concerns checklist */}
        {vitalsStep === 0 && (
          <div className="vitals-step">
            <h2 className="edit-modal-title">What mental health struggles are you experiencing?</h2>
            <p className="vitals-step-subtitle">Select all that apply — this helps us match you with a therapist who specializes in your needs.</p>
            <div className="vitals-chip-grid">
              {CONCERN_OPTIONS.map((c) => {
                const isSelected = vitalsData.concerns.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    className={`vitals-chip ${isSelected ? 'vitals-chip-selected' : ''}`}
                    onClick={() => toggleConcern(c)}
                  >
                    {isSelected ? '✓ ' : '+ '}{c}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 1: Duration */}
        {vitalsStep === 1 && (
          <div className="vitals-step">
            <h2 className="edit-modal-title">How long have you been feeling this way?</h2>
            <div className="vitals-option-list">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`vitals-option-row ${vitalsData.duration === opt ? 'vitals-option-selected' : ''}`}
                  onClick={() => setVitalsField('duration', opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Severity */}
        {vitalsStep === 2 && (
          <div className="vitals-step">
            <h2 className="edit-modal-title">How severely is this impacting your daily life?</h2>
            <div className="vitals-option-list">
              {SEVERITY_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`vitals-option-row ${vitalsData.severity === opt ? 'vitals-option-selected' : ''}`}
                  onClick={() => setVitalsField('severity', opt)}
                >
                  {opt}
                </button>
              ))}
            </div>

            {vitalsData.severity.startsWith("In crisis") && (
              <div className="vitals-crisis-notice">
                <p><strong>🚨 If you are in immediate danger or need urgent help:</strong> Please contact emergency services (999 in Bangladesh) or a national crisis helpline immediately. This platform is not designed for active crisis intervention.</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Gender & Language preferences */}
        {vitalsStep === 3 && (
          <div className="vitals-step">
            <h2 className="edit-modal-title">Do you have therapist preferences?</h2>
            <p className="vitals-step-subtitle">Preferred therapist gender</p>
            <div className="vitals-option-list" style={{ marginBottom: 16 }}>
              {GENDER_PREF_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`vitals-option-row ${vitalsData.genderPref === opt ? 'vitals-option-selected' : ''}`}
                  onClick={() => setVitalsField('genderPref', opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
            <p className="vitals-step-subtitle vitals-step-subtitle-spaced">Preferred language</p>
            <div className="vitals-option-list">
              {LANGUAGE_PREF_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`vitals-option-row ${vitalsData.languagePref === opt ? 'vitals-option-selected' : ''}`}
                  onClick={() => setVitalsField('languagePref', opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Session format */}
        {vitalsStep === 4 && (
          <div className="vitals-step">
            <h2 className="edit-modal-title">How would you like to attend sessions?</h2>
            <div className="vitals-option-list">
              {FORMAT_PREF_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`vitals-option-row ${vitalsData.formatPref === opt ? 'vitals-option-selected' : ''}`}
                  onClick={() => setVitalsField('formatPref', opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: Optional notes */}
        {vitalsStep === 5 && (
          <div className="vitals-step">
            <h2 className="edit-modal-title">Anything else you'd like your therapist to know?</h2>
            <p className="vitals-step-subtitle">Optional — this stays between you and your matched therapist.</p>
            <textarea
              className="vitals-notes-textarea"
              rows={5}
              placeholder="Share anything that feels relevant..."
              value={vitalsData.notes}
              onChange={(e) => setVitalsField('notes', e.target.value)}
            />
          </div>
        )}

        {/* Back / Next controls for the question steps */}
        {vitalsStep < TOTAL_VITALS_QUESTION_STEPS && (
          <div className="edit-modal-actions vitals-nav-actions">
            {vitalsStep > 0 ? (
              <button className="edit-modal-cancel-btn" onClick={goVitalsBack}>
                <ChevronLeft size={16} /> Back
              </button>
            ) : (
              <button className="edit-modal-cancel-btn" onClick={closeVitalsModal}>Cancel</button>
            )}
            <button
              className="edit-modal-save-btn"
              onClick={goVitalsNext}
              disabled={!isVitalsStepValid()}
            >
              {vitalsStep === TOTAL_VITALS_QUESTION_STEPS - 1 ? "Finish" : "Next"} <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 6: Choice — AI matching vs manual search */}
        {vitalsStep === 6 && (
          <div className="vitals-step">
            <h2 className="edit-modal-title">Thanks — we've got what we need.</h2>
            <p className="vitals-step-subtitle">How would you like to find your therapist?</p>

            <button className="vitals-choice-card vitals-choice-ai" onClick={handleFindWithAI}>
              <Sliders size={24} className="text-blue" />
              <div>
                <h3>Let AI Find My Matches</h3>
                <p>Get an instant top-3 shortlist based on your answers.</p>
              </div>
              <ArrowRight size={18} className="text-blue" />
            </button>

            <button className="vitals-choice-card vitals-choice-manual" onClick={handleSearchManually}>
              <Search size={24} className="text-slate" />
              <div>
                <h3>Browse Therapists Myself</h3>
                <p>Explore the full directory and filter on your own.</p>
              </div>
              <ArrowRight size={18} className="text-slate" />
            </button>

            <button className="edit-modal-cancel-btn vitals-back-link" onClick={goVitalsBack}>
              <ChevronLeft size={16} /> Back to notes
            </button>
          </div>
        )}

        {/* STEP 7: AI match results */}
        {vitalsStep === 7 && (
          <div className="vitals-step">
            <h2 className="edit-modal-title">Your Top 3 Matches</h2>
            <p className="vitals-step-subtitle">Based on your answers — this is a demo scoring model, not a clinical recommendation.</p>

            <div className="vitals-results-list">
              {aiMatches.map((t) => (
                <div key={t.id} className="vitals-match-card">
                  <div className="vitals-match-header">
                    <h3>{t.name}</h3>
                    <span className="vitals-match-rating"><Star size={14} fill="#f59e0b" color="#f59e0b" /> {t.rating}</span>
                  </div>
                  <p className="vitals-match-bio">{t.bio}</p>
                  <div className="vitals-match-tags">
                    {t.specialties.map((s) => <span key={s} className="vitals-match-tag">{s}</span>)}
                  </div>
                  <button className="vitals-request-btn" onClick={() => openBookingModal(t)}>
                    Request Session
                  </button>
                </div>
              ))}
            </div>

            <button className="edit-modal-cancel-btn vitals-back-link" onClick={() => setVitalsStep(6)}>
              <ChevronLeft size={16} /> Back to options
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
