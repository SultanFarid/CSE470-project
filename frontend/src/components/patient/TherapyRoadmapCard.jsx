import React from 'react';
import { Activity, Target, Calendar, CheckCircle, TrendingUp, Star } from 'lucide-react';
import './TherapyProgressCard.css'; // Reusing the same CSS for now

export default function TherapyRoadmapCard({ stats, patientUser, appointments = [], streak = 0 }) {
  // 1. Consistency & Mood
  let actionPlanPct = 0;
  if (stats && stats.totalTasksToday > 0) {
    actionPlanPct = Math.round((stats.tasksCompletedToday / stats.totalTasksToday) * 100);
  } else if (stats && stats.totalTasksToday === 0 && stats.tasksCompletedToday > 0) {
    actionPlanPct = 100;
  }

  const consistencyStats = {
    weeklyDays: stats?.weeklyFullCompletions || 0,
    actionPlanPct: actionPlanPct,
    tasksCompleted: stats?.tasksCompletedToday || 0,
    totalTasks: stats?.totalTasksToday || 0,
  };

  // 2. Journey Milestones (Dynamic)
  const hasCompletedSession = appointments && appointments.some(app => new Date(app.date) < new Date());
  const hasInitiatedPlan = (stats && stats.tasksCompletedToday > 0) || streak > 0 || consistencyStats.weeklyDays > 0;
  const has1MonthStreak = streak >= 30;

  // Evaluate status sequentially to create a "roadmap" feel
  let m1 = hasCompletedSession ? 'completed' : (patientUser?.therapist ? 'in-progress' : 'locked');
  let m2 = hasInitiatedPlan ? 'completed' : (m1 === 'completed' ? 'in-progress' : 'locked');
  let m3 = (m2 === 'completed' && streak >= 3) ? 'completed' : (m2 === 'completed' ? 'in-progress' : 'locked'); 
  let m4 = (m3 === 'completed' && streak >= 14) ? 'completed' : (m3 === 'completed' ? 'in-progress' : 'locked'); 
  let m5 = has1MonthStreak ? 'completed' : (m4 === 'completed' ? 'in-progress' : 'locked');

  const milestones = [
    { id: 1, title: 'First Session Completed', status: m1, icon: <Calendar size={16}/> },
    { id: 2, title: 'Action Plan Initiated', status: m2, icon: <Target size={16}/> },
    { id: 3, title: 'Identify Core Triggers', status: m3, icon: <Activity size={16}/> },
    { id: 4, title: 'Build Coping Skills', status: m4, icon: <TrendingUp size={16}/> },
    { id: 5, title: '1-Month Consistency Streak', status: m5, icon: <Star size={16}/> },
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
                    {m.status === 'completed' ? 'Completed' : m.status === 'in-progress' ? 'Current Focus' : 'Upcoming'}
                  </p>
               </div>
               {idx < milestones.length - 1 && <div className="node-connector"></div>}
            </div>
         ))}
      </div>
    </section>
  );
}
