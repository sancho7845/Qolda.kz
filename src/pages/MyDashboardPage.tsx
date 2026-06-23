import React, { useState, useEffect } from 'react';
import { 
  StarIcon, 
  MessageSquare, 
  HeartHandshake,
  Award,
  Gift,
  Download,
  ShieldCheck,
  Heart,
  Bell,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  BarChart,
  Settings,
  HelpCircle,
  Activity,
  Camera,
  RefreshCw
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';
import { 
  Task, 
  UserProfile, 
  AVATAR_STYLING, 
  AVATAR_EMOJIS 
} from '../types';

interface MyDashboardPageProps {
  userProfile: UserProfile;
  theme: 'light' | 'dark';
  currentUser: any;
  tasks: Task[];
  myReviews: any[];
  handleCancelAcceptance: (taskId: string) => Promise<void>;
  handleCompleteTask: (taskId: string) => Promise<void>;
  handleDeleteTask: (taskId: string) => Promise<void>;
  setSelectedTask: (task: Task | null) => void;
  updateUserBio: (data: Partial<UserProfile>) => Promise<void>;
  loadTasks: () => Promise<void>;
  setActiveTab: (tab: 'all_tasks' | 'map_view' | 'my_dashboard' | 'create_task' | 'admin' | 'achievements' | 'certificates' | 'notifications' | 'history' | 'statistics' | 'leaderboard' | 'settings' | 'reports') => void;
  unreadNotificationsCount?: number;
}

export default function MyDashboardPage({
  userProfile,
  theme,
  currentUser,
  tasks,
  myReviews,
  handleCancelAcceptance,
  handleCompleteTask,
  handleDeleteTask,
  setSelectedTask,
  updateUserBio,
  loadTasks,
  setActiveTab,
  unreadNotificationsCount = 0
}: MyDashboardPageProps) {
  
  if (!currentUser || !userProfile) {
    return (
      <div className="py-12 text-center text-xs font-bold text-neutral-400 font-sans">
        Пайдаланушы профилі жүктелуде немесе табылмады...
      </div>
    );
  }

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Қате: Тек JPEG, PNG немесе WEBP форматтарын жүктеуге болады!');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Қате: Суреттің көлемі 5 МБ-тан аспауы тиіс!');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileRef = ref(storage, `users/${currentUser.uid}/avatar`);
      await uploadBytes(fileRef, file, { contentType: file.type });
      const downloadUrl = await getDownloadURL(fileRef);

      await updateUserBio({
        avatarUrl: downloadUrl
      });

      alert('Профиль суреті сәтті жаңартылды!');
      await loadTasks();
    } catch (err: any) {
      console.error('Avatar upload details:', err);
      alert('Суретті жүктеу сәтсіз аяқталды: ' + (err.message || String(err)));
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Determine current tier/level
  const completed = userProfile?.completedTasksCount || 0;
  const totalHours = userProfile?.totalVolunteerHours || 0;
  const ratingVal = userProfile?.rating || 5;
  const penalties = userProfile?.penaltyPoints || 0;
  const acceptedCount = userProfile?.acceptedTasksCount || 0;

  const currentLevel = (() => {
    if (completed <= 2) return 'Жаңадан келген';
    if (completed <= 10) return 'Белсенді волонтер';
    if (completed <= 25) return 'Тәжірибелі волонтер';
    return 'Лидер';
  })();

  const trustStatus = penalties >= 3 ? 'Төмен сенімді' : (userProfile?.trustStatus || 'Жоғары сенімді');
  const currentTier = `${currentLevel} (${trustStatus})`;

  // Core platform shortcuts matching the requested pages
  const shortcuts = [
    {
      id: 'achievements',
      title: 'Жетістіктер мен медальдар',
      desc: 'Сіздің марапаттарыңыз, ерекше медальдарыңыз бен ағымдағы деңгейіңіз',
      icon: <Award className="w-6 h-6 text-amber-500" />,
      tag: 'Жаңа ✨',
      tabKey: 'achievements' as const,
    },
    {
      id: 'certificates',
      title: 'Сертификаттар',
      desc: '50 волонтерлік сағат жинап, ресми растау сертификатын жүктеңіз',
      icon: <Download className="w-6 h-6 text-teal-600" />,
      tag: `${totalHours}/50 сағ`,
      tabKey: 'certificates' as const,
    },
    {
      id: 'notifications',
      title: 'Хабарламалар орталығы',
      desc: 'Барлық жүйелік ескертулер мен маңызды жаңалықтар',
      icon: <Bell className="w-6 h-6 text-indigo-505 text-indigo-500" />,
      tag: unreadNotificationsCount > 0 ? `${unreadNotificationsCount} жаңа` : undefined,
      tabKey: 'notifications' as const,
    },
    {
      id: 'history',
      title: 'Қатысу тарихы',
      desc: 'Жариялаған өтініштеріңіз, қабылдаған ерікті істеріңіз бен тарихыңыз',
      icon: <Activity className="w-6 h-6 text-sky-500" />,
      tabKey: 'history' as const,
    },
    {
      id: 'statistics',
      title: 'Жеке статистика',
      desc: 'Сағаттық белсенділік, аяқтаған істеріңіз бен бағыттардың жіктелуі',
      icon: <BarChart className="w-6 h-6 text-teal-500" />,
      tabKey: 'statistics' as const,
    },
    {
      id: 'leaderboard',
      title: 'Үздік волонтерлер',
      desc: 'Платформадағы ең белсенді еріктілердің көшбасшылық рейтингі',
      icon: <Award className="w-6 h-6 text-yellow-500" />,
      tabKey: 'leaderboard' as const,
    },
    {
      id: 'settings',
      title: 'Профиль баптаулары',
      desc: 'Есіміңізді, тұратын қалаңызды өзгерту және профиль суретін жүктеу',
      icon: <Settings className="w-6 h-6 text-neutral-500" />,
      tabKey: 'settings' as const,
    },
    {
      id: 'reports',
      title: 'Менің шағымдарым',
      desc: 'Қауіпсіздік пен ережелерді сақтау мақсатында жіберілген шағымдар тізімі',
      icon: <ShieldAlert className="w-6 h-6 text-rose-505 text-rose-500" />,
      tabKey: 'reports' as const,
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 font-sans animate-in fade-in" id="dashboard_page_wrapper">
      
      {/* Visual Welcome header */}
      <div>
        <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          Қош келдіңіз, <span className="text-teal-600 dark:text-teal-400">{userProfile.name}</span>!
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
          Мұнда сіз өзіңіздің волонтерлік жеке кабинетіңізді толықтай басқарып, барлық беттерге оңай өте аласыз
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Micro profile summary card */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 h-fit space-y-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest block">Қысқаша Профиль</h3>

            <div className="flex flex-col items-center text-center gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
              <div className="relative group select-none">
                {userProfile.avatarUrl ? (
                  <img 
                    src={userProfile.avatarUrl} 
                    alt="" 
                    className="w-16 h-16 rounded-full object-cover border-2 border-teal-500/25 shrink-0" 
                    referrerPolicy="no-referrer" 
                  />
                ) : (
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-4xl border-2 border-teal-500/10 shrink-0 ${AVATAR_STYLING[userProfile.avatarId || 'avatar_1']}`}>
                    {AVATAR_EMOJIS[userProfile.avatarId || 'avatar_1']}
                  </div>
                )}
                
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-neutral-900/40 rounded-full flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-neutral-800 dark:text-neutral-100">{userProfile.name}</h4>
                <p className="text-[10px] text-neutral-400 uppercase font-black">{userProfile.city} қаласы</p>
                
                <div className="pt-1.5 flex justify-center">
                  <label className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-400 rounded-full text-[10px] font-black cursor-pointer transition-colors border border-teal-500/15">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Суретті өзгерту</span>
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/webp" 
                      onChange={handleAvatarFileChange} 
                      className="hidden" 
                      disabled={uploadingAvatar}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-450 dark:text-neutral-400">Волонтер дәрежесі:</span>
                <span className="font-black text-teal-600 dark:text-teal-400">{currentLevel}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-450 dark:text-neutral-400">Сенімділік мәртебесі:</span>
                <span className={`font-black uppercase text-[11px] px-2.5 py-0.5 rounded-lg ${penalties >= 3 ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20' : 'bg-teal-50 text-teal-600 dark:bg-teal-950/10 dark:text-teal-400'}`}>{trustStatus}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-450 dark:text-neutral-400">Жалпы көмек сағаты:</span>
                <span className="font-extrabold text-teal-600 dark:text-teal-400">{totalHours} сағат</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-450 dark:text-neutral-400">Қабылданған істер:</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-100">{acceptedCount} рет</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-450 dark:text-neutral-400">Аяқталған тапсырыстар:</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-100">{completed} рет</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-450 dark:text-neutral-400">Айыппұл ұпайы:</span>
                <span className={`font-bold ${penalties > 0 ? 'text-rose-500' : 'text-neutral-500'}`}>{penalties} ұпай</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-450 dark:text-neutral-400">Орташа рейтинг:</span>
                <span className="font-bold text-amber-500">⭐ {ratingVal.toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <button
              onClick={() => setActiveTab('settings')}
              className="w-full py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              Профильді баптау
            </button>
          </div>
        </div>

        {/* Right column: Beautiful Bento Grid shortcuts to all other pages */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest block">Негізгі Секциялар</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="dashboard_sections_bento_grid">
            {shortcuts.map((sc) => (
              <div 
                key={sc.id}
                onClick={() => setActiveTab(sc.tabKey)}
                className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 hover:border-teal-300 dark:hover:border-teal-900 rounded-2xl p-5 hover:shadow-md cursor-pointer transition-all duration-350 flex justify-between gap-4 group relative overflow-hidden"
              >
                {/* Visual backdrop highlight */}
                <div className="absolute top-0 right-0 translate-x-3 -translate-y-3 w-16 h-16 rounded-full bg-teal-500/0 group-hover:bg-teal-500/5 transition-all duration-300" />

                <div className="flex gap-3.5 items-start">
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-850 rounded-xl group-hover:bg-teal-50 dark:group-hover:bg-teal-950/20 transition-all">
                    {sc.icon}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-neutral-855 text-neutral-800 dark:text-neutral-150 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {sc.title}
                      </h4>
                      {sc.tag && (
                        <span className="px-2 py-0.5 text-[8.5px] font-black rounded-md bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-450 animate-pulse">
                          {sc.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-450 dark:text-neutral-500 leading-normal max-w-[220px]">
                      {sc.desc}
                    </p>
                  </div>
                </div>

                <div className="self-center text-neutral-400 group-hover:text-teal-600 dark:text-neutral-600 dark:group-hover:text-teal-400 transition-all translate-x-0 group-hover:translate-x-1.5 shrink-0">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Reviews Section kept beautiful at bottom of main Dashboard view */}
      {myReviews.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xs">
          <h3 className="font-extrabold text-sm text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
            <MessageSquare className="w-5 h-5 text-amber-500 fill-amber-500/10" />
            Көршілерден алған соңғы пікірлеріңіз
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myReviews.map((r) => (
              <div key={r.id} className="p-4 bg-neutral-50 dark:bg-neutral-950/20 border border-neutral-100 dark:border-neutral-850 rounded-2xl text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {r.reviewerAvatarUrl ? (
                      <img 
                        src={r.reviewerAvatarUrl} 
                        alt="" 
                        className="w-7 h-7 rounded-full object-cover shrink-0" 
                        referrerPolicy="no-referrer" 
                      />
                    ) : (
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] shrink-0 border border-neutral-100 dark:border-neutral-800 ${AVATAR_STYLING[r.reviewerAvatar || 'avatar_1']}`}>
                        {AVATAR_EMOJIS[r.reviewerAvatar || 'avatar_1']}
                      </div>
                    )}
                    <span className="font-bold text-neutral-700 dark:text-neutral-300">{r.reviewerName}</span>
                  </div>
                  <span className="font-black text-amber-500">⭐ {r.rating}</span>
                </div>
                <p className="text-neutral-500 dark:text-neutral-400 italic font-medium">
                  &quot;{r.text}&quot;
                </p>
                <span className="text-[9px] text-neutral-400 block text-right mt-1 font-sans">{new Date(r.createdAt).toLocaleDateString('kk-KZ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
