import React, { useState } from 'react';
import { Task, TaskCategory, TaskPriority, TaskStatus, CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS, AVATAR_EMOJIS, AVATAR_STYLING } from '../types';
import { MapPin, Calendar, Clock, Phone, AlertTriangle, ShieldCheck, HeartHandshake, Eye, Trash2, CheckCircle2, UserCheck, Heart } from 'lucide-react';
import { motion } from 'motion/react';

interface TaskCardProps {
  task: Task;
  currentUserId?: string;
  isFavorited?: boolean;
  onToggleFavorite?: (taskId: string) => void;
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
  isFavorited = false,
  onToggleFavorite,
  onAccept,
  onCancelAcceptance,
  onComplete,
  onDelete,
  onViewDetails,
  onReport
}: TaskCardProps) {
  const isCreator = currentUserId === task.creatorId;
  const isVolunteer = currentUserId === task.volunteerId;

  const isStartingSoon = (() => {
    if (!task.startDateTime) return false;
    const taskStart = new Date(task.startDateTime);
    const now = new Date();
    const differenceMs = taskStart.getTime() - now.getTime();
    const differenceHours = differenceMs / (1000 * 60 * 60);
    return differenceHours > 0 && differenceHours <= 48;
  })();

  const categoryIcons: Record<TaskCategory, string> = {
    [TaskCategory.ELDERLY]: '👵',
    [TaskCategory.DELIVERY]: '📦',
    [TaskCategory.MOVING]: '🚚',
    [TaskCategory.EDUCATION]: '📚',
    [TaskCategory.TECHNOLOGY]: '💻',
    [TaskCategory.HEALTHCARE]: '💊',
    [TaskCategory.ECOLOGY]: '🌱',
    [TaskCategory.SPORT]: '⚽',
    [TaskCategory.ANIMALS]: '🐾',
    [TaskCategory.CHARITY]: '❤️',
    [TaskCategory.OTHER]: '🤝',
  };

  const priorityColor = {
    [TaskPriority.HIGH]: 'bg-rose-50 text-rose-700 border-rose-150 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900',
    [TaskPriority.MEDIUM]: 'bg-amber-50 text-amber-700 border-amber-150 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900',
    [TaskPriority.LOW]: 'bg-emerald-50 text-emerald-700 border-emerald-150 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900',
  };

  const statusColor: Record<any, string> = {
    [TaskStatus.ACTIVE]: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
    [TaskStatus.ACCEPTED]: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    [TaskStatus.COMPLETED]: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    [TaskStatus.PENDING_REVIEW]: 'bg-orange-100 text-orange-850 dark:bg-orange-950/40 dark:text-orange-300',
    [TaskStatus.EXPIRED]: 'bg-rose-100 text-rose-850 dark:bg-rose-950/40 dark:text-rose-300',
    [TaskStatus.BLOCKED]: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300',
    'new': 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
    'in_progress': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
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
          <div className="flex gap-1.5 items-center">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${priorityColor[task.priority]}`}>
              {PRIORITY_LABELS[task.priority]}
            </span>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusColor[task.status]}`}>
              {STATUS_LABELS[task.status]}
            </span>
            {isStartingSoon && (
              <span className="px-2 py-1 bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider rounded-lg animate-pulse whitespace-nowrap">
                🔥 Жақын арада
              </span>
            )}
          </div>
          {onToggleFavorite && currentUserId && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(task.id);
              }}
              className="p-1.5 rounded-full hover:bg-rose-50/70 dark:hover:bg-neutral-800/40 text-rose-500 transition-colors cursor-pointer"
              title="Таңдаулыға қосу"
            >
              <Heart className={`w-4 h-4 transition-all duration-200 ${isFavorited ? 'fill-rose-500 text-rose-500 scale-125' : 'text-neutral-400 dark:text-neutral-500 hover:scale-110'}`} />
            </button>
          )}
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
          <div className="col-span-2 space-y-1">
            <div className="flex items-center justify-between gap-1.5 w-full">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="truncate font-semibold text-neutral-800 dark:text-neutral-200" title={`${task.city}${task.address ? `, ${task.address}` : ''}`}>
                  {task.city}{task.address ? `, ${task.address}` : ''}
                </span>
              </div>
              <a
                href={
                  task.latitude && task.longitude
                    ? `https://www.google.com/maps/search/?api=1&query=${task.latitude},${task.longitude}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.city + ' ' + (task.address || ''))}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-bold underline whitespace-nowrap shrink-0 flex items-center gap-0.5"
              >
                🗺️ Картадан көру
              </a>
            </div>
          </div>
          {task.startDateTime && task.endDateTime ? (
            <div className="col-span-2 space-y-1 bg-amber-50/20 dark:bg-neutral-950/20 p-2.5 rounded-2xl border border-amber-500/10 mt-1">
              <div className="flex items-center gap-1.5 text-[9px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                <span>Жұмыс уақыты жүйесі</span>
              </div>
              <div className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-350 space-y-0.5">
                <div>Басталуы: <span className="font-mono text-neutral-800 dark:text-neutral-100">{new Date(task.startDateTime).toLocaleString('kk-KZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></div>
                <div>Аяқталуы: <span className="font-mono text-neutral-850 dark:text-neutral-100">{new Date(task.endDateTime).toLocaleString('kk-KZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></div>
                <div className="text-[9px] text-neutral-450 dark:text-neutral-550 pt-0.5">Ұзақтығы: <span className="font-extrabold text-teal-650 dark:text-teal-400">{task.durationHours} сағат</span></div>
              </div>
            </div>
          ) : (
            <div className="col-span-2 flex items-center gap-1.5 truncate">
              <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="truncate">{formatDate(task.deadline)}</span>
            </div>
          )}
          <div className="col-span-2 flex items-center gap-2 mt-1">
            <span className="text-[10px] text-neutral-400">Көмек сұраушы:</span>
            {task.creatorAvatarUrl ? (
              <img 
                src={task.creatorAvatarUrl} 
                alt="" 
                className="w-5 h-5 rounded-full object-cover border border-teal-500/25 shrink-0 animate-in fade-in" 
                referrerPolicy="no-referrer" 
              />
            ) : (
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${AVATAR_STYLING[task.creatorAvatar || 'avatar_1']}`}>
                {AVATAR_EMOJIS[task.creatorAvatar || 'avatar_1']}
              </div>
            )}
            <span className="font-medium text-neutral-700 dark:text-neutral-200 truncate max-w-[120px]">
              {task.creatorName}
            </span>
          </div>
        </div>
      </div>

      {/* Volunteer Progress Details if any */}
      {task.status !== TaskStatus.ACTIVE && task.status !== 'new' as any && task.volunteerId && (
        <div className="bg-white/10 dark:bg-neutral-950/20 px-5 py-2.5 text-xs border-y border-white/20 dark:border-neutral-800/20 flex items-center gap-2">
          <HeartHandshake className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span className="text-neutral-500 dark:text-neutral-400">Ерікті:</span>
          {task.volunteerAvatarUrl ? (
            <img 
              src={task.volunteerAvatarUrl} 
              alt="" 
              className="w-4 h-4 rounded-full object-cover border border-teal-500/25 shrink-0 animate-in fade-in" 
              referrerPolicy="no-referrer" 
            />
          ) : (
            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${AVATAR_STYLING[task.volunteerAvatar || 'avatar_2']}`}>
              {AVATAR_EMOJIS[task.volunteerAvatar || 'avatar_2']}
            </div>
          )}
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
        {(task.status === TaskStatus.ACTIVE || task.status === 'new' as any) && !isCreator && (
          <button
            onClick={() => onAccept(task.id)}
            className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            Көмектесу
          </button>
        )}

        {(task.status === TaskStatus.ACCEPTED || task.status === 'in_progress' as any) && isVolunteer && (
          <button
            onClick={() => onCancelAcceptance(task.id)}
            className="flex-1 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:text-rose-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all"
          >
            Бас тарту
          </button>
        )}

        {(task.status === TaskStatus.ACCEPTED || task.status === 'in_progress' as any) && isCreator && (
          <button
            onClick={() => onComplete(task.id)}
            className="flex-1 py-2 px-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs animate-pulse"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Аяқталды
          </button>
        )}

        {(task.status === TaskStatus.ACTIVE || task.status === 'new' as any) && isCreator && (
          <button
            onClick={() => onDelete(task.id)}
            className="py-2 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/40 rounded-xl transition-all"
            title="Тапсырманы өшіру"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {!isCreator && (
          <button
            onClick={() => onReport(task)}
            className="py-2 px-2.5 border border-rose-200 hover:bg-rose-50/50 dark:border-rose-950/30 dark:hover:bg-rose-950/10 text-rose-600 hover:text-rose-700 rounded-xl transition-all flex items-center gap-1 shrink-0 cursor-pointer"
            title="Шағым беру (Спам немесе ереже бұзу)"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold">Шағым беру</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
