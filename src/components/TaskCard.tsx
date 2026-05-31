import React, { useState } from 'react';
import { Task, TaskCategory, TaskPriority, TaskStatus, CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS, AVATAR_EMOJIS, AVATAR_STYLING } from '../types';
import { MapPin, Calendar, Clock, Phone, AlertTriangle, ShieldCheck, HeartHandshake, Eye, Trash2, CheckCircle2, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface TaskCardProps {
  task: Task;
  currentUserId?: string;
  onAccept: (taskId: string) => Promise<void> | void;
  onCancelAcceptance: (taskId: string) => Promise<void> | void;
  onComplete: (taskId: string) => Promise<void> | void;
  onDelete: (taskId: string) => Promise<void> | void;
  onViewDetails: (task: Task) => void;
  onReport: (task: Task) => void;
  key?: React.Key;
}

export default function TaskCard({
  task,
  currentUserId,
  onAccept,
  onCancelAcceptance,
  onComplete,
  onDelete,
  onViewDetails,
  onReport
}: TaskCardProps) {
  const isCreator = currentUserId === task.creatorId;
  const isVolunteer = currentUserId === task.volunteerId;

  const categoryIcons: Record<TaskCategory, string> = {
    [TaskCategory.ELDERLY]: '👵',
    [TaskCategory.DELIVERY]: '📦',
    [TaskCategory.MOVING]: '🚚',
    [TaskCategory.EDUCATION]: '📚',
    [TaskCategory.TECHNOLOGY]: '💻',
    [TaskCategory.HEALTHCARE]: '💊',
    [TaskCategory.OTHER]: '🤝',
  };

  const priorityColor = {
    [TaskPriority.HIGH]: 'bg-rose-50 text-rose-700 border-rose-150 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900',
    [TaskPriority.MEDIUM]: 'bg-amber-50 text-amber-700 border-amber-150 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900',
    [TaskPriority.LOW]: 'bg-emerald-50 text-emerald-700 border-emerald-150 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900',
  };

  const statusColor = {
    [TaskStatus.NEW]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    [TaskStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    [TaskStatus.COMPLETED]: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  };

  // Human date helper
  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('kk-KZ', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="glass-card glass-card-hover rounded-3xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
    >
      {/* Header Badges */}
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${priorityColor[task.priority]}`}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusColor[task.status]}`}>
            {STATUS_LABELS[task.status]}
          </span>
        </div>

        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-50 mb-2 truncate">
          <span className="mr-1.5">{categoryIcons[task.category]}</span>
          {task.title}
        </h3>
        
        <p className="text-neutral-600 dark:text-neutral-300 text-sm line-clamp-3 mb-4 h-[60px] overflow-hidden leading-relaxed">
          {task.description}
        </p>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 text-xs text-neutral-500 dark:text-neutral-400 border-t border-white/20 dark:border-neutral-805/30 pt-3">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span>{task.city}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate">{formatDate(task.deadline)}</span>
          </div>
          <div className="col-span-2 flex items-center gap-2 mt-1">
            <span className="text-[10px] text-neutral-400">Көмек сұраушы:</span>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${AVATAR_STYLING[task.creatorAvatar || 'avatar_1']}`}>
              {AVATAR_EMOJIS[task.creatorAvatar || 'avatar_1']}
            </div>
            <span className="font-medium text-neutral-700 dark:text-neutral-200 truncate max-w-[120px]">
              {task.creatorName}
            </span>
          </div>
        </div>
      </div>

      {/* Volunteer Progress Details if any */}
      {task.status !== TaskStatus.NEW && task.volunteerId && (
        <div className="bg-white/10 dark:bg-neutral-950/20 px-5 py-2.5 text-xs border-y border-white/20 dark:border-neutral-800/20 flex items-center gap-2">
          <HeartHandshake className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span className="text-neutral-500 dark:text-neutral-400">Ерікті:</span>
          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${AVATAR_STYLING[task.volunteerAvatar || 'avatar_2']}`}>
            {AVATAR_EMOJIS[task.volunteerAvatar || 'avatar_2']}
          </div>
          <span className="font-semibold text-neutral-700 dark:text-neutral-200 truncate font-mono">
            {task.volunteerName}
          </span>
        </div>
      )}

      {/* Actions Footer */}
      <div className="p-4 bg-white/15 dark:bg-neutral-950/30 border-t border-white/20 dark:border-neutral-800/20 flex items-center gap-2">
        <button
          onClick={() => onViewDetails(task)}
          className="flex-1 py-2 px-3 bg-white/30 hover:bg-white/50 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-white/25 dark:border-white/5"
        >
          <Eye className="w-3.5 h-3.5" />
          Көру
        </button>

        {/* Conditionally reveal secondary actions */}
        {task.status === TaskStatus.NEW && !isCreator && (
          <button
            onClick={() => onAccept(task.id)}
            className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            Көмектесу
          </button>
        )}

        {task.status === TaskStatus.IN_PROGRESS && isVolunteer && (
          <button
            onClick={() => onCancelAcceptance(task.id)}
            className="flex-1 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:text-rose-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all"
          >
            Бас тарту
          </button>
        )}

        {task.status === TaskStatus.IN_PROGRESS && isCreator && (
          <button
            onClick={() => onComplete(task.id)}
            className="flex-1 py-2 px-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs animate-pulse"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Аяқталды
          </button>
        )}

        {task.status === TaskStatus.NEW && isCreator && (
          <button
            onClick={() => onDelete(task.id)}
            className="py-2 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/40 rounded-xl transition-all"
            title="Тапсырманы өшіру"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {!isCreator && !isVolunteer && (
          <button
            onClick={() => onReport(task)}
            className="py-2 px-2 text-neutral-400 hover:text-rose-500 rounded-xl transition-colors"
            title="Шағымдану"
          >
            <AlertTriangle className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
