const db = require('../config/db');

async function setupExerciseVideos() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS therapy_exercise_videos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                youtube_url VARCHAR(500) NOT NULL,
                duration_minutes INT DEFAULT 10,
                description TEXT,
                tags VARCHAR(500),
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Also add pre_session_intake column to patient_vitals or sessions if needed
        try {
            await db.query(`
                ALTER TABLE patient_vitals 
                ADD COLUMN IF NOT EXISTS detailed_intake JSON NULL
            `);
        } catch (colErr) {}

        const [existing] = await db.query('SELECT COUNT(*) as count FROM therapy_exercise_videos');
        if (existing[0].count === 0) {
            const seeds = [
                ['Shoulder & Neck Tension Release Stretch', 'Physical & Somatic', 'https://www.youtube.com/watch?v=g_tea8ZNk5A', 8, 'Gentle somatic stretching targeting the trapezius, levator scapulae, and upper neck tension.', 'shoulder therapy, shoulder, neck mobility, tension release, upper back, somatic'],
                ['10-Min Shoulder Mobility & Rotator Cuff Therapy', 'Physical & Somatic', 'https://www.youtube.com/watch?v=SedzswEwpPw', 10, 'Therapeutic rotator cuff and shoulder joint mobility routine for chronic stiffness.', 'shoulder therapy, shoulder mobility, rotator cuff, frozen shoulder, physical rehab, shoulder exercise'],
                ['Desk Worker Neck, Shoulder & Spine Relief Routine', 'Physical & Somatic', 'https://www.youtube.com/watch?v=X3-gKPN8-QA', 7, 'Targeted ergonomic stretches to alleviate tension from prolonged desk work and study.', 'shoulder therapy, shoulder, desk posture, neck strain, spine mobility'],
                ['4-7-8 Diaphragmatic Breathing for Acute Anxiety & Panic', 'Breathing & Regulation', 'https://www.youtube.com/watch?v=aXItOY0sLRY', 5, 'Evidence-based parasympathetic activation technique to slow heart rate during panic or acute anxiety.', 'breathing, anxiety, panic attack, 4-7-8, heart rate, calm'],
                ['Box Breathing for High Stress & Nervous System Regulation', 'Breathing & Regulation', 'https://www.youtube.com/watch?v=tEmt1Znux58', 5, 'Square breathing protocol used to stabilize the autonomic nervous system and restore mental clarity.', 'box breathing, stress relief, vagus nerve, focus, emotional regulation'],
                ['15-Min Guided Mindfulness Breathing Exercise', 'Mindfulness', 'https://www.youtube.com/watch?v=inpok4MKVLM', 15, 'Foundational breath-awareness meditation to develop mindful presence and reduce rumination.', 'mindfulness, meditation, breathing, presence, rumination'],
                ['Progressive Muscle Relaxation (PMR) for Whole Body Tension', 'Somatic Relaxation', 'https://www.youtube.com/watch?v=1nZEdqcGVzo', 12, 'Jacobson progressive relaxation systematically releasing somatic tension from toes to facial muscles.', 'PMR, progressive muscle relaxation, somatic stress, insomnia, tension'],
                ['5-4-3-2-1 Sensory Grounding for Emotional Overwhelm', 'Grounding & Trauma', 'https://www.youtube.com/watch?v=30VMIEmA114', 6, 'Sensory engagement technique to pull out of panic spirals, flashback intrusions, and dissociative states.', 'grounding, 54321, dissociation, panic, trauma, overwhelm'],
                ['Guided Body Scan Meditation for Deep Sleep & Insomnia', 'Sleep Support', 'https://www.youtube.com/watch?v=u4gZgnCy5ew', 20, 'Non-sleep deep rest (NSDR) and somatic body scan designed to calm racing thoughts before bed.', 'sleep, insomnia, nighttime routine, body scan, calm'],
                ['Vagus Nerve Calming Reset Routine', 'Nervous System', 'https://www.youtube.com/watch?v=L1HCG3BGK8I', 8, 'Sub-occipital release and vagal nerve stimulation exercises to transition out of fight-or-flight mode.', 'vagus nerve, nervous system, fight or flight, somatic calming'],
                ['CBT Thought Challenging & Cognitive Restructuring Walkthrough', 'Cognitive Behavioral', 'https://www.youtube.com/watch?v=0Xa4hZp8d70', 10, 'Structured CBT guide to identify cognitive distortions, catastrophic thinking, and reframe negative thoughts.', 'CBT, cognitive restructuring, negative thoughts, journaling, overthinking'],
                ['5-Minute Daily Gratitude & Mood Journaling Walkthrough', 'Behavioral Activation', 'https://www.youtube.com/watch?v=WPPPFqsECz0', 5, 'Daily behavioral activation journaling exercise to build positive affect and counteract depressive inertia.', 'gratitude, journaling, depression, mood, behavioral activation']
            ];
            for (const s of seeds) {
                await db.query('INSERT INTO therapy_exercise_videos (title, category, youtube_url, duration_minutes, description, tags) VALUES (?, ?, ?, ?, ?, ?)', s);
            }
            console.log('Seeded ' + seeds.length + ' exercise videos successfully.');
        } else {
            console.log('Table already has ' + existing[0].count + ' videos.');
        }
    } catch (err) {
        console.error('Setup error:', err);
    } finally {
        process.exit(0);
    }
}

setupExerciseVideos();
