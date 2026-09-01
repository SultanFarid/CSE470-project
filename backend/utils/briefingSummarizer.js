// Turns a patient_vitals row into a comprehensive clinical briefing
// and evidence-based clinical suggestions (exercises, medications, tests)
// for the therapist to review in PrescriptionStudio.

const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── Template fallback ───────────────────────────────────────────────────

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

    if (vitals.detailed_intake) {
        const di = vitals.detailed_intake;
        if (di.triggers && di.triggers.length > 0) {
            parts.push(`Key reported triggers: ${di.triggers.join(', ')}.`);
        }
        if (di.sleepPhysical && di.sleepPhysical.length > 0) {
            parts.push(`Somatic & sleep symptoms: ${di.sleepPhysical.join(', ')}.`);
        }
        if (di.hiddenThoughts && di.hiddenThoughts.trim()) {
            parts.push(`Patient noted difficulty expressing: "${di.hiddenThoughts.trim()}".`);
        }
        if (di.confidentialNotes && di.confidentialNotes.trim()) {
            parts.push(`Confidential note to therapist: "${di.confidentialNotes.trim()}".`);
        }
    }

    if (vitals.notes && vitals.notes.trim()) {
        parts.push(`In their own words: "${vitals.notes.trim()}"`);
    }

    return parts.join(' ');
};

// Heuristic fallback for clinical suggestions
const getFallbackClinicalSuggestions = (vitals) => {
    const concerns = Array.isArray(vitals?.concerns) ? vitals.concerns : [];
    const isAnxiety = concerns.some(c => /anxiety|stress|panic|burnout/i.test(c));
    const isDepression = concerns.some(c => /depression|mood|grief|loss/i.test(c));
    const isTrauma = concerns.some(c => /trauma|ptsd|abuse/i.test(c));
    const isSleep = concerns.some(c => /sleep|insomnia/i.test(c));

    const exercises = [
        {
            title: '4-7-8 Diaphragmatic Breathing for Acute Anxiety & Panic',
            item_type: 'exercise',
            category: 'Breathing & Regulation',
            youtube_url: 'https://www.youtube.com/watch?v=aXItOY0sLRY',
            rationale: 'Stimulates vagal tone and down-regulates sympathetic nervous system arousal.'
        },
        {
            title: 'Shoulder & Neck Tension Release Stretch',
            item_type: 'exercise',
            category: 'Physical & Somatic',
            youtube_url: 'https://www.youtube.com/watch?v=g_tea8ZNk5A',
            rationale: 'Releases upper trapezius and cervical tension accumulated from chronic stress.'
        },
        {
            title: 'Progressive Muscle Relaxation (PMR) for Whole Body Tension',
            item_type: 'exercise',
            category: 'Somatic Relaxation',
            youtube_url: 'https://www.youtube.com/watch?v=1nZEdqcGVzo',
            rationale: 'Systematic Jacobson technique to reduce somatic anxiety and prepare for restful sleep.'
        }
    ];

    const medicines = [];
    if (isAnxiety || isDepression) {
        medicines.push({
            medicine_name: 'Sertraline',
            dosage: '50mg',
            frequency_code: '1-0-0',
            duration_days: 30,
            instructions: 'Take 1 tablet in the morning after meal',
            rationale: 'Standard first-line SSRI for generalized anxiety and major depressive episodes.'
        });
    }
    if (isSleep || isAnxiety) {
        medicines.push({
            medicine_name: 'Clonazepam',
            dosage: '0.5mg',
            frequency_code: '0-0-1',
            duration_days: 7,
            instructions: 'Take 1 tablet at bedtime as needed for severe sleep disruption',
            rationale: 'Short-term adjunct for acute panic and refractory sleep disruption.'
        });
    }

    const tests = [
        {
            test_name: 'GAD-7 (Generalized Anxiety Disorder 7-Item Scale)',
            category: 'Psychological Inventory',
            notes: 'Standardized clinical scale to measure anxiety severity and track treatment progress.'
        },
        {
            test_name: 'PHQ-9 (Patient Health Questionnaire-9)',
            category: 'Psychological Inventory',
            notes: 'Screening and monitoring diagnostic instrument for depression severity.'
        }
    ];

    return {
        clinical_insights: [
            'Intake indicates somatic presentation of stress with potential sleep architecture disruption.',
            'Patient may benefit from combined behavioral grounding exercises and structured CBT check-ins.'
        ],
        suggested_exercises: exercises,
        suggested_medicines: medicines,
        suggested_tests: tests
    };
};

