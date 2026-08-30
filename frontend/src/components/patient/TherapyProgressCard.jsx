import React, { useState } from 'react';
import { Activity, Target, Calendar, CheckCircle, TrendingUp, Star } from 'lucide-react';
import './TherapyProgressCard.css';

const InteractiveDualChart = ({ data }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const width = 700;
  const height = 180;
  const paddingX = 45; // increased to fit right labels
  const paddingY = 25;

  const points = data.map((d, i) => {
    const x = paddingX + (i * (width - 2 * paddingX) / (data.length - 1));
    const taskY = height - paddingY - (d.task / 100) * (height - 2 * paddingY);
    const moodY = height - paddingY - (d.mood / 10) * (height - 2 * paddingY);
    return { ...d, x, taskY, moodY, index: i };
  });

  const generateSmoothPath = (pts, key) => {
    if (pts.length === 0) return '';
    let path = `M ${pts[0].x},${pts[0][key]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i + 1];
      const controlX = curr.x + (next.x - curr.x) / 2;
      path += ` C ${controlX},${curr[key]} ${controlX},${next[key]} ${next.x},${next[key]}`;
    }
    return path;
  };

  const taskPathD = generateSmoothPath(points, 'taskY');
  const moodPathD = generateSmoothPath(points, 'moodY');
  const areaD = `${taskPathD} L ${points[points.length-1].x},${height-paddingY} L ${points[0].x},${height-paddingY} Z`;

  return (
    <div style={{ position: 'relative', width: '100%', marginTop: '10px' }}>
      <svg width="100%" height="auto" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.02))', display: 'block' }}>
        <defs>
          <linearGradient id="taskGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="hoverColGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f3f4f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f3f4f6" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Horizontal Grid lines & Y-axis labels */}
        {[0, 50, 100].map((val, idx) => {
          const y = height - paddingY - (val / 100) * (height - 2 * paddingY);
          return (
            <g key={`grid-${val}`}>
              <line x1={paddingX} y1={y} x2={width-paddingX} y2={y} stroke="#f3f4f6" strokeWidth="2" />
              {/* Left axis: Task % */}
              <text x={paddingX - 12} y={y + 4} fontSize="12" fill="#9ca3af" textAnchor="end" fontWeight="500">{val}%</text>
              {/* Right axis: Mood score */}
              <text x={width - paddingX + 12} y={y + 4} fontSize="12" fill="#9ca3af" textAnchor="start" fontWeight="500">{[0, 5, 10][idx]}</text>
            </g>
          );
        })}

        {/* Axis Titles */}
        <text x={paddingX - 12} y={paddingY - 20} fontSize="12" fill="#3b82f6" textAnchor="end" fontWeight="600">Tasks</text>
        <text x={width - paddingX + 12} y={paddingY - 20} fontSize="12" fill="#8b5cf6" textAnchor="start" fontWeight="600">Mood</text>

        {/* Hover Highlight Column */}
        {hoveredPoint && (
          <rect 
            x={hoveredPoint.x - 30} 
            y={paddingY - 15} 
            width="60" 
            height={height - paddingY * 2 + 30} 
            fill="url(#hoverColGradient)" 
            rx="6" 
          />
        )}

        {/* Task Area and Smooth Line */}
        <path d={areaD} fill="url(#taskGradient)" />
        <path d={taskPathD} fill="none" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

        {/* Mood Smooth Line (Dotted) */}
        <path d={moodPathD} fill="none" stroke="#8b5cf6" strokeWidth="4" strokeDasharray="6,6" strokeLinecap="round" strokeLinejoin="round" />

        {/* X-axis labels */}
        {points.map((p, i) => (
          <text 
            key={`x-${i}`} 
            x={p.x} 
            y={height - 2} 
            fontSize="14" 
            fill={hoveredPoint?.label === p.label ? "#374151" : "#9ca3af"} 
            textAnchor="middle" 
            fontWeight={hoveredPoint?.label === p.label ? "600" : "500"}
            style={{ transition: 'all 0.2s' }}
          >
            {p.label}
          </text>
        ))}

        {/* Interactive Points (Task) */}
        {points.map((p, i) => (
          <circle
            key={`task-pt-${i}`}
            cx={p.x}
            cy={p.taskY}
            r={hoveredPoint?.label === p.label ? "8" : "6"}
            fill={hoveredPoint?.label === p.label ? "#3b82f6" : "#ffffff"}
            stroke="#3b82f6"
            strokeWidth="3"
            style={{ pointerEvents: 'none', transition: 'all 0.2s' }}
          />
        ))}

        {/* Interactive Points (Mood) */}
        {points.map((p, i) => (
          <circle
            key={`mood-pt-${i}`}
            cx={p.x}
            cy={p.moodY}
            r={hoveredPoint?.label === p.label ? "8" : "6"}
            fill={hoveredPoint?.label === p.label ? "#8b5cf6" : "#ffffff"}
            stroke="#8b5cf6"
            strokeWidth="3"
            style={{ pointerEvents: 'none', transition: 'all 0.2s' }}
          />
        ))}
        
        {/* Invisible hit areas for easier hovering */}
        {points.map((p, i) => (
          <rect
            key={`hit-${i}`}
            x={p.x - 30}
            y={paddingY - 10}
            width="60"
            height={height - paddingY + 10}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredPoint(p)}
            onMouseLeave={() => setHoveredPoint(null)}
          />
        ))}
      </svg>
      
      {/* Tooltip */}
      {hoveredPoint && (
        <div style={{
          position: 'absolute',
          top: `calc(${(hoveredPoint.taskY < hoveredPoint.moodY ? hoveredPoint.taskY : hoveredPoint.moodY) / height * 100}% - 60px)`,
          left: `calc(${(hoveredPoint.x / width) * 100}%)`,
          transform: 'translateX(-50%)',
          backgroundColor: '#ffffff',
          color: '#1f2937',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '13px',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          zIndex: 10,
          border: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', textAlign: 'center', marginBottom: '2px' }}>{hoveredPoint.label}</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
             <span style={{ fontSize: '12px' }}>Task Progress:</span>
             <strong style={{ color: '#3b82f6' }}>{hoveredPoint.task}%</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
             <span style={{ fontSize: '12px' }}>Mood Score:</span>
             <strong style={{ color: '#8b5cf6' }}>{hoveredPoint.mood} / 10</strong>
          </div>
        </div>
      )}
    </div>
  );
};

export default function TherapyProgressCard({ stats, patientUser, appointments = [], streak = 0 }) {
  // 1. Consistency & Mood
  let actionPlanPct = 0;
  if (stats && stats.totalTasksToday > 0) {
    actionPlanPct = Math.round((stats.tasksCompletedToday / stats.totalTasksToday) * 100);
  } else if (stats && stats.totalTasksToday === 0 && stats.tasksCompletedToday > 0) {
    actionPlanPct = 100;
  }

  const [moodData, setMoodData] = useState([
    { label: 'Week 1', mood: 4, task: 40 },
    { label: 'Week 2', mood: 5, task: 55 },
    { label: 'Week 3', mood: 6.5, task: 80 },
    { label: 'Week 4', mood: 7.5, task: actionPlanPct }
  ]);
  const [currentMoodScore, setCurrentMoodScore] = useState(7.5);
  const [isLoggingMood, setIsLoggingMood] = useState(false);
  const [newMoodVal, setNewMoodVal] = useState(7.5);

  React.useEffect(() => {
    // If stats change, update the current week's task %
    setMoodData(prev => {
      const copy = [...prev];
      copy[copy.length - 1].task = actionPlanPct;
      return copy;
    });
  }, [actionPlanPct]);

  React.useEffect(() => {
    if (patientUser?.id) {
       const key = `therapy_mood_progress_${patientUser.id}`;
       const saved = localStorage.getItem(key);
       if (saved) {
         try {
           const parsed = JSON.parse(saved);
           // Restore historical mood data, but keep task % real-time
           setMoodData(prev => {
             const copy = [...prev];
             // copy mood historicals over
             parsed.data.forEach((d, i) => {
               if (copy[i]) copy[i].mood = d.mood || d.score || 0;
             });
             return copy;
           });
           setCurrentMoodScore(parsed.current);
           setNewMoodVal(parsed.current);
         } catch(e){}
       }
    }
  }, [patientUser]);

  const handleSaveMood = () => {
     const score = parseFloat(newMoodVal);
     const newData = [...moodData];
     // Just update the latest week for this interactive demo
     newData[newData.length - 1].mood = score;
     setMoodData(newData);
     setCurrentMoodScore(score);
     setIsLoggingMood(false);
     
     if (patientUser?.id) {
       localStorage.setItem(`therapy_mood_progress_${patientUser.id}`, JSON.stringify({
         data: newData,
         current: score
       }));
     }
  };

  const consistencyStats = {
    weeklyDays: stats?.weeklyFullCompletions || 0,
    actionPlanPct: actionPlanPct,
    tasksCompleted: stats?.tasksCompletedToday || 0,
    totalTasks: stats?.totalTasksToday || 0,
  };

  return (
    <section className="dashboard-card span-12 flex-column gap-16 progress-card-container">
      <div className="card-header-row">
        <h2 className="card-title">My Progress & Journey</h2>
        <span className="card-header-link" style={{ cursor: 'pointer', fontSize: '12px' }}>
          Detailed Analytics →
        </span>
      </div>

      <div className="progress-content-grid">
        {/* Left Side: Weekly Consistency */}
        <div className="analytics-box" style={{ margin: 0 }}>
             <h3 className="analytics-title">Weekly Consistency</h3>
             
             <div className="progress-stat-row">
               <div className="stat-label">Daily Task ({consistencyStats.tasksCompleted}/{consistencyStats.totalTasks})</div>
               <div className="progress-bar-bg">
                 <div className="progress-bar-fill" style={{ width: `${consistencyStats.actionPlanPct}%`, backgroundColor: '#3b82f6' }}></div>
               </div>
               <div className="stat-value">{consistencyStats.actionPlanPct}%</div>
             </div>

             <div className="progress-stat-row">
               <div className="stat-label">Weekly Perfect ({consistencyStats.weeklyDays}/7)</div>
               <div className="progress-bar-bg">
                 <div className="progress-bar-fill" style={{ width: `${Math.round((consistencyStats.weeklyDays/7)*100)}%`, backgroundColor: '#10b981' }}></div>
               </div>
               <div className="stat-value">{Math.round((consistencyStats.weeklyDays/7)*100)}%</div>
             </div>
        </div>

        {/* Right Side: Mood Box */}
        <div className="analytics-box mood-box" style={{ margin: 0 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 className="analytics-title" style={{ margin: 0 }}>Progress vs. Mood</h3>
               {!isLoggingMood && (
                 <button 
                   onClick={() => setIsLoggingMood(true)}
                   style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer', color: '#3b82f6' }}
                 >
                   Log Mood
                 </button>
               )}
             </div>
             
             {isLoggingMood && (
               <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', gap: '10px', alignItems: 'center' }}>
                 <span style={{ fontSize: '12px', fontWeight: '500', color: '#8b5cf6' }}>Mood: {newMoodVal}/10</span>
                 <input 
                   type="range" 
                   min="1" max="10" step="0.5" 
                   value={newMoodVal} 
                   onChange={(e) => setNewMoodVal(e.target.value)}
                   style={{ flexGrow: 1, accentColor: '#8b5cf6' }}
                 />
                 <button 
                   onClick={handleSaveMood}
                   style={{ backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer' }}
                 >
                   Save
                 </button>
               </div>
             )}

             <div className="mood-display" style={{ marginTop: '12px', display: 'block' }}>
                <div style={{ width: '100%' }}>
                   <InteractiveDualChart data={moodData} />
                </div>
             </div>
             <p className="mood-insight">
               {actionPlanPct >= 70 && currentMoodScore >= 7 
                  ? "Great job! Your high task consistency correlates beautifully with your positive mood." 
                  : "Your metrics have been fluctuating. Try to maintain your daily action plans to see if it improves your mood!"}
             </p>
          </div>
      </div>
    </section>
  );
}
