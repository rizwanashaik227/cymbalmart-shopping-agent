import React, { useState } from 'react';
import { CalendarCheck, Check, Clock, Sparkles, Plus, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { TimelineMilestone } from '../types';

interface TimelineViewProps {
  timeline: TimelineMilestone[];
  onToggleMilestone: (id: string) => void;
  onAddMilestone: (task: string, phase: TimelineMilestone['phase']) => void;
}

const PHASE_LABELS: { [key in TimelineMilestone['phase']]: { title: string; subtitle: string; color: string } } = {
  '1_week_before': {
    title: '1 Week Before Party',
    subtitle: 'Guest count finalization, online decor ordering & playlist',
    color: 'border-indigo-200 bg-indigo-50/40 text-indigo-900',
  },
  '3_days_before': {
    title: '3 Days Before (Bulk Shopping Run)',
    subtitle: 'Wholesale trip for paper goods, mixers, canned items, and dry goods',
    color: 'border-blue-200 bg-blue-50/40 text-blue-900',
  },
  '1_day_before': {
    title: '1 Day Before (Prep & Decor)',
    subtitle: 'Marinades, dips, veggie chopping, string lights, and drink chilling',
    color: 'border-purple-200 bg-purple-50/40 text-purple-900',
  },
  day_of_morning: {
    title: 'Day of Party (Morning of Event)',
    subtitle: 'Pick up fresh bakery orders, party ice bags, and set warming stations',
    color: 'border-amber-200 bg-amber-50/40 text-amber-900',
  },
  '1_hour_before': {
    title: '1 Hour Before (Showtime Readiness)',
    subtitle: 'Set out appetizers, mix batch cocktails, cue music & light candles',
    color: 'border-rose-200 bg-rose-50/40 text-rose-900',
  },
  during_party: {
    title: 'During Party Hosting',
    subtitle: 'Maintain ice bucket levels, empty recycling bins, and enjoy your guests',
    color: 'border-emerald-200 bg-emerald-50/40 text-emerald-900',
  },
};

export const TimelineView: React.FC<TimelineViewProps> = ({
  timeline,
  onToggleMilestone,
  onAddMilestone,
}) => {
  const [newTask, setNewTask] = useState('');
  const [newPhase, setNewPhase] = useState<TimelineMilestone['phase']>('1_day_before');
  const [showAddForm, setShowAddForm] = useState(false);

  const completedCount = timeline.filter((t) => t.completed).length;
  const progressPct = Math.round((completedCount / (timeline.length || 1)) * 100);

  const handleToggle = (id: string, currentlyCompleted: boolean) => {
    onToggleMilestone(id);
    if (!currentlyCompleted) {
      confetti({
        particleCount: 20,
        spread: 30,
        origin: { y: 0.7 },
      });
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    onAddMilestone(newTask.trim(), newPhase);
    setNewTask('');
    setShowAddForm(false);
  };

  // Group milestones by phase
  const phasesOrder: TimelineMilestone['phase'][] = [
    '1_week_before',
    '3_days_before',
    '1_day_before',
    'day_of_morning',
    '1_hour_before',
    'during_party',
  ];

  return (
    <div className="space-y-3">
      {/* Progress & Header Banner - High Density */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                Run of Show
              </span>
              <span className="text-[11px] text-slate-500 font-bold">
                {completedCount} of {timeline.length} milestones complete
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight mt-1">
              Party Prep & Shopping Schedule
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              Stress-free timeline designed so you finish early and host with ease.
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center self-start sm:self-auto gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            <span>Add Task</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Add Task Inline Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddTask}
          className="bg-white rounded-xl border-2 border-indigo-300 p-3 shadow-sm space-y-2.5"
        >
          <h4 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            Add Timeline Milestone
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                Milestone Task Description *
              </label>
              <input
                type="text"
                required
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="e.g. Put beer cases in garage fridge, set out ice bucket"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                Timeline Phase
              </label>
              <select
                value={newPhase}
                onChange={(e) => setNewPhase(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              >
                <option value="1_week_before">1 Week Before</option>
                <option value="3_days_before">3 Days Before</option>
                <option value="1_day_before">1 Day Before</option>
                <option value="day_of_morning">Day of Morning</option>
                <option value="1_hour_before">1 Hour Before</option>
                <option value="during_party">During Party</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs"
            >
              Save Milestone
            </button>
          </div>
        </form>
      )}

      {/* Phases Timeline - High Density Cards */}
      <div className="space-y-2.5">
        {phasesOrder.map((phase) => {
          const itemsInPhase = timeline.filter((t) => t.phase === phase);
          if (itemsInPhase.length === 0) return null;

          const meta = PHASE_LABELS[phase];

          return (
            <div
              key={phase}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs"
            >
              <div className={`px-3.5 py-2 border-b ${meta.color}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-black flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-700" />
                    <span>{meta.title}</span>
                  </h3>
                  <span className="text-[11px] font-extrabold opacity-90">
                    {itemsInPhase.filter((i) => i.completed).length}/{itemsInPhase.length} Done
                  </span>
                </div>
                <p className="text-[11px] opacity-90 mt-0.2 font-medium">{meta.subtitle}</p>
              </div>

              <div className="p-1.5 divide-y divide-slate-100">
                {itemsInPhase.map((item) => (
                  <div
                    key={item.id}
                    className={`py-2 px-2 flex items-start gap-2.5 rounded-lg transition-all ${
                      item.completed ? 'bg-slate-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <button
                      onClick={() => handleToggle(item.id, item.completed)}
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        item.completed
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'border border-slate-300 hover:border-indigo-500 bg-white'
                      }`}
                    >
                      {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-bold leading-snug ${
                          item.completed ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {item.task}
                      </p>
                      <span className="text-[9px] uppercase font-bold text-slate-400 mt-0.5 inline-block">
                        Tag: {item.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
