import React, { useState } from 'react';
import { ActionPlanWeek } from '../types/resume';
import { CheckSquare, Square } from 'lucide-react';

interface ActionPlanTimelineProps {
  weeks: ActionPlanWeek[];
}

export const ActionPlanTimeline: React.FC<ActionPlanTimelineProps> = ({ weeks }) => {
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const totalTasks = weeks.reduce((acc, w) => acc + w.tasks.length, 0);
  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const totalHours = weeks.reduce(
    (acc, w) => acc + w.tasks.reduce((sum, t) => sum + t.estimated_hours, 0),
    0
  );

  return (
    <section
      aria-label="4-Week Career Action Plan"
      className="bg-white border border-slate-200 rounded-xl p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            05. 4-Week Prioritized Action Plan
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Ordered by ATS impact with small, immediate wins in Week 1 and free learning/project resources.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 font-mono tabular-nums">
          <span>
            Completed: {completedCount}/{totalTasks} tasks
          </span>
          <span aria-hidden="true">·</span>
          <span>Total Estimate: {totalHours} hrs</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {weeks.map((week) => (
          <div
            key={week.week}
            className="border border-slate-200 rounded-lg p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1">
                <span className="font-mono font-semibold text-slate-900">
                  Week 0{week.week}
                </span>
                <span>{week.focus_area}</span>
              </div>
              <h4 className="text-sm font-semibold text-slate-900 mb-4">
                {week.theme}
              </h4>

              <div className="divide-y divide-slate-100 border-t border-slate-100">
                {week.tasks.map((task, tIdx) => {
                  const taskId = `w${week.week}-t${tIdx}`;
                  const isDone = Boolean(completedTasks[taskId]);

                  return (
                    <div key={taskId} className="py-3 first:pt-3 last:pb-0">
                      <div className="flex items-start gap-2.5">
                        <button
                          type="button"
                          onClick={() => toggleTask(taskId)}
                          aria-label={`Mark "${task.title}" as ${isDone ? 'incomplete' : 'complete'}`}
                          className="mt-0.5 text-slate-500 hover:text-slate-900 transition-colors shrink-0"
                        >
                          {isDone ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div
                            className={`text-sm font-medium ${
                              isDone ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {task.title}
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {task.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 mt-2">
                            <span className="font-medium text-slate-700">
                              Resource: {task.resource_name}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="uppercase font-mono text-[11px] text-slate-700">
                              Type: {task.resource_type}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              {task.estimated_hours}h
                            </span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={
                                task.impact === 'high'
                                  ? 'text-emerald-700 font-medium'
                                  : 'text-slate-600'
                              }
                            >
                              Impact: {task.impact}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
