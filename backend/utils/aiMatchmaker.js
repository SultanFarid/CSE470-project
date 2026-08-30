const { GoogleGenerativeAI } = require('@google/generative-ai');

const fallbackScoreTherapist = (therapist, vitals, summaries = {}) => {
  let score = 0;
  try {
      if (vitals && vitals.concerns && therapist && therapist.specialties && Array.isArray(vitals.concerns) && Array.isArray(therapist.specialties)) {
          vitals.concerns.forEach((c) => { 
              if (therapist.specialties.includes(c)) score += 1; 
          });
      }
      if (vitals && therapist && (vitals.genderPref === "No preference" || therapist.gender === vitals.genderPref)) score += 1;
      if (vitals && therapist && (vitals.languagePref === "No preference" || (therapist.languages && Array.isArray(therapist.languages) && therapist.languages.includes(vitals.languagePref)))) score += 1;
      if (vitals && therapist && (vitals.formatPref === "Either" || (therapist.formats && Array.isArray(therapist.formats) && therapist.formats.includes(vitals.formatPref)))) score += 1;

      if (therapist && therapist.id && summaries) {
          const fb = summaries[therapist.id];
          if (fb) {
            if (fb.averageRating >= 4.7) score += 0.5;
            if (fb.tagCounts) {
              if (fb.tagCounts['Listens carefully'] || fb.tagCounts['Warm and supportive']) score += 0.5;
              if (fb.tagCounts['Good at treatment'] || fb.tagCounts['Structured sessions']) score += 0.5;
            }
          }
      }
  } catch(e) {
      console.error("Error in fallback calculation:", e);
  }
  
  const maxPossible = (vitals && vitals.concerns && Array.isArray(vitals.concerns) ? vitals.concerns.length : 1) + 3;
  const matchPct = Math.min(99, Math.max(70, Math.round((score / maxPossible) * 100)));
  return { ...therapist, matchScore: score, matchPct: isNaN(matchPct) ? 75 : matchPct };
};

const runAiMatchmaker = async (vitalsData, therapists, reviewSummaries) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey.trim() === '' || apiKey === 'your_key_here') {
            console.log('[Gemini] No API key found, using fallback matchmaker.');
            const scored = therapists.map(t => fallbackScoreTherapist(t, vitalsData, reviewSummaries));
            scored.sort((a, b) => b.matchScore - a.matchScore);
            return scored.slice(0, 3);
        }

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

            const prompt = `You are an AI Matchmaker for a mental health platform.
Given the patient's vitals (concerns, preferences) and a list of therapists, you must score each therapist from 70 to 99 based on how well they match the patient.

Patient Vitals:
${JSON.stringify(vitalsData, null, 2)}

Therapists:
${JSON.stringify(therapists.map(t => ({ id: t.id, name: t.name, specialties: t.specialties, gender: t.gender, languages: t.languages, formats: t.formats, reviewSummary: reviewSummaries[t.id] })), null, 2)}

Return ONLY a valid JSON array of the top 3 best matching therapist IDs and their match percentages, in the format:
[
  { "id": 1, "matchPct": 98 },
  { "id": 4, "matchPct": 85 }
]
Ensure the array is sorted by matchPct descending.
`;

            const result = await model.generateContent(prompt);
            let text = result.response.text().trim();
            if (text.startsWith('```json')) text = text.substring(7);
            if (text.endsWith('```')) text = text.substring(0, text.length - 3);
            
            const aiScores = JSON.parse(text);
            console.log("[Gemini] Successfully scored therapists using Gemini API.");
            
            const topTherapists = aiScores.map(scoreItem => {
                const t = therapists.find(th => th.id === scoreItem.id);
                if (t) {
                    return { ...t, matchPct: scoreItem.matchPct };
                }
                return null;
            }).filter(Boolean);

            if (topTherapists.length > 0) {
                return topTherapists;
            } else {
                throw new Error('Gemini returned empty or invalid mapping.');
            }

        } catch (err) {
            console.warn('[Gemini] AI matchmaker failed, falling back to deterministic matching:', err.message);
            const scored = therapists.map(t => fallbackScoreTherapist(t, vitalsData, reviewSummaries));
            scored.sort((a, b) => b.matchScore - a.matchScore);
            return scored.slice(0, 3);
        }
    } catch (criticalError) {
        console.error("Critical error in runAiMatchmaker:", criticalError);
        // Absolute final fallback to prevent 500
        return therapists.slice(0, 3).map(t => ({ ...t, matchPct: 80 }));
    }
};

module.exports = { runAiMatchmaker };
