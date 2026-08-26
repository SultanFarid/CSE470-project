// Turns a patient_vitals row into a short paragraph a therapist can read in
// 15 seconds before a session starts (Feature 11).
//
// Uses the Gemini API (gemini-1.5-flash) when GEMINI_API_KEY is configured.
// Falls back to a deterministic, template-based summary when the key is
// missing or the API call fails — so the feature always works, even offline.

const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── Template fallback (kept so we always have something to show) ──────────

const SEVERITY_HINTS = {
    'Mild — manageable most days': 'mild and currently manageable',
    'Moderate — affecting my daily life': 'moderate, affecting daily life at times',
    'Severe — significantly impacting me': 'severe, affecting daily life most days',
};

const describeSeverity = (severity) => {
    if (!severity) return null;
    if (severity.startsWith('In crisis')) return 'CRISIS-LEVEL — the patient flagged this as a crisis during intake';
    for (const key of Object.keys(SEVERITY_HINTS)) {
        if (severity.startsWith(key.split(' — ')[0])) return SEVERITY_HINTS[key];
    }
    return severity.replace(/^([A-Za-z]+)\s*—.*/, '$1').toLowerCase();
};

const buildTemplateSummary = (vitals) => {
    if (!vitals) {
        return 'No intake questionnaire on file yet for this patient. Consider asking about their main concerns at the start of the session.';
    }

    const concerns = Array.isArray(vitals.concerns) ? vitals.concerns.filter(Boolean) : [];
    const parts = [];

    if (concerns.length > 0) {
        const list = concerns.length === 1
            ? concerns[0]
            : `${concerns.slice(0, -1).join(', ')} and ${concerns[concerns.length - 1]}`;
        parts.push(`Patient reported struggling with ${list}.`);
    } else {
        parts.push('Patient did not select specific concern categories during intake.');
    }

    if (vitals.duration) {
        parts.push(`They've been experiencing this for ${vitals.duration.toLowerCase()}.`);
    }

    const severityDesc = describeSeverity(vitals.severity);
    if (severityDesc) {
        if (severityDesc.startsWith('CRISIS')) {
            parts.push(`⚠ Self-reported severity: ${severityDesc}. Confirm the patient's current safety at the start of the session.`);
        } else {
            parts.push(`Self-reported severity: ${severityDesc}.`);
        }
    }

    if (vitals.format_pref) {
        parts.push(`Preferred session format: ${vitals.format_pref}.`);
    }

    if (vitals.notes && vitals.notes.trim()) {
        parts.push(`In their own words: "${vitals.notes.trim()}"`);
    }

    return parts.join(' ');
};

// ─── AI summary via Gemini ─────────────────────────────────────────────────

const buildAiSummary = async (vitals) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_key_here') {
        return null; // no key → fall through to template
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const concerns = Array.isArray(vitals.concerns) ? vitals.concerns.join(', ') : 'not specified';

        const prompt = `You are a professional clinical assistant helping therapists prepare for sessions. 
Write a concise, professional 2-3 sentence summary of this patient's mental health intake for a therapist to read quickly before their session.

Patient intake data:
- Main concerns: ${concerns}
- Duration of struggles: ${vitals.duration || 'not specified'}
- Self-reported severity: ${vitals.severity || 'not specified'}
- Session format preference: ${vitals.format_pref || 'no preference'}
- Patient's own words: "${vitals.notes && vitals.notes.trim() ? vitals.notes.trim() : 'none provided'}"

Important: If severity is "In crisis", begin with a ⚠ crisis alert sentence. Keep the tone clinical and empathetic. Do not add any heading or label.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        return text || null;
    } catch (err) {
        console.warn('[Gemini] AI summary failed, falling back to template:', err.message);
        return null;
    }
};

// ─── Main export ───────────────────────────────────────────────────────────

const buildSummary = async (vitals) => {
    if (!vitals) return buildTemplateSummary(null);

    const aiText = await buildAiSummary(vitals);
    if (aiText) return aiText;

    return buildTemplateSummary(vitals);
};

module.exports = { buildSummary };
