import React from 'react';
import { X } from 'lucide-react';

export default function TasksModal({
  showAllTasksModal,
  setShowAllTasksModal,
  checklistItems,
  renderChecklistRow,
  tasksLoading,
  tasksError
}) {
  if (!showAllTasksModal) return null;

  return (
    <div className="edit-modal-overlay" onClick={() => setShowAllTasksModal(false)}>
      <div className="edit-modal-box tasks-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="tasks-modal-header">
          <div>
            <h2 className="edit-modal-title">All Care Plan Tasks</h2>
            <p className="vitals-step-subtitle">Check boxes as you complete daily medications and exercises.</p>
          </div>
          <button className="tasks-modal-close-btn" onClick={() => setShowAllTasksModal(false)}>
            <X size={20} />
          </button>
        </div>

        {tasksLoading ? (
          <p className="checklist-empty-text">Loading your tasks...</p>
        ) : tasksError ? (
          <p className="checklist-empty-text checklist-error-text">{tasksError}</p>
        ) : checklistItems.length === 0 ? (
          <p className="checklist-empty-text">All tasks completed! Great progress.</p>
        ) : (
          <div className="checklist-group" style={{ marginBottom: 20 }}>
            {checklistItems.map(renderChecklistRow)}
          </div>
        )}
      </div>
    </div>
  );
}
