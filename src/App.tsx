import React, { useEffect, useState } from 'react';
import { AuthProvider } from './services/AuthContext';
import { ThemeProvider } from './services/ThemeContext';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { 
  getTasks, 
  acceptTask, 
  cancelTaskAcceptance, 
  completeTask, 
  submitReview, 
  submitReport,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUserReviews,
  deleteTask,
  subscribeTasks,
  checkAndApplyExpirations
} from './services/dbService';
import { 
  Task, 
  TaskCategory, 
  TaskPriority, 
  TaskStatus, 
  UserProfile, 
  CATEGORY_LABELS, 
  PRIORITY_LABELS, 
  STATUS_LABELS, 
  AVATAR_EMOJIS, 
  AVATAR_STYLING 
} from './types';
import { 
  HeartHandshake, 
  MapPin, 
  Map, 
  Calendar, 
  Clock, 
  LogOut, 
  Moon, 
  Sun, 
  Bell, 
  AlertTriangle, 
  ShieldAlert, 
  Smartphone,
  Check, 
  Info,
  ChevronRight,
  Star as StarIcon,
  X,
  PlusCircle,
  Menu,
  Paperclip,
  PhoneCall
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Subpages
import AuthPage from './pages/AuthPage';
import AllTasksPage from './pages/AllTasksPage';
import MapViewPage from './pages/MapViewPage';
import CreateTaskPage from './pages/CreateTaskPage';
import MyDashboardPage from './pages/MyDashboardPage';

// Admin Panel component
import AdminPanel from './components/AdminPanel';

// Other modals
import ReportModal from './components/ReportModal';
import ReviewModal from './components/ReviewModal';

function QoldaApp() {
  const { 
    currentUser, 
    userProfile, 
    loading, 
    signOut, 
    sendEmailVerification, 
    checkEmailVerificationStatus,
    updateUserBio 
  } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Tasks States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [activeTab, setActiveTab] = useState<'all_tasks' | 'map_view' | 'my_dashboard' | 'create_task' | 'admin'>('all_tasks');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'deadline' | 'priority'>('newest');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Review & Report Modal triggers
  const [reviewModalTarget, setReviewModalTarget] = useState<{ id: string; name: string; category: string } | null>(null);
  const [reportModalTarget, setReportModalTarget] = useState<Task | null>(null);

  // Warn/helper message display state
  const [hideWarningMessage, setHideWarningMessage] = useState(() => {
    return sessionStorage.getItem('hideEmailWarning') === 'true';
  });

  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    iconType?: 'info' | 'warning';
    isDestructive?: boolean;
  } | null>(null);

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      confirmText?: string;
      cancelText?: string;
      iconType?: 'info' | 'warning';
      isDestructive?: boolean;
    }
  ) => {
    setConfirmDialog({
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(null);
      },
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
      iconType: options?.iconType,
      isDestructive: options?.isDestructive
    });
  };

  // Reviews list for profiles
  const [myReviews, setMyReviews] = useState<any[]>([]);

  // Mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch initial tasks
  const loadTasks = async () => {
    setLoadingTasks(true);
    try {
      const allTasks = await getTasks(!!userProfile?.isAdmin);
      const withExpirations = await checkAndApplyExpirations(allTasks);
      setTasks(withExpirations);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTasks(false);
    }
  };

  const loadNotificationsAndReviews = async () => {
    if (currentUser) {
      try {
        const notifs = await getUserNotifications(currentUser.uid);
        setNotifications(notifs);
        const reviews = await getUserReviews(currentUser.uid);
        setMyReviews(reviews);
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    let unsubscribeTasks: (() => void) | undefined;

    if (currentUser) {
      setLoadingTasks(true);
      unsubscribeTasks = subscribeTasks(
        async (allTasks) => {
          const withExpirations = await checkAndApplyExpirations(allTasks);
          setTasks(withExpirations);
          setLoadingTasks(false);
        },
        (err) => {
          console.error('Real-time listener failed:', err);
          setLoadingTasks(false);
        },
        !!userProfile?.isAdmin
      );

      loadNotificationsAndReviews();
      
      const interval = setInterval(() => {
        loadNotificationsAndReviews();
      }, 10000);

      return () => {
        clearInterval(interval);
        if (unsubscribeTasks) {
          unsubscribeTasks();
        }
      };
    }
  }, [currentUser, userProfile?.isAdmin]);

  // Task operation triggers
  const handleAcceptTask = async (taskId: string) => {
    if (!userProfile) return;
    if (userProfile.isBanned) {
      alert('Сіздің есептік жазбаңыз бұғатталған. Еріктілік шараларға қатыса алмайсыз.');
      return;
    }
    try {
      await acceptTask(taskId, userProfile);
      setSelectedTask(null);
      await loadTasks();
      await loadNotificationsAndReviews();
      alert('Сіз бұл тапсырмаға ерікті болып тағайындалдыңыз! Көмек сұраушыға өзіңіз хабарласа аласыз.');
    } catch (err: any) {
      alert('Тапсырманы қабылдау сәтсіз аяқталды: ' + String(err));
    }
  };

  const handleCancelAcceptance = async (taskId: string) => {
    try {
      await cancelTaskAcceptance(taskId);
      setSelectedTask(null);
      await loadTasks();
      await loadNotificationsAndReviews();
      alert('Сіз бұл тапсырманы орындаудан бас тарттыңыз.');
    } catch (err: any) {
      alert('Әрекет сәтсіз аяқталды: ' + String(err));
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const taskObj = tasks.find(t => t.id === taskId);
      if (!taskObj) return;

      await completeTask(taskId);
      await loadTasks();
      await loadNotificationsAndReviews();
      
      if (taskObj.volunteerId && taskObj.volunteerName) {
        setReviewModalTarget({
          id: taskObj.volunteerId,
          name: taskObj.volunteerName,
          category: CATEGORY_LABELS[taskObj.category]
        });
      }
      setSelectedTask(null);
    } catch (err: any) {
      alert('Тапсырманы аяқтау сәтсіз аяқталды: ' + String(err));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    showConfirm(
      'Тапсырманы біржола жоюды растау / Confirm Deletion',
      'Осы белсенді көмек өтінішін жүйеден біржола өшіргіңіз келетініне сенімдісіз бе? Бұл әрекетті кері қайтару мүмкін емес!\nAre you sure you want to permanently delete this help request? This action cannot be undone.',
      async () => {
        try {
          await deleteTask(taskId);
          setSelectedTask(null);
          await loadTasks();
        } catch (err: any) {
          alert('Тапсырманы өшіру сәтсіз өтті: ' + String(err));
        }
      },
      {
        confirmText: 'Delete',
        cancelText: 'Cancel',
        iconType: 'warning',
        isDestructive: true
      }
    );
  };

  const handleReportSubmit = async (reason: string) => {
    if (!userProfile || !reportModalTarget) return;
    try {
      await submitReport(
        userProfile.uid,
        userProfile.name,
        'task',
        reportModalTarget.id,
        reportModalTarget.title,
        reason
      );
      setReportModalTarget(null);
      alert('Шағымыңыз сәтті қабылданды, модераторлар жақын арада тексеру жүргізеді.');
    } catch (err: any) {
      alert('Шағым жіберу кезінде қате кетті: ' + String(err));
    }
  };

  const handleReviewSubmit = async (rating: number, text: string) => {
    if (!userProfile || !reviewModalTarget) return;
    try {
      await submitReview(
        reviewModalTarget.id,
        userProfile.uid,
        userProfile.name,
        userProfile.avatarId || 'avatar_1',
        reviewModalTarget.id,
        rating,
        text,
        userProfile.avatarUrl || ''
      );
      setReviewModalTarget(null);
      alert('Бағалауыңыз бен пікіріңіз жеткізілді. Қолдау білдіргеніңізге рақмет!');
    } catch (err: any) {
      alert('Пікір жариялау кезінде ауытқу болды: ' + String(err));
    }
  };

  const handleMarkAllRead = async () => {
    if (userProfile) {
      await markAllNotificationsAsRead(userProfile.uid);
      await loadNotificationsAndReviews();
    }
  };

  const handleNotificationClick = async (notifId: string) => {
    await markNotificationAsRead(notifId);
    await loadNotificationsAndReviews();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center text-sm font-semibold text-neutral-500 animate-pulse">
        <HeartHandshake className="w-12 h-12 text-teal-600 animate-bounce mb-3" />
        <span>Жүктелуде... Qolda.kz күте тұрыңыз</span>
      </div>
    );
  }

  // BANNED USER OVERLAY
  if (userProfile && userProfile.isBanned) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center p-6 text-sm">
        <div className="bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-950 rounded-2xl p-8 max-w-md text-center space-y-4 shadow-lg w-full">
          <AlertTriangle className="w-16 h-16 text-rose-600 mx-auto" />
          <h1 className="text-xl font-black text-neutral-800 dark:text-neutral-50">Қауымдастықтан бұғатталу</h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            Өкінішке орай, сіздің &quot;{userProfile.name}&quot; есептік жазбаңыз біздің қауымдастық ережелерін жүйелі түрде бұзғаны немесе шағымдардың көп түсуі себебінен модераторлармен шектелді.
          </p>
          <div className="p-3 bg-red-50 dark:bg-red-950/20 text-rose-700 dark:text-rose-400 text-xs font-bold rounded-xl border border-red-100 dark:border-red-900">
            Қызмет уақытша немесе толық шектелген.
          </div>
          <button
            onClick={() => signOut()}
            className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 text-white font-bold rounded-xl transition-all cursor-pointer"
          >
            Басқа тіркелгіге кіру
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-neutral-900 dark:text-neutral-50 transition-colors duration-300 font-sans">
      
      {/* AUTHENTICATION VIEW */}
      {!currentUser ? (
        <AuthPage />
      ) : !currentUser.emailVerified ? (
        /* EMAIL VERIFICATION SCREEN */
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-6 text-sm">
          <div className="bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-950/40 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 to-amber-500" />
            
            <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <ShieldAlert className="w-8 h-8 animate-pulse text-amber-600" />
            </div>
            
            <div className="space-y-2 bg-transparent">
              <h1 className="text-xl font-black text-neutral-800 dark:text-neutral-50 font-sans">Электрондық поштаны растау қажет</h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-450 font-sans leading-relaxed">
                Қауіпсіздікті қамтамасыз ету және спамнан қорғау мақсатында <strong className="text-neutral-700 dark:text-neutral-250 font-mono">{currentUser.email}</strong> поштаңызды растауыңыз қажет. Біз сізге растау сілтемесін жібердік. Поштаңызды тексеріп, сілтемеден өтіңіз.
              </p>
            </div>

            <div className="p-3.5 bg-amber-500/5 dark:bg-amber-950/10 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-xl border border-amber-500/10 dark:border-amber-900/20 text-left space-y-1 font-sans">
              <div>⚠️ Растағаннан кейін &quot;Растауды тексеру&quot; батырмасын басыңыз.</div>
              <div className="text-[10px] text-neutral-400 font-normal">Егер хат келмесе, спам (Spam) бумасын тексеруді ұмытпаңыз.</div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-transparent shrink-0">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const verified = await checkEmailVerificationStatus();
                    if (verified) {
                      alert('Поштаңыз сәтті расталды! Қош келдіңіз!');
                    } else {
                      alert('Поштаңыз әлі расталмаған. Поштаңыздағы сілтемені ашып, қайта тексеріп көріңіз.');
                    }
                  } catch (err: any) {
                    alert('Тексеру кезінде қате тапты: ' + err.message);
                  }
                }}
                className="py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all font-sans text-xs cursor-pointer shadow-sm"
              >
                Растауды тексеру
              </button>
              
              <button
                type="button"
                onClick={async () => {
                  try {
                    await sendEmailVerification();
                    alert('Растау сілтемесі поштаңызға қайта жіберілді.');
                  } catch (err: any) {
                    alert('Қайта жіберу сәтсіз өтті: ' + err.message);
                  }
                }}
                className="py-3 border border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl transition-all font-sans text-xs cursor-pointer"
              >
                Хатты қайта жіберу
              </button>
            </div>

            <button
              onClick={() => signOut()}
              className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-850 dark:hover:bg-neutral-800 text-neutral-550 dark:text-neutral-400 font-bold rounded-xl transition-all cursor-pointer text-xs font-sans"
            >
              Шығу / Басқа пошта
            </button>
          </div>
        </div>
      ) : (
        
        /* LOGGED IN NAVIGATION FRAME */
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col transition-colors duration-300">
          
          <header className="sticky top-0 bg-white/80 dark:bg-neutral-900/85 backdrop-blur-md border-b border-neutral-150 dark:border-neutral-800 px-4 md:px-8 py-3.5 flex items-center justify-between z-40 transition-colors select-none">
            <div className="flex items-center gap-6">
              
              {/* Logo icon */}
              <div 
                onClick={() => { setActiveTab('all_tasks'); setSelectedTask(null); }}
                className="flex items-center gap-2 cursor-pointer scale-100 active:scale-95 transition-all"
              >
                <div className="w-10 h-10 rounded-2xl bg-teal-600 dark:bg-teal-700 flex items-center justify-center shadow-md">
                  <HeartHandshake className="w-5.5 h-5.5 text-white" />
                </div>
                <div className="text-left font-sans">
                  <span className="font-extrabold text-base tracking-tight text-teal-600 dark:text-white uppercase block leading-none">QOLDA.KZ</span>
                  <span className="text-[9px] text-neutral-400 font-extrabold block">БІЗ БІРГЕМІЗ</span>
                </div>
              </div>

              {/* Desktop menu tabs */}
              <nav className="hidden md:flex items-center gap-1 text-xs font-extrabold text-neutral-500">
                <button
                  onClick={() => { setActiveTab('all_tasks'); setSelectedTask(null); }}
                  className={`px-3.5 py-2.5 rounded-xl transition-all ${
                    activeTab === 'all_tasks' 
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm' 
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  Басты бет (Тапсырмалар)
                </button>
                <button
                  onClick={() => { setActiveTab('map_view'); setSelectedTask(null); }}
                  className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1 ${
                    activeTab === 'map_view' 
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm' 
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  <Map className="w-3.5 h-3.5" />
                  Халықтық карта
                </button>
                <button
                  onClick={() => { setActiveTab('create_task'); setSelectedTask(null); }}
                  className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1 ${
                    activeTab === 'create_task' 
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm' 
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Көмек сұрау
                </button>
                <button
                  onClick={() => { setActiveTab('my_dashboard'); setSelectedTask(null); }}
                  className={`px-3.5 py-2.5 rounded-xl transition-all ${
                    activeTab === 'my_dashboard' 
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm' 
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  Жеке бөлме
                </button>
                {userProfile?.isAdmin && (
                  <button
                    onClick={() => { setActiveTab('admin'); setSelectedTask(null); }}
                    className={`px-3 py-2 rounded-xl transition-all text-rose-605 dark:text-rose-400 font-extrabold border border-rose-100 dark:border-rose-950 flex items-center gap-1 ${
                      activeTab === 'admin' 
                        ? 'bg-rose-600 text-white border-transparent' 
                        : 'hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Админ панелі
                  </button>
                )}
              </nav>
            </div>

            {/* Quick Actions (dark toggle, notifies, profile drop, log out) */}
            <div className="flex items-center gap-2 md:gap-3 bg-transparent">
              
              {/* Dark mode trigger */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                title={theme === 'dark' ? 'Күндізгі режим' : 'Түнгі режим'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-600" />}
              </button>

              {/* Notification Center Trigger */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-all cursor-pointer"
                  title="Хабарландырулар"
                >
                  <Bell className="w-4 h-4 animate-in" />
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-600 rounded-full ring-2 ring-white dark:ring-neutral-900 animate-pulse" />
                  )}
                </button>

                {/* Notification Dropdown Box */}
                {showNotifications && (
                  <div className="absolute top-12 right-0 w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden z-50 p-2 text-xs animate-in slide-in-from-top-2 duration-150">
                    <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-905">
                      <span className="font-bold text-neutral-800 dark:text-neutral-100 font-sans">Хабарландырулар</span>
                      {notifications.filter(n => !n.isRead).length > 0 && (
                        <button 
                          onClick={handleMarkAllRead} 
                          className="text-[10px] text-teal-600 dark:text-teal-400 hover:underline font-bold font-sans cursor-pointer"
                        >
                          Барлығын белгілеу
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-72 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-850 p-1">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-neutral-400 text-[11px] font-sans">Хабарландырулар жоқ</div>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => handleNotificationClick(n.id)}
                            className={`p-3 rounded-lg text-left transition-colors cursor-pointer ${
                              n.isRead ? 'hover:bg-neutral-50 dark:hover:bg-neutral-850/50 opacity-70' : 'bg-teal-50/30 dark:bg-teal-950/10 hover:bg-teal-50/50 border-l-2 border-teal-500'
                            }`}
                          >
                            <div className="font-bold text-neutral-800 dark:text-neutral-200 text-[11px] mb-0.5">{n.title}</div>
                            <p className="text-neutral-550 dark:text-neutral-400 text-[10px] leading-relaxed mb-1">{n.message}</p>
                            <span className="text-[8px] text-neutral-403 block text-right">{new Date(n.createdAt).toLocaleDateString('kk')}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Identity display */}
              <div 
                onClick={() => setActiveTab('my_dashboard')}
                className="hidden md:flex items-center gap-2 cursor-pointer border border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-805 rounded-xl p-1.5 px-3 select-none"
              >
                {userProfile?.avatarUrl ? (
                  <img 
                    src={userProfile.avatarUrl} 
                    alt="" 
                    className="w-6 h-6 rounded-full object-cover border border-teal-500/25 shrink-0" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm shrink-0 ${AVATAR_STYLING[userProfile?.avatarId || 'avatar_1']}`}>
                    {AVATAR_EMOJIS[userProfile?.avatarId || 'avatar_1']}
                  </div>
                )}
                <div className="text-[10px] text-left">
                  <div className="font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[100px] font-sans">{userProfile?.name}</div>
                  <div className="text-neutral-400 text-[8px] font-sans">{userProfile?.city}</div>
                </div>
              </div>

              {/* Log out trigger */}
              <button
                onClick={() => showConfirm('Шығуды растау', 'Жүйеден шыққыңыз келетініне сенімдісіз бе?', () => signOut())}
                className="p-2.5 rounded-xl border border-neutral-200 hover:bg-rose-55 text-neutral-605 hover:text-rose-600 dark:border-neutral-800 dark:hover:bg-rose-950/20 dark:hover:text-rose-450 transition-all md:aspect-square flex items-center justify-center cursor-pointer"
                title="Шығу"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Mobile menu trigger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 cursor-pointer"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Mobile responsive sidebar list */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 p-4 space-y-2 text-xs font-bold"
              >
                <button
                  onClick={() => { setActiveTab('all_tasks'); setSelectedTask(null); setMobileMenuOpen(false); }}
                  className={`w-full text-left p-2.5 rounded-lg ${activeTab === 'all_tasks' ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400' : 'text-neutral-700 dark:text-neutral-200'}`}
                >
                  Барлық тапсырмалар
                </button>
                <button
                  onClick={() => { setActiveTab('map_view'); setSelectedTask(null); setMobileMenuOpen(false); }}
                  className={`w-full text-left p-2.5 rounded-lg flex items-center gap-1.5 ${activeTab === 'map_view' ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400' : 'text-neutral-700 dark:text-neutral-200'}`}
                >
                  <Map className="w-4 h-4 text-teal-600" />
                  Интерактивті карта
                </button>
                <button
                  onClick={() => { setActiveTab('create_task'); setSelectedTask(null); setMobileMenuOpen(false); }}
                  className={`w-full text-left p-2.5 rounded-lg flex items-center gap-1.5 ${activeTab === 'create_task' ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400' : 'text-neutral-700 dark:text-neutral-200'}`}
                >
                  <PlusCircle className="w-4 h-4 text-teal-600" />
                  Көмек сұрау / Жаңа жарияланым
                </button>
                <button
                  onClick={() => { setActiveTab('my_dashboard'); setSelectedTask(null); setMobileMenuOpen(false); }}
                  className={`w-full text-left p-2.5 rounded-lg ${activeTab === 'my_dashboard' ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400' : 'text-neutral-700 dark:text-neutral-200'}`}
                >
                  Жеке кабинет
                </button>
                {userProfile?.isAdmin && (
                  <button
                    onClick={() => { setActiveTab('admin'); setSelectedTask(null); setMobileMenuOpen(false); }}
                    className={`w-full text-left p-2.5 rounded-lg text-rose-600 bg-rose-50/50 dark:bg-rose-950/20 dark:text-rose-450 flex items-center gap-1.5`}
                  >
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    Админ панелі
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email Verification Banner */}
          {!currentUser.emailVerified && !hideWarningMessage && (
            <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-b border-amber-500/20 px-8 py-2.5 text-xs font-semibold flex flex-col md:flex-row md:items-center justify-between gap-2.5 transition-colors select-none">
              <div className="flex items-center gap-2 bg-transparent">
                <Info className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Электронды поштаңыз әлі расталмаған. Поштаңызды тексеріп, профиль қауіпсіздігін нығайтыңыз.</span>
              </div>
              <div className="flex items-center gap-4 flex-wrap bg-transparent">
                <button
                  onClick={async () => {
                    try {
                      await sendEmailVerification();
                      alert('Растау сілтемесі поштаңызға жіберілді');
                    } catch (e: any) {
                      alert('Нұсқаулық жіберу сәтсіз өтті: ' + String(e));
                    }
                  }}
                  className="self-start md:self-auto shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold p-1 px-3.5 rounded-lg transition-all cursor-pointer font-sans"
                >
                  Растау сілтемесін жіберу
                </button>
                <button
                  onClick={() => {
                    setThemeWarningDisplay();
                  }}
                  className="p-1 hover:bg-amber-500/20 rounded-md transition-colors"
                  title="Жабу"
                >
                  <X 
                    onClick={() => {
                      setHideWarningMessage(true);
                      sessionStorage.setItem('hideEmailWarning', 'true');
                    }}
                    className="w-4.5 h-4.5 text-amber-700 shrink-0 cursor-pointer" 
                  />
                </button>
              </div>
            </div>
          )}

          {/* MAIN PAGE CONTENTS */}
          <main className="max-w-7xl w-full mx-auto p-4 md:p-8 flex-grow">
            
            {/* 1. ALL TASKS VIEW */}
            {activeTab === 'all_tasks' && (
              <AllTasksPage 
                currentUser={currentUser}
                userProfile={userProfile}
                tasks={tasks}
                loadingTasks={loadingTasks}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedCity={selectedCity}
                setSelectedCity={setSelectedCity}
                sortBy={sortBy}
                setSortBy={setSortBy}
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
                handleAcceptTask={handleAcceptTask}
                handleCancelAcceptance={handleCancelAcceptance}
                handleCompleteTask={handleCompleteTask}
                handleDeleteTask={handleDeleteTask}
                setSelectedTask={setSelectedTask}
                setReportModalTarget={setReportModalTarget}
                setActiveTab={setActiveTab}
              />
            )}

            {/* 2. MAP VIEW */}
            {activeTab === 'map_view' && (
              <MapViewPage 
                theme={theme}
                tasks={tasks}
                currentUser={currentUser}
                handleAcceptTask={handleAcceptTask}
              />
            )}

            {/* 3. CREATE TASK */}
            {activeTab === 'create_task' && (
              <CreateTaskPage 
                userProfile={userProfile}
                theme={theme}
                setActiveTab={setActiveTab}
                onSuccess={async () => {
                  await loadTasks();
                  setActiveTab('all_tasks');
                  alert('Тапсырма сәтті жарияланды');
                }}
              />
            )}

            {/* 4. MY DASHBOARD */}
            {activeTab === 'my_dashboard' && (
              <MyDashboardPage 
                userProfile={userProfile}
                theme={theme}
                currentUser={currentUser}
                tasks={tasks}
                myReviews={myReviews}
                handleCancelAcceptance={handleCancelAcceptance}
                handleCompleteTask={handleCompleteTask}
                handleDeleteTask={handleDeleteTask}
                setSelectedTask={setSelectedTask}
                updateUserBio={updateUserBio}
                loadTasks={loadTasks}
              />
            )}

            {/* 5. ADMIN PANEL PANEL */}
            {activeTab === 'admin' && userProfile?.isAdmin && (
              <AdminPanel />
            )}

          </main>

          {/* DETAILED TASK VIEW OVERLAY DOCK */}
          <AnimatePresence>
            {selectedTask && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/45 backdrop-blur-md text-sm animate-in fade-in duration-150">
                
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   className="bg-white dark:bg-neutral-900 w-full max-w-xl rounded-3xl shadow-xl overflow-hidden flex flex-col border border-neutral-150 dark:border-neutral-800"
                >
                  {/* Header Detailed */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-905">
                    <div className="flex items-center gap-1.5 shrink-0 bg-transparent">
                      <span className="text-sm font-black text-neutral-800 dark:text-neutral-100 font-sans">Тапсырманың толық дерегі</span>
                    </div>
                    <button 
                      onClick={() => setSelectedTask(null)}
                      className="p-1 rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Body Detailed */}
                  <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh] bg-transparent">
                    
                    <div className="space-y-2 bg-transparent">
                      <div className="flex items-center gap-2 flex-wrap bg-transparent">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full font-sans ${
                          selectedTask.priority === 'high' ? 'bg-red-100 text-red-700' :
                          selectedTask.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {PRIORITY_LABELS[selectedTask.priority]} басымдық
                        </span>
                        <span className="px-2.5 py-0.5 text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 rounded-full text-neutral-600 dark:text-neutral-300 font-sans">
                          {STATUS_LABELS[selectedTask.status]}
                        </span>
                        <span className="text-xs font-bold text-teal-600 dark:text-teal-400 font-sans">
                          {CATEGORY_LABELS[selectedTask.category]}
                        </span>
                      </div>

                      <h2 className="text-xl font-black text-neutral-900 dark:text-neutral-50 font-sans bg-transparent">
                        {selectedTask.title}
                      </h2>
                    </div>

                    {/* Meta info grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-neutral-50 dark:bg-neutral-850/20 border border-neutral-150 dark:border-neutral-800 rounded-xl text-xs">
                      <div className="flex items-center justify-between gap-2 text-neutral-650 dark:text-neutral-300 bg-transparent min-w-0">
                        <div className="flex items-center gap-2 min-w-0 bg-transparent">
                          <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                          <div className="min-w-0 bg-transparent">
                            <div className="text-[10px] text-neutral-400 font-sans">Өтетін орны (Қала / Мекенжай):</div>
                            <div className="font-bold truncate font-sans" title={`${selectedTask.city}${selectedTask.address ? `, ${selectedTask.address}` : ''}`}>
                              {selectedTask.city}{selectedTask.address ? `, ${selectedTask.address}` : ''}
                            </div>
                          </div>
                        </div>
                        <a
                          href={
                            selectedTask.latitude && selectedTask.longitude
                              ? `https://www.google.com/maps/search/?api=1&query=${selectedTask.latitude},${selectedTask.longitude}`
                              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedTask.city + ' ' + (selectedTask.address || ''))}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 dark:text-teal-400 border border-teal-100 dark:border-teal-800 px-2 py-1 rounded-lg font-bold shrink-0 flex items-center gap-0.5 font-sans"
                        >
                          🗺️ Карта
                        </a>
                      </div>

                      <div className="flex items-center gap-2 text-neutral-650 dark:text-neutral-300 bg-transparent">
                        <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
                        <div className="bg-transparent">
                          <div className="text-[10px] text-neutral-400 font-sans">Орындау мерзімі (Мерзім):</div>
                          <div className="font-bold font-sans">{new Date(selectedTask.deadline).toLocaleDateString('kk')}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 bg-transparent">
                      <h4 className="font-extrabold text-xs text-neutral-700 dark:text-neutral-300 font-sans">Толық сипаттамасы:</h4>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed bg-neutral-50 dark:bg-neutral-850/10 p-4 rounded-xl border border-neutral-150 dark:border-neutral-800 h-[100px] overflow-y-auto">
                        {selectedTask.description}
                      </p>
                    </div>

                    {selectedTask.attachmentUrl && (
                      <div className="space-y-1.5 bg-transparent">
                        <h4 className="font-extrabold text-xs text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 font-sans">
                          <Paperclip className="w-3.5 h-3.5 text-teal-650 font-semibold" />
                          Қосымша бекітілген файл:
                        </h4>
                        <div className="p-3 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-150 dark:border-neutral-800 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 truncate bg-transparent">
                            <div className="w-10 h-10 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 font-sans">
                              IMAGE
                            </div>
                            <div className="truncate bg-transparent">
                              <span className="font-bold text-xs text-neutral-800 dark:text-neutral-200 block truncate font-sans">
                                Тапсырмаға қатысты құжат/сурет
                              </span>
                              <span className="text-[10px] text-neutral-400 block truncate font-sans">
                                Суретті толық өлшемде жүктеу немесе көру
                              </span>
                            </div>
                          </div>
                          <a 
                            href={selectedTask.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-[10px] font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors cursor-pointer shrink-0 font-sans"
                          >
                            Көру / Жүктеу
                          </a>
                        </div>
                        
                        {(selectedTask.attachmentUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) || selectedTask.attachmentUrl.includes('tasks_attachments')) && (
                          <div className="mt-2 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950/30 p-2">
                            <img 
                              src={selectedTask.attachmentUrl} 
                              alt="attachment preview" 
                              className="w-full max-h-48 object-contain hover:scale-[1.01] transition-all duration-300 rounded-lg animate-in" 
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Contact integration */}
                    <div className="border-t border-neutral-150 dark:border-neutral-800 pt-4 space-y-3 bg-transparent">
                      <h4 className="font-extrabold text-xs text-neutral-700 dark:text-neutral-300 font-sans">Тапсырма иесі (Көмек сұраушы):</h4>
                      <div className="flex items-center justify-between p-3.5 bg-neutral-50 dark:bg-neutral-850/20 border border-neutral-150 dark:border-neutral-800 rounded-xl">
                        <div className="flex items-center gap-3 bg-transparent">
                          {selectedTask.creatorAvatarUrl ? (
                            <img 
                              src={selectedTask.creatorAvatarUrl} 
                              alt="" 
                              className="w-10 h-10 rounded-xl object-cover border border-teal-500/25 shrink-0 animate-in fade-in"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl shrink-0 ${AVATAR_STYLING[selectedTask.creatorAvatar || 'avatar_1']}`}>
                              {AVATAR_EMOJIS[selectedTask.creatorAvatar || 'avatar_1']}
                            </div>
                          )}
                          <div className="bg-transparent">
                            <div className="font-bold text-neutral-800 dark:text-neutral-150 font-sans">{selectedTask.creatorName}</div>
                            <div className="text-[9px] text-neutral-450 uppercase font-black tracking-wider">Профиль белсенді</div>
                          </div>
                        </div>

                        {/* Dialing and Coordination is only visible to creator, volunteer or admins as per security standard */}
                        {(selectedTask.creatorId === currentUser.uid || selectedTask.volunteerId === currentUser.uid || userProfile?.isAdmin) ? (
                          <div className="flex items-center gap-2 bg-transparent">
                            <a 
                              href={`tel:${selectedTask.creatorId === currentUser.uid ? userProfile?.phone : 'телефон байланысы'}`} 
                              className="p-2 bg-teal-50 hover:bg-teal-100 text-teal-605 rounded-xl transition-all"
                              title="Телефон шалу"
                            >
                              <PhoneCall className="w-4 h-4" />
                            </a>
                            <span className="text-xs font-extrabold text-teal-650 font-sans">Тегін байланыс рұқсат</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-neutral-400 text-right shrink-0 bg-transparent font-sans leading-relaxed">
                            Телефон байланысы тек <br /><strong>Ерікті орнында көрсетіледі</strong>
                          </span>
                        )}
                      </div>

                      {/* Display Creator's Phone explicitly if user is the assigned volunteer */}
                      {selectedTask.volunteerId === currentUser.uid && (
                        <div className="p-3 bg-teal-50 dark:bg-teal-950/20 text-teal-850 dark:text-teal-400 rounded-xl text-center text-xs font-bold border border-teal-500/20 dark:border-teal-900/10 flex items-center justify-center gap-2">
                          <Smartphone className="w-4 h-4 text-teal-600" />
                          <span>Байланыс телефоны: <strong className="text-sm select-all font-sans">{selectedTask.creatorName} телефон номерлерімен сөйлесуге ашық!</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Actions Panel inside Modal */}
                    <div className="border-t border-neutral-150 dark:border-neutral-800 pt-4 flex gap-2 justify-end bg-transparent">
                      <button 
                        onClick={() => setSelectedTask(null)}
                        className="py-2.5 px-4 font-bold text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 cursor-pointer"
                      >
                        Жабу
                      </button>

                      {(selectedTask.status === TaskStatus.ACTIVE || selectedTask.status === 'new' as any) && selectedTask.creatorId !== currentUser.uid && (
                        <button
                          onClick={() => handleAcceptTask(selectedTask.id)}
                          className="py-2.5 px-6 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <HeartHandshake className="w-4 h-4" />
                          Көмектесуді бастау
                        </button>
                      )}

                      {(selectedTask.status === TaskStatus.ACCEPTED || selectedTask.status === 'in_progress' as any) && selectedTask.volunteerId === currentUser.uid && (
                        <button
                          onClick={() => handleCancelAcceptance(selectedTask.id)}
                          className="py-2.5 px-5 border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-xl cursor-pointer"
                        >
                          Орындаудан бас тарту
                        </button>
                      )}

                      {(selectedTask.status === TaskStatus.ACCEPTED || selectedTask.status === 'in_progress' as any) && selectedTask.creatorId === currentUser.uid && (
                        <button
                          onClick={() => handleCompleteTask(selectedTask.id)}
                          className="py-2.5 px-5 bg-green-600 hover:bg-green-700 text-white text-xs font-extrabold rounded-xl cursor-pointer"
                        >
                          Көмек сәтті көрсетілді (Растау)
                        </button>
                      )}
                    </div>

                  </div>
                </motion.div>

              </div>
            )}
          </AnimatePresence>

          {/* REPORT SUBMISSION FORM MODAL CONTROL */}
          {reportModalTarget && (
            <ReportModal
              isOpen={reportModalTarget !== null}
              targetType="task"
              targetLabel={reportModalTarget.title}
              onClose={() => setReportModalTarget(null)}
              onSubmit={handleReportSubmit}
            />
          )}

          {/* REVIEW SUBMISSION POPUP FORM MODAL TRIGGER */}
          {reviewModalTarget && (
            <ReviewModal
              isOpen={reviewModalTarget !== null}
              taskId={reviewModalTarget.id}
              targetUserName={reviewModalTarget.name}
              onClose={() => setReviewModalTarget(null)}
              onSubmit={handleReviewSubmit}
            />
          )}

          {/* CUSTOM CONFIRMATION DIALOG MODAL */}
          <AnimatePresence>
            {confirmDialog && (
              <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setConfirmDialog(null)}
                  className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs cursor-pointer"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="relative w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl z-10 text-left space-y-4"
                >
                  <div className="flex items-start gap-4">
                    {confirmDialog.iconType === 'warning' && (
                      <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-rose-950/30 text-rose-605 dark:text-rose-400 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-900/30">
                        <AlertTriangle className="w-6 h-6 animate-pulse text-red-600" />
                      </div>
                    )}
                    <div className="space-y-1.5 min-w-0 flex-1 bg-transparent">
                      <h3 className="text-sm font-black text-neutral-900 dark:text-neutral-50 leading-snug font-sans bg-transparent">
                        {confirmDialog.title}
                      </h3>
                      <p className="text-neutral-500 dark:text-neutral-400 text-xs leading-relaxed whitespace-pre-line font-medium bg-transparent">
                        {confirmDialog.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 text-xs pt-2 bg-transparent">
                    <button
                      onClick={() => setConfirmDialog(null)}
                      className="px-4 py-2 border border-neutral-200 dark:border-neutral-800 text-neutral-650 dark:text-neutral-350 font-bold rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all cursor-pointer hover:shadow-xs"
                    >
                      {confirmDialog.cancelText || 'Бас тарту'}
                    </button>
                    <button
                      onClick={confirmDialog.onConfirm}
                      className={`px-4 py-2 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                        confirmDialog.isDestructive 
                          ? 'bg-rose-600 hover:bg-rose-700 hover:shadow-rose-600/10' 
                          : 'bg-teal-600 hover:bg-teal-700 hover:shadow-teal-600/10'
                      }`}
                    >
                      {confirmDialog.confirmText || 'Иә, растаймын'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Page Footer (strictly matches anti-larping, anti-status noise principles) */}
          <footer className="bg-white dark:bg-neutral-900 border-t border-neutral-150 dark:border-neutral-800 py-6 text-center text-xs text-neutral-450 dark:text-neutral-500 transition-colors">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 bg-transparent">
                <HeartHandshake className="w-4 h-4 text-teal-600" />
                <span><strong>Qolda.kz</strong> &mdash; Ұлы Дала елінің бірлік пен жәрдем еріктілер платформасы.</span>
              </div>
              <div className="flex items-center gap-4 bg-transparent font-sans">
                <span>© {new Date().getFullYear()}</span>
                <span>Қызылорда &bull; Астана &bull; Алматы</span>
              </div>
            </div>
          </footer>

        </div>
      )}

    </div>
  );
}

const themeWarningStyleTemp = "theme" in window ? "" : "undefined";
function setThemeWarningDisplay() {
  return themeWarningStyleTemp;
}

// Global top-level bootstrap wrapper providing Context parameters
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QoldaApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