// ─── AI summary & research via Gemini ─────────────────────────────────────

const buildAiAnalysis = async (vitals) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_key_here') {
        return null;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

        const concerns = Array.isArray(vitals.concerns) ? vitals.concerns.join(', ') : 'not specified';
        const detailed = vitals.detailed_intake || {};

        const prompt = `You are a clinical psychology and psychiatric assistant helping a licensed therapist prepare a consultation and treatment plan.

Patient Intake Assessment:
- Primary Concerns: ${concerns}
- Duration of Struggles: ${vitals.duration || 'not specified'}
- Self-Reported Severity: ${vitals.severity || 'not specified'}
- Specific Emotional / Physical Triggers: ${detailed.triggers ? detailed.triggers.join(', ') : 'None listed'}
- Sleep & Somatic Complaints: ${detailed.sleepPhysical ? detailed.sleepPhysical.join(', ') : 'None listed'}
- Things Patient Finds Difficult to Say Aloud: "${detailed.hiddenThoughts || 'None provided'}"
- Confidential Note to Therapist: "${detailed.confidentialNotes || 'None provided'}"
- Patient's Own Words: "${vitals.notes || 'None'}"

Task:
Perform clinical research and return a strictly valid JSON object (WITHOUT backticks, markdown, or extra prose) with the following structure:
{
  "summary": "A concise 2-3 sentence clinical overview of the patient's state for the therapist to read in 15 seconds.",
  "clinical_insights": [
    "Key diagnostic or psychodynamic observation 1",
    "Key observation 2"
  ],
  "suggested_exercises": [
    {
      "title": "Exercise name (e.g. 4-7-8 Diaphragmatic Breathing or Shoulder & Neck Tension Release Stretch)",
      "category": "Physical & Somatic or Breathing or Mindfulness or CBT",
      "youtube_url": "https://www.youtube.com/watch?v=aXItOY0sLRY",
      "rationale": "Why this specific exercise helps the patient's symptoms"
    }
  ],
  "suggested_medicines": [
    {
      "medicine_name": "Standard psychiatric / mental health medicine (e.g. Sertraline, Escitalopram, Clonazepam, Zolpidem)",
      "dosage": "e.g. 50mg",
      "frequency_code": "1-0-0 or 0-0-1",
      "duration_days": 30,
      "instructions": "e.g. Morning after breakfast",
      "rationale": "Clinical reason for recommendation"
    }
  ],
  "suggested_tests": [
    {
      "test_name": "Standard diagnostic test or psychological battery (e.g. GAD-7, PHQ-9, Thyroid Profile (TSH/FT4), CBC)",
      "category": "Psychological Inventory or Laboratory",
      "notes": "Purpose of test"
    }
  ]
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        
        // Clean markdown backticks if returned
        const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(cleaned);
        return parsed;
    } catch (err) {
        console.warn('[Gemini] Clinical research analysis failed:', err.message);
        return null;
    }
};

// ─── Main exports ──────────────────────────────────────────────────────────

const buildSummary = async (vitals) => {
    if (!vitals) return buildTemplateSummary(null);

    const aiData = await buildAiAnalysis(vitals);
    if (aiData && aiData.summary) {
        return aiData.summary;
    }
    return buildTemplateSummary(vitals);
};

const getClinicalSuggestions = async (vitals) => {
    if (!vitals) {
        return getFallbackClinicalSuggestions(null);
    }
    const aiData = await buildAiAnalysis(vitals);
    if (aiData && (aiData.suggested_exercises || aiData.suggested_medicines || aiData.suggested_tests)) {
        return {
            summary: aiData.summary || buildTemplateSummary(vitals),
            clinical_insights: aiData.clinical_insights || [],
            suggested_exercises: aiData.suggested_exercises || [],
            suggested_medicines: aiData.suggested_medicines || [],
            suggested_tests: aiData.suggested_tests || []
        };
    }
    return {
        summary: buildTemplateSummary(vitals),
        ...getFallbackClinicalSuggestions(vitals)
    };
};

module.exports = { buildSummary, getClinicalSuggestions };
