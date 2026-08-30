import React from 'react';
import { Activity, Target, Calendar, CheckCircle, TrendingUp, Star } from 'lucide-react';
import './TherapyProgressCard.css'; 

export default function TherapyRoadmapCard({ stats, patientUser, appointments = [], streak = 0 }) {
  const hasCompletedSession = appointments && appointments.some(app => new Date(app.date) < new Date());
  const hasInitiatedPlan = (stats && stats.tasksCompletedToday > 0) || streak > 0 || (stats && stats.weeklyFullCompletions > 0);
  const has1MonthStreak = streak >= 30;

  // Strict chronological progression
  let m1Done = hasCompletedSession || hasInitiatedPlan; 
  let m2Done = m1Done && hasInitiatedPlan;
  let m3Done = m2Done && (streak >= 3);
  let m4Done = m3Done && (streak >= 14);
  let m5Done = m4Done && has1MonthStreak;

  let m1 = m1Done ? 'completed' : 'in-progress';
  let m2 = m2Done ? 'completed' : (m1Done ? 'in-progress' : 'locked');
  let m3 = m3Done ? 'completed' : (m2Done ? 'in-progress' : 'locked');
  let m4 = m4Done ? 'completed' : (m3Done ? 'in-progress' : 'locked');
  let m5 = m5Done ? 'completed' : (m4Done ? 'in-progress' : 'locked');

  const milestones = [
    { 
      id: 1, 
      title: 'First Session', 
      descComplete: 'You completed your first session!', 
      descProgress: 'Book and attend your first session.', 
      descLocked: 'Book your first session.',
      status: m1, 
      icon: <Calendar size={16}/> 
    },
    { 
      id: 2, 
      title: 'Action Plan Initiated', 
      descComplete: 'You started working on your goals.', 
      descProgress: 'Complete your first assigned task.', 
      descLocked: 'Complete your first session to unlock.',
      status: m2, 
      icon: <Target size={16}/> 
    },
    { 
      id: 3, 
      title: 'Identify Core Triggers', 
      descComplete: 'You maintained a 3-day streak!', 
      descProgress: 'Keep a 3-day consistency streak.', 
      descLocked: 'Complete previous steps to unlock.',
      status: m3, 
      icon: <Activity size={16}/> 
    },
    { 
      id: 4, 
      title: 'Build Coping Skills', 
      descComplete: 'You maintained a 14-day streak!', 
      descProgress: 'Keep a 14-day consistency streak.', 
      descLocked: 'Complete previous steps to unlock.',
      status: m4, 
      icon: <TrendingUp size={16}/> 
    },
    { 
      id: 5, 
      title: '1-Month Consistency', 
      descComplete: 'Amazing! 30 days of consistency.', 
      descProgress: 'Keep a 30-day consistency streak.', 
      descLocked: 'Complete previous steps to unlock.',
      status: m5, 
      icon: <Star size={16}/> 
    },
  ];

  return (
    <section className="dashboard-card span-5 flex-column gap-16">
      <div className="card-header-row">
        <h2 className="card-title">Therapy Roadmap</h2>
      </div>
      <div className="roadmap-container" style={{ padding: '0 8px' }}>
         {milestones.map((m, idx) => (
            <div key={m.id} className={`roadmap-node ${m.status}`}>
               <div className="node-icon-wrapper">
                  {m.status === 'completed' ? <CheckCircle size={18} className="text-green"/> : m.icon}
               </div>
               <div className="node-content">
                  <h4 className="node-title">{m.title}</h4>
                  <p className="node-status-text">
                    {m.status === 'completed' ? m.descComplete : m.status === 'in-progress' ? m.descProgress : m.descLocked}
                  </p>
               </div>
               {idx < milestones.length - 1 && <div className="node-connector"></div>}
            </div>
         ))}
      </div>
    </section>
  );
}
