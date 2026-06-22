import React from 'react';
import { Map } from 'lucide-react';
import { Task, TaskStatus, CATEGORY_LABELS } from '../types';
import { InteractiveMap } from '../components/InteractiveMap';

interface MapViewPageProps {
  theme: 'light' | 'dark';
  tasks: Task[];
  currentUser: any;
  handleAcceptTask: (taskId: string) => void;
}

export default function MapViewPage({
  theme,
  tasks,
  currentUser,
  handleAcceptTask,
}: MapViewPageProps) {
  // Filter only active/accepted (new/in_progress) tasks on the map
  const activeMapTasks = tasks.filter((t) => {
    const isExcludedStatus = 
      t.status === TaskStatus.EXPIRED || 
      t.status === TaskStatus.BLOCKED || 
      t.status === TaskStatus.PENDING_REVIEW ||
      t.status === TaskStatus.COMPLETED ||
      t.status === 'expired' as any ||
      t.status === 'blocked' as any ||
      t.status === 'pending_review' as any ||
      t.status === 'completed' as any;
      
    return !isExcludedStatus && t.latitude && t.longitude;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 p-5 rounded-2xl shadow-sm">
        <div className="bg-transparent">
          <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-50 flex items-center gap-2 font-sans bg-transparent">
            <Map className="w-5.5 h-5.5 text-teal-600" />
            Алматы қаласының халықтық көмек картасы
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 text-xs font-sans">
            Алматы бойынша жарияланған белсенді көмек өтініштер мен еріктілердің тапсырмалары.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap bg-transparent">
          <span className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 bg-transparent">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block animate-pulse"></span>
            Жаңа өтініштер
          </span>
          <span className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 bg-transparent">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block animate-pulse"></span>
            Орындалуда
          </span>
        </div>
      </div>

      {/* Map container card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 p-4 rounded-2xl shadow-sm">
        <div className="h-[500px] w-full bg-transparent">
          <InteractiveMap
            mode="view"
            theme={theme}
            tasks={activeMapTasks}
            currentUserId={currentUser?.uid}
            onAcceptTask={handleAcceptTask}
          />
        </div>
      </div>

      {/* Map tasks list index */}
      <div className="space-y-3 bg-transparent">
        <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-sans">
          Картадағы тапсырмалар тізімі / Tasks Listed on Map
        </h4>
        
        {activeMapTasks.length === 0 ? (
          <div className="py-12 bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 border-dashed rounded-2xl text-center text-xs font-bold text-neutral-400">
            Картада белсенді тапсырмалар табылған жоқ.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-transparent">
            {activeMapTasks.map((task) => (
                <div 
                  key={task.id}
                  className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 p-4 rounded-xl flex flex-col justify-between hover:border-teal-500/40 hover:shadow-md transition-all duration-200"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                        {CATEGORY_LABELS[task.category] || task.category}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${(task.status === TaskStatus.ACTIVE || task.status === 'new' as any) ? 'bg-teal-500' : 'bg-amber-500'}`} />
                    </div>
                    <h5 className="font-extrabold text-xs text-neutral-900 dark:text-white mb-1 line-clamp-1 font-sans">
                      {task.title}
                    </h5>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mb-2 line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  </div>
                  <div className="border-t border-neutral-100 dark:border-neutral-800 pt-2.5 mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 flex items-center gap-0.5 truncate max-w-[150px]">
                      📍 {task.address || 'Алматы'}
                    </span>
                    <button
                      onClick={() => {
                        window.scrollTo({ top: 200, behavior: 'smooth' });
                      }}
                      className="text-[10px] text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer"
                    >
                      Картадан қарау ➡
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
