import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Clock, 
  Check, 
  ChevronRight, 
  Trash2, 
  Activity, 
  HeartHandshake, 
  PlusCircle, 
  User 
} from 'lucide-react';
import { Task, UserProfile, STATUS_LABELS, TaskStatus } from '../types';
import { getUserParticipations } from '../services/dbService';

interface HistoryPageProps {
  userProfile: UserProfile;
  currentUser: any;
  tasks: Task[];
  handleCancelAcceptance: (taskId: string) => Promise<void>;
  handleCompleteTask: (taskId: string) => Promise<void>;
  handleDeleteTask: (taskId: string) => Promise<void>;
  setSelectedTask: (task: Task | null) => void;
  setActiveTab: (tab: any) => void;
}

export default function HistoryPage({
  userProfile,
  currentUser,
  tasks,
  handleCancelAcceptance,
  handleCompleteTask,
  handleDeleteTask,
  setSelectedTask,
  setActiveTab
}: HistoryPageProps) {
  const [participations, setParticipations] = useState<any[]>([]);
  const [loadingParticipations, setLoadingParticipations] = useState(false);

  useEffect(() => {
    if (currentUser?.uid) {
      setLoadingParticipations(true);
      getUserParticipations(currentUser.uid).then((list) => {
        setParticipations(list || []);
        setLoadingParticipations(false);
      }).catch((e) => {
        console.error(e);
        setLoadingParticipations(false);
      });
    }
  }, [currentUser?.uid, tasks]);
  
  const myHelpRequests = tasks.filter(t => t.creatorId === currentUser?.uid);
  const myVolunteerTasks = tasks.filter(t => t.volunteerId === currentUser?.uid);
  const favoriteTaskIds = userProfile?.favoriteTaskIds || [];
  const favoriteTasks = tasks.filter(t => favoriteTaskIds.includes(t.id));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 font-sans" id="history_page_wrapper">
      <div>
        <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <Activity className="w-7 h-7 text-teal-600" />
          Қатысу және белсенділік тарихы
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
          Мұнда сіз жариялаған өтініштеріңізді, ерікті істеріңізді және таңдаулы тапсырмаларды көре аласыз
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Part 1: My Help Requests (МЕНІҢ КӨМЕК ТАПСЫРМАЛАРЫМ) */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xs">
          <div>
            <h3 className="text-base font-black text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-teal-600" />
              Менің көмек өтініштерім
            </h3>
            <p className="text-neutral-450 text-xs mt-1">Жариялаған өтініштеріңіз, олардың орындалу барысы және растау әрекеттері</p>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800" id="help_requests_history_list">
            {myHelpRequests.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400 italic font-sans">
                Сынама ретінде бірде-бір тапсырма жасамағансыз.
              </div>
            ) : (
              myHelpRequests.map((t) => (
                <div key={t.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1 max-w-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-neutral-800 dark:text-neutral-200 text-sm truncate">{t.title}</span>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                        (t.status === TaskStatus.ACTIVE || t.status === 'new' as any) ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' :
                        (t.status === TaskStatus.ACCEPTED || t.status === 'in_progress' as any) ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40' :
                        t.status === TaskStatus.COMPLETED ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                        'bg-neutral-105 bg-neutral-100 text-neutral-700 dark:bg-neutral-800'
                      }`}>
                        {t.status as any === 'new' ? STATUS_LABELS[TaskStatus.ACTIVE] :
                         t.status as any === 'in_progress' ? STATUS_LABELS[TaskStatus.ACCEPTED] :
                         STATUS_LABELS[t.status] || t.status}
                      </span>
                    </div>
                    <p className="text-neutral-500 dark:text-neutral-400 truncate text-xs">{t.description}</p>
                    {t.volunteerId && (
                      <div className="text-[10px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-800/50 p-1 px-2.5 rounded-md border border-neutral-100 dark:border-neutral-800 w-fit">
                        <span>Үміткер Ерікті: <strong>{t.volunteerName}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0 self-end sm:self-center">
                    {(t.status === TaskStatus.ACCEPTED || t.status === 'in_progress' as any) && (
                      <button
                        onClick={() => handleCompleteTask(t.id)}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-[10px] shadow-sm flex items-center gap-1 cursor-pointer transition-all shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Аяқталғанын растау
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedTask(t)}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-220 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Көру
                    </button>
                    {(t.status === TaskStatus.ACTIVE || t.status === 'new' as any) && (
                      <button
                        onClick={() => handleDeleteTask(t.id)}
                        className="p-1 px-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer font-bold text-[10px]"
                      >
                        Өшіру
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Part 2: My Volunteering History (МЕНІҢ ЕРІКТІ ЖҰМЫСТАРЫМ) */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xs">
          <div>
            <h3 className="text-base font-black text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-teal-650 text-teal-600" />
              Менің ерікті жұмыстарым
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-1">Басқа адамдарға көмектесу үшін қабылдаған істеріңіз бен ағымдағы барысы</p>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800" id="volunteering_history_list">
            {myVolunteerTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400 italic">
                Әзірге ешқандай өтініш қабылдамағансыз. Көршілерге көмектесуді бастаңыз! 🤝
              </div>
            ) : (
              myVolunteerTasks.map((t) => (
                <div key={t.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1 max-w-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-neutral-800 dark:text-neutral-200 text-sm truncate">{t.title}</span>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                        (t.status === TaskStatus.ACCEPTED || t.status === 'in_progress' as any) ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                        'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                      }`}>
                        {t.status as any === 'new' ? STATUS_LABELS[TaskStatus.ACTIVE] :
                         t.status as any === 'in_progress' ? STATUS_LABELS[TaskStatus.ACCEPTED] :
                         STATUS_LABELS[t.status] || t.status}
                      </span>
                    </div>
                    <p className="text-neutral-500 dark:text-neutral-400 text-xs truncate">{t.description}</p>
                    <div className="text-[10px] text-neutral-450 dark:text-neutral-400">Көмек иесі: <span className="font-semibold text-neutral-700 dark:text-neutral-200">{t.creatorName}</span></div>
                  </div>

                  <div className="flex gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => setSelectedTask(t)}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-220 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg font-bold text-[10px] text-neutral-700 dark:text-neutral-300 cursor-pointer"
                    >
                      Көру
                    </button>
                    {(t.status === TaskStatus.ACCEPTED || t.status === 'in_progress' as any) && (
                      <button
                        onClick={() => handleCancelAcceptance(t.id)}
                        className="px-3 py-1.5 border border-rose-200 text-rose-600 dark:border-rose-900/40 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Бас тарту
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Part 3: Participation History (ҚАТЫСУ ТАРИХЫ) */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xs">
          <div>
            <h3 className="text-base font-black text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Толық қатысу тарихы
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-1">Сіз қабылдаған, сәтті аяқтаған немесе бас тартқан ерікті жұмыстардың толық тарихы</p>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800" id="participation_timeline_list">
            {loadingParticipations ? (
              <div className="py-8 text-center text-xs text-neutral-400 italic">Жүктелуде...</div>
            ) : participations.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400 italic font-sans bg-transparent">Әзірге қатысу тарихы бос. Тапсырмалар қабылдап, белсенділігіңізді арттырыңыз! 🤝</div>
            ) : (
              participations.map((p) => {
                const dateVal = p.completedAt || p.joinedAt || p.updatedAt;
                const formattedDate = dateVal ? new Date(dateVal).toLocaleString('kk-KZ', {
                  day: 'numeric',
                  month: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : '';

                return (
                  <div key={p.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-neutral-800 dark:text-neutral-200 text-sm font-sans">{p.taskTitle}</span>
                        <span className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-full ${
                          p.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300' :
                          p.status === 'accepted' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-305' :
                          'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                        }`}>
                          {p.status === 'completed' ? 'Аяқталды ✅' :
                           p.status === 'accepted' ? 'Жалғасуда ⏳' :
                           'Бас тартылды ❌'}
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-450 dark:text-neutral-500">
                        {p.status === 'completed' ? 'Мақұлданған уақыты' : 'Қосылған уақыты'}: <span className="font-semibold text-neutral-650 dark:text-neutral-405">{formattedDate}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Part 4: Favorite Tasks (САҚТАЛҒАН ТАПСЫРМАЛАР) */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xs">
          <div>
            <h3 className="text-base font-black text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500 animate-pulse" />
              Таңдаулы сақталғандар
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-1">Өзіңізге ұнаған немесе соңырақ қатысу үшін белгілеп қойған тапсырмалар</p>
          </div>

          <div className="divide-y divide-neutral-150 dark:divide-neutral-800" id="favorites_history_list">
            {favoriteTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400 italic">
                Таңдаулыға әзірге ешқандай өтініш қосылмады. Басты беттегі ❤️ белгісін басып қосыңыз.
              </div>
            ) : (
              favoriteTasks.map((t) => (
                <div key={t.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-neutral-800 dark:text-neutral-200 text-sm truncate">{t.title}</span>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                        (t.status === TaskStatus.ACTIVE || t.status === 'new' as any) ? 'bg-teal-100 text-teal-700' :
                        (t.status === TaskStatus.ACCEPTED || t.status === 'in_progress' as any) ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700 dark:bg-green-950/40'
                      }`}>
                        {STATUS_LABELS[t.status] || t.status}
                      </span>
                    </div>
                    <p className="text-neutral-500 dark:text-neutral-400 text-xs truncate">{t.description}</p>
                    <div className="text-[10px] text-neutral-450">Тапсырма орны: <span className="font-semibold">{t.city}</span></div>
                  </div>

                  <div className="flex gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => setSelectedTask(t)}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-220 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 text-[10px] font-bold cursor-pointer"
                    >
                      Көру
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Part 5: Past/Expired Tasks (ӨТКЕН ТАПСЫРМАЛАР) */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xs">
          <div>
            <h3 className="text-base font-black text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-500 font-extrabold" />
              Өткен тапсырмалар (Мерзімі өткен)
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-1">Орындалу уақыты өтіп кеткендіктен мерзімі өткен деп танылған өтініштер тарихы</p>
          </div>

          <div className="divide-y divide-neutral-150 dark:divide-neutral-800" id="expired_history_list">
            {(() => {
              const expiredTasks = tasks.filter(t => 
                (t.status as any === TaskStatus.EXPIRED || t.status as any === 'expired') && 
                (t.creatorId === currentUser?.uid || t.volunteerId === currentUser?.uid)
              );
              if (expiredTasks.length === 0) {
                return (
                  <div className="py-8 text-center text-xs text-neutral-400 italic">
                    Сізге қатысты бірде-бір мерзімі өткен тапсырма табылмады.
                  </div>
                );
              }
              return expiredTasks.map((t) => (
                <div key={t.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-neutral-800 dark:text-neutral-200 text-sm truncate">{t.title}</span>
                      <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-full bg-red-100 text-red-700 dark:bg-rose-950/40 dark:text-rose-450">
                        Мерзімі өткен
                      </span>
                    </div>
                    <p className="text-neutral-500 dark:text-neutral-400 text-xs truncate">{t.description}</p>
                    <div className="text-[10px] text-neutral-450 dark:text-neutral-400">
                      Аяқталу уақыты: <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300">{t.endDateTime ? new Date(t.endDateTime).toLocaleString('kk-KZ') : '-'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => setSelectedTask(t)}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-220 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 text-[10px] font-bold cursor-pointer"
                    >
                      Көру
                    </button>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

      </div>
    </div>
  );
}
