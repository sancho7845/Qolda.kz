import React, { useEffect, useState } from 'react';
import { useAuth, AuthProvider } from './AuthContext';
import { useTheme, ThemeProvider } from './ThemeContext';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import { Paperclip, UploadCloud } from 'lucide-react';
import { 
  getTasks, 
  createTask, 
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
  subscribeTasks
} from './dbService';
import { Task, TaskCategory, TaskPriority, TaskStatus, UserProfile, CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS, PRESET_AVATARS, AVATAR_EMOJIS, AVATAR_STYLING, KAZAKHSTAN_CITIES } from './types';
import TaskCard from './components/TaskCard';
import { InteractiveMap, isInsideAlmaty } from './components/InteractiveMap';
import ReportModal from './components/ReportModal';
import ReviewModal from './components/ReviewModal';
import AdminPanel from './components/AdminPanel';
import { 
  HeartHandshake, 
  MapPin, 
  Map, 
  Calendar, 
  Clock, 
  Plus, 
  Search, 
  LogOut, 
  Moon, 
  Sun, 
  Bell, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  Filter, 
  ShieldAlert, 
  Smartphone,
  Check, 
  Lock, 
  Mail, 
  Info,
  Sparkles, 
  PhoneCall, 
  FileText,
  ChevronRight,
  MessageSquare,
  Star as StarIcon,
  X,
  PlusCircle,
  Menu,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function QoldaApp() {
  const { currentUser, userProfile, loading, signIn, signUp, signOut, sendPasswordResetEmail, sendEmailVerification, refreshProfile, updateUserBio } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Tasks States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [activeTab, setActiveTab] = useState<'all_tasks' | 'map_view' | 'my_dashboard' | 'create_task' | 'admin'>('all_tasks');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'deadline' | 'priority'>('newest');

  // Input States for New Task
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskCat, setNewTaskCat] = useState<TaskCategory>(TaskCategory.OTHER);
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskCity, setNewTaskCity] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [newTaskAddress, setNewTaskAddress] = useState('');
  const [newTaskLatitude, setNewTaskLatitude] = useState<number | null>(null);
  const [newTaskLongitude, setNewTaskLongitude] = useState<number | null>(null);
  const [newTaskLocationSource, setNewTaskLocationSource] = useState<'manual' | 'geolocation' | null>(null);
  const [geolocationStatusText, setGeolocationStatusText] = useState<string | null>(null);
  const [geolocationErrorText, setGeolocationErrorText] = useState<string | null>(null);

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

  // Storage configuration/guidance warning state
  const [storageErrorWarning, setStorageErrorWarning] = useState<boolean>(false);

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

  // Auth Forms
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState(KAZAKHSTAN_CITIES[0]);
  const [phone, setPhone] = useState('');
  const [avatarIndex, setAvatarIndex] = useState('avatar_1');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);

  // Edit profile toggle
  const [editProfileMode, setEditProfileMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  // Mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch initial tasks
  const loadTasks = async () => {
    setLoadingTasks(true);
    try {
      const allTasks = await getTasks(!!userProfile?.isAdmin);
      setTasks(allTasks);
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
        (allTasks) => {
          setTasks(allTasks);
          setLoadingTasks(false);
        },
        (err) => {
          console.error('Real-time listener failed:', err);
          setLoadingTasks(false);
        },
        !!userProfile?.isAdmin
      );

      loadNotificationsAndReviews();
      // Auto-polling interval for notifications (clean simple approach)
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

  // Auth Execution handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    try {
      await signIn(email, password);
    } catch (err: any) {
      setAuthError('Қате: Пайдаланушы аты немесе құпия сөз дұрыс емес, немесе аккаунт табылмады.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    if (!name.trim()) {
      setAuthError('Аты-жөніңізді енгізіңіз');
      return;
    }
    if (!phone.replace(/\D/g, '')) {
      setAuthError('Телефон нөмірін енгізіңіз');
      return;
    }
    try {
      await signUp(email, password, name, city, phone, avatarIndex);
      setAuthSuccess('Тіркелу сәтті аяқталды! Жүйеге қосылудасыз...');
    } catch (err: any) {
      setAuthError('Тіркелу кезінде қате орын алды: ' + err.message);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    if (!email) {
      setAuthError('Поштаңызды енгізіңіз');
      return;
    }
    try {
      await sendPasswordResetEmail(email);
      setAuthSuccess('Құпия сөзді қалпына келтіру сілтемесі поштаңызға жіберілді!');
    } catch (err: any) {
      setAuthError('Қате: ' + err.message);
    }
  };

  useEffect(() => {
    if (activeTab === 'create_task' && userProfile?.city && !newTaskCity) {
      setNewTaskCity(userProfile.city);
    }
  }, [activeTab, userProfile, newTaskCity]);

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
      // Find task to get volunteer details for review trigger
      const taskObj = tasks.find(t => t.id === taskId);
      if (!taskObj) return;

      await completeTask(taskId);
      await loadTasks();
      await loadNotificationsAndReviews();
      
      // Trigger review modal targeting the volunteer
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

  const handleUseMyLocation = () => {
    setGeolocationStatusText('Орналасқан жерді анықтау...');
    setGeolocationErrorText(null);
    if (!navigator.geolocation) {
      const msg = "Сіздің браузеріңіз геолокацияны қолдамайды.";
      setGeolocationErrorText(msg);
      setGeolocationStatusText(null);
      alert(msg);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setNewTaskLatitude(lat);
        setNewTaskLongitude(lng);
        setNewTaskLocationSource('geolocation');
        setGeolocationStatusText("Орналасқан жер анықталды");
        setGeolocationErrorText(null);
        
        if (!isInsideAlmaty(lat, lng)) {
          alert("Ескерту: Анықталған орналасқан жер Алматы шекарасынан тыс! Карта тек Алматы қаласы бойынша жұмыс істейді.");
          setGeolocationErrorText("Орналасқан жер Алматыдан тыс");
        } else {
          alert("Орналасқан жер анықталды");
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setGeolocationErrorText("Геолокацияға рұқсат берілмеді");
        setGeolocationStatusText(null);
        alert("Геолокацияға рұқсат берілмеді");
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      alert('Профиль ақпараты әлі жүктелуде немесе табылған жоқ. Жүйеге қайта кіріп көріңіз.');
      return;
    }
    if (userProfile.isBanned) {
      alert('Сіз бұғатталғансыз. Тапсырма жасай алмайсыз.');
      return;
    }

    // Step-by-step Kazakh validation
    if (!newTaskTitle.trim()) {
      alert('Тапсырма атауын (тақырыбын) толтыру қажет!');
      return;
    }
    if (!newTaskDesc.trim()) {
      alert('Тапсырма сипаттамасын толтыру қажет!');
      return;
    }
    if (!newTaskCat) {
      alert('Санатты таңдау қажет!');
      return;
    }
    if (!newTaskPriority) {
      alert('Жеделдікті (басымдықты) таңдау қажет!');
      return;
    }
    if (!newTaskDeadline) {
      alert('Аяқтаудың соңғы мерзімін енгізу қажет!');
      return;
    }
    if (!newTaskCity) {
      alert('Қаланы таңдау қажет!');
      return;
    }

    let attachmentUrl = '';
    let attachmentName = '';
    let attachmentSize = 0;

    if (attachmentFile) {
      try {
        setUploadProgress(1); // Starting mark
        const uniqueFileName = `${Date.now()}_${attachmentFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const fileRef = ref(storage, `tasks_attachments/${uniqueFileName}`);
        const uploadTask = uploadBytesResumable(fileRef, attachmentFile);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              setUploadProgress(progress);
            },
            (error) => {
              reject(error);
            },
            () => {
              resolve();
            }
          );
        });

        attachmentUrl = await getDownloadURL(fileRef);
        attachmentName = attachmentFile.name;
        attachmentSize = attachmentFile.size;
        setUploadProgress(null);
      } catch (uploadErr) {
        console.error('File upload error details:', uploadErr);
        const errStr = String(uploadErr);
        const isAuthError = errStr.includes('unauthorized') || errStr.includes('permission') || errStr.includes('403');
        
        if (isAuthError && attachmentFile.size <= 800 * 1024) {
          try {
            const base64Url = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = (e) => reject(e);
              reader.readAsDataURL(attachmentFile);
            });
            attachmentUrl = base64Url;
            attachmentName = attachmentFile.name;
            attachmentSize = attachmentFile.size;
            setStorageErrorWarning(true);
            console.log('Firebase Storage upload failed due to rules permission. Successfully fell back to storing inline base64 data URL.');
          } catch (fallbackErr) {
            alert('Файлды кірістіру барысында қате орын алды: ' + String(fallbackErr));
            setUploadProgress(null);
            return;
          }
        } else if (isAuthError) {
          setStorageErrorWarning(true);
          alert('Файлды жүктеуге құқық жеткіліксіз (storage/unauthorized). Сіз өлшемі 800 КБ-тан кіші файлды жүктей аласыз (ол автоматты түрде кірістіріледі) немесе Firebase консолінде Storage ережелерін жаңартыңыз.');
          setUploadProgress(null);
          return;
        } else {
          alert('Файлды жүктеу сәтсіз аяқталды: ' + errStr);
          setUploadProgress(null);
          return;
        }
        setUploadProgress(null);
      }
    }

    try {
      await createTask(
        newTaskTitle,
        newTaskDesc,
        newTaskCat,
        newTaskPriority,
        newTaskDeadline,
        newTaskCity,
        userProfile,
        attachmentUrl || undefined,
        attachmentName || undefined,
        attachmentSize || undefined,
        newTaskAddress,
        newTaskLatitude,
        newTaskLongitude,
        newTaskLocationSource
      );

      // reset states
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskDeadline('');
      setAttachmentFile(null);
      setNewTaskAddress('');
      setNewTaskLatitude(null);
      setNewTaskLongitude(null);
      setNewTaskLocationSource(null);
      
      // reset filters to ensure newly created task shows up
      setSearchQuery('');
      setSelectedCategory('all');
      setSelectedCity('all');
      setSelectedStatus('all');
      setSortBy('newest');

      // hide the warning/helper message after task published
      setHideWarningMessage(true);

      await loadTasks();
      setActiveTab('all_tasks');
      alert('Тапсырма сәтті жарияланды');
    } catch (e: any) {
      console.error('Task creation failed in Firestore:', e);
      alert('Өтініш жасау сәтсіз аяқталды: ' + String(e));
    }
  };

  // Profile management edit action
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    try {
      await updateUserBio({
        name: editName,
        city: editCity,
        phone: editPhone,
        avatarId: editAvatar
      });
      setEditProfileMode(false);
      await loadTasks(); // refresh task labels if any changed
      alert('Профиль мәліметтеріңіз сәтті өзгертілді!');
    } catch (err: any) {
      alert('Профильді жаңарту сәтсіз өтті: ' + String(err));
    }
  };

  const handleOpenEditProfile = () => {
    if (!userProfile) return;
    setEditName(userProfile.name);
    setEditCity(userProfile.city);
    setEditPhone(userProfile.phone || '');
    setEditAvatar(userProfile.avatarId || 'avatar_1');
    setEditProfileMode(true);
  };

  // Report & Review Submission handlers
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
      alert('Шағымыңыз сәтті қабылданды, модераторлар жақын арада тексеру жүргізеді.');
    } catch (err: any) {
      alert('Шағым жіберу кезінде қате кетті: ' + String(err));
    }
  };

  const handleReviewSubmit = async (rating: number, text: string) => {
    if (!userProfile || !reviewModalTarget) return;
    try {
      await submitReview(
        reviewModalTarget.id, // target user ID (the volunteer)
        userProfile.uid,
        userProfile.name,
        userProfile.avatarId || 'avatar_1',
        reviewModalTarget.id,
        rating,
        text
      );
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

  // Filter lists dynamically
  const filteredTasks = tasks.filter(task => {
    // 1. Text Search
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Category Filter
    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;

    // 3. City Filter
    const matchesCity = selectedCity === 'all' || task.city === selectedCity;

    // 4. Status Filter
    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus;

    // Filter out if user is banned (normally handled rules-side, but keep interface clean)
    return matchesSearch && matchesCategory && matchesCity && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'deadline') {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    if (sortBy === 'priority') {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    }
    // newest default
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Calculate my stats
  const activeRequestsCount = tasks.filter(t => t.creatorId === currentUser?.uid && t.status !== TaskStatus.COMPLETED).length;
  const myCompletedRequestsCount = tasks.filter(t => t.creatorId === currentUser?.uid && t.status === TaskStatus.COMPLETED).length;
  const activeVolunteeringCount = tasks.filter(t => t.volunteerId === currentUser?.uid && t.status === TaskStatus.IN_PROGRESS).length;
  const myCompletedVolunteeringCount = tasks.filter(t => t.volunteerId === currentUser?.uid && t.status === TaskStatus.COMPLETED).length;

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
        <div className="bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-950 rounded-2xl p-8 max-w-md text-center space-y-4 shadow-lg">
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
            className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 text-white font-bold rounded-xl transition-all"
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
        <div className="min-h-screen flex flex-col md:flex-row">
          
          {/* Aesthetic Intro Panel */}
          <div className="md:w-1/2 bg-teal-900/75 text-teal-50 p-10 md:p-16 flex flex-col justify-between relative overflow-hidden border-r border-white/10 backdrop-blur-md">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-800/80 to-teal-950/90 opacity-90" />
            
            {/* Ambient pattern decorations */}
            <div className="absolute -top-12 -left-12 w-64 h-64 bg-teal-600/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-emerald-500/25 rounded-full blur-3xl" />

            <div className="relative z-10 space-y-4">
              <span className="bg-teal-700/50 text-emerald-450 border border-teal-500/30 font-black tracking-widest text-[10px] uppercase py-1.5 px-3.5 rounded-full inline-block">
                ҚОҒАМДЫҚ КӨМЕК ОРТАЛЫҒЫ
              </span>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none text-white flex items-center gap-2">
                Qolda.kz 🤝
              </h1>
              <p className="text-teal-150 text-sm max-w-sm leading-relaxed font-medium">
                Біз қиын жағдайға тап болған отандастарымызға және оларға қол ұшын созуға дайын жомарт еріктілерге ортақ көмек көпірін құрамыз.
              </p>
            </div>

            <div className="relative z-10 space-y-6 mt-12 md:mt-0">
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-lg bg-teal-700/60 text-emerald-400 text-xs font-bold flex items-center justify-center">👵</div>
                  <div>
                    <h4 className="font-bold text-xs text-white">Қарттарға және мұқтаждарға қолдау</h4>
                    <p className="text-[11px] text-teal-200">Үй жұмысы, азық-түлік тасу немесе аула күтіміне қолұшын беру</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-lg bg-teal-700/60 text-emerald-400 text-xs font-bold flex items-center justify-center">📚</div>
                  <div>
                    <h4 className="font-bold text-xs text-white">Тегін білім беру және бағыт таңдау</h4>
                    <p className="text-[11px] text-teal-200">Жасөспірімдердің сабағына жәрдемдесіп, технологияны түсіндіру</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-lg bg-teal-700/60 text-emerald-400 text-xs font-bold flex items-center justify-center">✨</div>
                  <div>
                    <h4 className="font-bold text-xs text-white">Жомарттық қоғамдастығы</h4>
                    <p className="text-[11px] text-teal-200">Тапсырмаларды орындап, рейтингіңіз бен статистикаңызды өсіріңіз</p>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-teal-300 border-t border-teal-700/50 pt-4 flex justify-between items-center">
                <span>© {new Date().getFullYear()} Qolda.kz</span>
                <span>Қазақстан &bull; Біргеміз</span>
              </div>
            </div>
          </div>

          {/* Form Panel */}
          <div className="md:w-1/2 bg-white/45 dark:bg-neutral-950/25 p-8 md:p-16 backdrop-blur-xl flex flex-col justify-center">
            <div className="max-w-md w-full mx-auto space-y-6">
              
              {/* Reset Password flow */}
              {forgotPasswordMode ? (
                <div className="space-y-4">
                  <div>
                    <button 
                      onClick={() => setForgotPasswordMode(false)} 
                      className="text-xs text-teal-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      &larr; Артқа қайту
                    </button>
                    <h2 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 mt-4">Құпия сөзді ұмыттыңыз ба?</h2>
                    <p className="text-neutral-500 text-xs dark:text-neutral-400">Тіркелген поштаңызды енгізіңіз. Біз құпия сөзді жаңарту сілтемесін жібереміз.</p>
                  </div>

                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Электронды пошта:</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="mysal@qolda.kz"
                        className="w-full p-3 rounded-xl border border-neutral-200 focus:border-teal-500 bg-transparent text-sm dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 outline-none transition-all"
                      />
                    </div>

                    {authError && <div className="p-3 bg-red-50 dark:bg-red-950/20 text-rose-600 text-xs rounded-xl font-semibold border border-red-100 dark:border-red-900">{authError}</div>}
                    {authSuccess && <div className="p-3 bg-green-50 dark:bg-green-950/20 text-green-600 text-xs rounded-xl font-semibold border border-green-100 dark:border-green-900">{authSuccess}</div>}

                    <button
                      type="submit"
                      className="w-full py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold rounded-xl transition-all text-xs"
                    >
                      Қалпына келтіру сілтемесін алу
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Tab Selector */}
                  <div className="flex border-b border-neutral-100 dark:border-neutral-800 pb-1 gap-4">
                    <button
                      onClick={() => { setAuthTab('login'); setAuthError(''); setAuthSuccess(''); }}
                      className={`pb-2.5 text-base font-black relative transition-all ${
                        authTab === 'login' 
                          ? 'text-teal-600 dark:text-teal-400' 
                          : 'text-neutral-400 dark:text-neutral-500'
                      }`}
                    >
                      Жүйеге кіру
                      {authTab === 'login' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />}
                    </button>
                    <button
                      onClick={() => { setAuthTab('register'); setAuthError(''); setAuthSuccess(''); }}
                      className={`pb-2.5 text-base font-black relative transition-all ${
                        authTab === 'register' 
                          ? 'text-teal-600 dark:text-teal-400' 
                          : 'text-neutral-400 dark:text-neutral-500'
                      }`}
                    >
                      Жаңа тіркелу
                      {authTab === 'register' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />}
                    </button>
                  </div>

                  {/* Errors / Success displays */}
                  {authError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 text-rose-600 text-xs rounded-xl font-semibold border border-red-100 dark:border-red-900">
                      {authError}
                    </div>
                  )}
                  {authSuccess && (
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 text-green-600 text-xs rounded-xl font-semibold border border-green-100 dark:border-green-900">
                      {authSuccess}
                    </div>
                  )}

                  {/* LOGIN FORM */}
                  {authTab === 'login' ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-neutral-400" />
                          Электрондық пошта:
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="mysal@qolda.kz"
                          className="w-full p-3 rounded-xl border border-white/20 focus:border-teal-500 bg-transparent text-sm dark:border-neutral-800 text-neutral-805 dark:text-neutral-100 outline-none glass-input"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5 text-neutral-400" />
                            Құпия сөз:
                          </label>
                          <button
                            type="button"
                            onClick={() => setForgotPasswordMode(true)}
                            className="text-[11px] text-teal-600 hover:underline font-semibold"
                          >
                            Құпия сөзді ұмыттыңыз ба?
                          </button>
                        </div>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full p-3 rounded-xl border border-white/20 focus:border-teal-500 bg-transparent text-sm dark:border-neutral-800 text-neutral-805 dark:text-neutral-100 outline-none glass-input"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold rounded-xl transition-all text-xs"
                      >
                        Жүйеге кіру
                      </button>
                    </form>
                  ) : (
                    
                    /* REGISTER FORM */
                    <form onSubmit={handleRegister} className="space-y-3">
                      
                      {/* Avatar Picker visually represented in Kazakh */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400">
                          Қоғамдық бейнеңіз (Аватар таңдаңыз):
                        </label>
                        <div className="grid grid-cols-6 gap-2">
                          {PRESET_AVATARS.map((avId) => (
                            <button
                              type="button"
                              key={avId}
                              onClick={() => setAvatarIndex(avId)}
                              className={`aspect-square rounded-xl flex items-center justify-center text-xl transition-all hover:scale-110 ${AVATAR_STYLING[avId]} ${
                                avatarIndex === avId 
                                  ? 'ring-2 ring-teal-600 scale-105' 
                                  : 'opacity-70'
                              }`}
                            >
                              {AVATAR_EMOJIS[avId]}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Аты-жөніңіз (Кәсіби немесе толық):</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Мысалы: Әлихан Сұлтанов"
                          className="w-full p-2.5 rounded-xl border border-neutral-200 focus:border-teal-500 bg-transparent text-sm dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Тұрғылықты қалаңыз:</label>
                          <select
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-neutral-200 focus:border-teal-500 bg-transparent text-sm dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 outline-none"
                          >
                            {KAZAKHSTAN_CITIES.map((c) => (
                              <option key={c} value={c} className="dark:text-neutral-800">{c}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Байланыс телефоны:</label>
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+7 (707) 123-4567"
                            className="w-full p-2.5 rounded-xl border border-neutral-200 focus:border-teal-500 bg-transparent text-sm dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Электронды пошта:</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="mysal@qolda.kz"
                          className="w-full p-2.5 rounded-xl border border-neutral-200 focus:border-teal-500 bg-transparent text-sm dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Құпия сөз (Кемінде 6 белгі):</label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full p-2.5 rounded-xl border border-neutral-200 focus:border-teal-500 bg-transparent text-sm dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 mt-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold rounded-xl transition-all text-xs"
                      >
                        Тіркелу және Бастау
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        
        /* AUTHENTICATED CORE INTERFACE */
        <div className="min-h-screen flex flex-col justify-between">
          
          {/* Main Navigation Header */}
          <header className="sticky top-0 z-40 glass-header px-4 md:px-8 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 
                onClick={() => setActiveTab('all_tasks')}
                className="text-lg font-black tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-1.5 cursor-pointer hover:opacity-90 select-none"
              >
                <HeartHandshake className="w-5.5 h-5.5 text-teal-600 shrink-0" />
                <span>Qolda.kz</span>
                <span className="text-[10px] uppercase font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.5 rounded-md ml-1 border border-teal-100 dark:border-teal-900">Бет</span>
              </h1>

              {/* Desktop Nav tabs */}
              <nav className="hidden md:flex items-center gap-1.5 text-xs font-bold">
                <button
                  onClick={() => { setActiveTab('all_tasks'); setSelectedTask(null); }}
                  className={`px-3 py-2 rounded-xl transition-all ${
                    activeTab === 'all_tasks' 
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950' 
                      : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-450 dark:hover:bg-neutral-850'
                  }`}
                >
                  Барлық тапсырмалар
                </button>
                <button
                  onClick={() => { setActiveTab('map_view'); setSelectedTask(null); }}
                  className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1 ${
                    activeTab === 'map_view' 
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950' 
                      : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-450 dark:hover:bg-neutral-850'
                  }`}
                >
                  <Map className="w-3.5 h-3.5 text-teal-605" />
                  Интерактивті карта
                </button>
                <button
                  onClick={() => { setActiveTab('create_task'); setSelectedTask(null); }}
                  className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1 ${
                    activeTab === 'create_task' 
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950' 
                      : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-450 dark:hover:bg-neutral-850'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Көмек сұрау
                </button>
                <button
                  onClick={() => { setActiveTab('my_dashboard'); setSelectedTask(null); }}
                  className={`px-3 py-2 rounded-xl transition-all ${
                    activeTab === 'my_dashboard' 
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950' 
                      : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-450 dark:hover:bg-neutral-850'
                  }`}
                >
                  Жеке бөлме
                </button>
                {userProfile?.isAdmin && (
                  <button
                    onClick={() => { setActiveTab('admin'); setSelectedTask(null); }}
                    className={`px-3 py-2 rounded-xl transition-all text-rose-600 dark:text-rose-400 font-extrabold border border-rose-100 dark:border-rose-950 flex items-center gap-1 ${
                      activeTab === 'admin' 
                        ? 'bg-rose-600 text-white border-transparent' 
                        : 'hover:bg-rose-50 dark:hover:bg-rose-950/20'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Админ панелі
                  </button>
                )}
              </nav>
            </div>

            {/* Quick Actions (dark toggle, notifies, profile drop, log out) */}
            <div className="flex items-center gap-2 md:gap-3">
              
              {/* Dark mode trigger */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-55 dark:border-neutral-800 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
                title={theme === 'dark' ? 'Күндізгі режим' : 'Түнгі режим'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-600" />}
              </button>

              {/* Notification Center Trigger */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-55 dark:border-neutral-800 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-all"
                  title="Хабарландырулар"
                >
                  <Bell className="w-4 h-4" />
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-600 rounded-full ring-2 ring-white dark:ring-neutral-900 animate-pulse" />
                  )}
                </button>

                {/* Notification Dropdown Box */}
                {showNotifications && (
                  <div className="absolute top-12 right-0 w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden z-50 p-2 text-xs">
                    <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
                      <span className="font-bold text-neutral-800 dark:text-neutral-100">Хабарландырулар</span>
                      {notifications.filter(n => !n.isRead).length > 0 && (
                        <button 
                          onClick={handleMarkAllRead} 
                          className="text-[10px] text-teal-600 dark:text-teal-400 hover:underline font-bold"
                        >
                          Барлығын оқыған деп белгілеу
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-72 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-850 p-1">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-neutral-400 text-[11px]">Хабарландырулар жоқ</div>
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
                            <p className="text-neutral-500 dark:text-neutral-400 text-[10px] leading-relaxed mb-1">{n.message}</p>
                            <span className="text-[8px] text-neutral-400">{new Date(n.createdAt).toLocaleDateString('kk')}</span>
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
                className="hidden md:flex items-center gap-2 cursor-pointer border border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800 rounded-xl p-1.5 px-3 select-none"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${AVATAR_STYLING[userProfile?.avatarId || 'avatar_1']}`}>
                  {AVATAR_EMOJIS[userProfile?.avatarId || 'avatar_1']}
                </div>
                <div className="text-[10px] text-left">
                  <div className="font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[100px]">{userProfile?.name}</div>
                  <div className="text-neutral-400 text-[8px]">{userProfile?.city}</div>
                </div>
              </div>

              {/* Log out trigger */}
              <button
                onClick={() => showConfirm('Шығуды растау', 'Жүйеден шыққыңыз келетініне сенімдісіз бе?', () => signOut())}
                className="p-2.5 rounded-xl border border-neutral-200 hover:bg-rose-50 text-neutral-600 hover:text-rose-600 dark:border-neutral-850 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 transition-all md:aspect-square flex items-center justify-center cursor-pointer"
                title="Шығу"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Mobile menu trigger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300"
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
                  className={`w-full text-left p-2.5 rounded-lg ${activeTab === 'all_tasks' ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400' : 'text-neutral-650'}`}
                >
                  Барлық тапсырмалар
                </button>
                <button
                  onClick={() => { setActiveTab('map_view'); setSelectedTask(null); setMobileMenuOpen(false); }}
                  className={`w-full text-left p-2.5 rounded-lg flex items-center gap-1.5 ${activeTab === 'map_view' ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400' : 'text-neutral-650'}`}
                >
                  <Map className="w-4 h-4 text-teal-605" />
                  Интерактивті карта
                </button>
                <button
                  onClick={() => { setActiveTab('create_task'); setSelectedTask(null); setMobileMenuOpen(false); }}
                  className={`w-full text-left p-2.5 rounded-lg flex items-center gap-1.5 ${activeTab === 'create_task' ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400' : 'text-neutral-650'}`}
                >
                  <PlusCircle className="w-4 h-4 text-teal-600" />
                  Көмек сұрау / Жаңа жарияланым
                </button>
                <button
                  onClick={() => { setActiveTab('my_dashboard'); setSelectedTask(null); setMobileMenuOpen(false); }}
                  className={`w-full text-left p-2.5 rounded-lg ${activeTab === 'my_dashboard' ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400' : 'text-neutral-650'}`}
                >
                  Жеке кабинет
                </button>
                {userProfile?.isAdmin && (
                  <button
                    onClick={() => { setActiveTab('admin'); setSelectedTask(null); setMobileMenuOpen(false); }}
                    className={`w-full text-left p-2.5 rounded-lg text-rose-600 bg-rose-50/50 dark:bg-rose-950/20 dark:text-rose-400 flex items-center gap-1.5`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Админ панелі
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email Verification Banner */}
          {!currentUser.emailVerified && !hideWarningMessage && (
            <div className="bg-amber-500/10 text-amber-700 border-b border-amber-500/20 px-8 py-2.5 text-xs font-semibold flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>Электронды поштаңыз әлі расталмаған. Поштаңызды тексеріп, профиль қауіпсіздігін нығайтыңыз.</span>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={async () => {
                    try {
                      await sendEmailVerification();
                      alert('Растау сілтемесі поштаңызға жіберілді');
                    } catch (e: any) {
                      alert('Нұсқаулық жіберу сәтсіз өтті: ' + String(e));
                    }
                  }}
                  className="self-start md:self-auto shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold p-1 px-3.5 rounded-lg transition-all cursor-pointer"
                >
                  Растау сілтемесін жіберу
                </button>
                <button
                  onClick={() => {
                    setHideWarningMessage(true);
                    sessionStorage.setItem('hideEmailWarning', 'true');
                  }}
                  className="p-1 hover:bg-amber-500/20 rounded-md transition-colors"
                  title="Жабу"
                >
                  <X className="w-4.5 h-4.5 text-amber-700 shrink-0 cursor-pointer" />
                </button>
              </div>
            </div>
          )}

          {/* MAIN PAGE CONTENTS */}
          <main className="max-w-7xl w-full mx-auto p-4 md:p-8 flex-grow">
            
            {/* 1. ALL TASKS VIEW */}
            {activeTab === 'all_tasks' && (
              <div className="space-y-6">
                
                {/* Hero Search & Advanced Filters Container */}
                <div className="glass-panel rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-black text-neutral-900 dark:text-neutral-50 flex items-center gap-1.5">
                        <Sparkles className="w-5 h-5 text-teal-600 animate-pulse" />
                        Бүгінгі белсенді өтініштер
                      </h2>
                      <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-0.5">
                        Мұқтаж жандарға көмек көрсетіп, игі істер марапатына ие болыңыз
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab('create_task')}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm shrink-0 self-stretch sm:self-auto text-center justify-center cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Маған көмек қажет
                    </button>
                  </div>

                  {/* Search box and filtering drop-downs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-white/20 dark:border-neutral-800/30">
                    
                    {/* Input search */}
                    <div className="relative lg:col-span-2">
                      <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Кілтті сөздерді жазыңыз (мысалы: тамақ, тасу)..."
                        className="w-full p-3 pl-10 rounded-xl border border-white/20 focus:border-teal-500 bg-transparent text-xs dark:border-neutral-800 outline-none text-neutral-850 dark:text-neutral-50 glass-input"
                      />
                    </div>

                    {/* Category Filter */}
                    <div className="flex items-center gap-1.5 font-sans">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full p-3 rounded-xl border border-white/20 focus:border-teal-500 bg-transparent text-xs dark:border-neutral-800 text-neutral-850 dark:text-neutral-50 outline-none font-bold glass-input"
                      >
                        <option value="all">Барлық санаттар</option>
                        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                          <option key={key} value={key} className="dark:text-neutral-900 bg-neutral-100 dark:bg-neutral-900">{label}</option>
                        ))}
                      </select>
                    </div>

                    {/* City filter */}
                    <div className="flex items-center gap-1.5 font-sans">
                      <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="w-full p-3 rounded-xl border border-white/20 focus:border-teal-500 bg-transparent text-xs dark:border-neutral-800 text-neutral-850 dark:text-neutral-50 outline-none font-bold glass-input"
                      >
                        <option value="all">Қазақстанның барлық қалалары</option>
                        {KAZAKHSTAN_CITIES.map((c) => (
                          <option key={c} value={c} className="dark:text-neutral-900 bg-neutral-100 dark:bg-neutral-900">{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sorting criteria */}
                    <div className="flex items-center gap-1.5 font-sans">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full p-3 rounded-xl border border-white/20 focus:border-teal-500 bg-transparent text-xs dark:border-neutral-800 text-neutral-850 dark:text-neutral-50 outline-none font-bold glass-input"
                      >
                        <option value="newest">Жарияланған күні бойынша (Жаңа)</option>
                        <option value="deadline">Орындалу мерзімі бойымен</option>
                        <option value="priority">Орны бойынша (Басымдық)</option>
                      </select>
                    </div>

                  </div>

                  {/* Status selection quick tags */}
                  <div className="flex flex-wrap gap-2 items-center pt-2">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 flex items-center gap-1 mr-1">
                      <Filter className="w-3 h-3" />
                      Тапсырма Күйі:
                    </span>
                    <button
                      onClick={() => setSelectedStatus('all')}
                      className={`px-3 py-1.5 xl:py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        selectedStatus === 'all' 
                          ? 'bg-neutral-900 border-neutral-950 text-white dark:bg-white dark:text-neutral-900 shadow-sm' 
                          : 'border-white/10 text-neutral-600 dark:border-neutral-800 dark:text-neutral-350 hover:bg-white/10 dark:hover:bg-neutral-800/20'
                      }`}
                    >
                      Барлығы
                    </button>
                    <button
                      onClick={() => setSelectedStatus(TaskStatus.NEW)}
                      className={`px-3 py-1.5 xl:py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        selectedStatus === TaskStatus.NEW 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-600 text-white shadow-sm' 
                          : 'border-white/10 text-neutral-600 dark:border-neutral-800 dark:text-neutral-350 hover:bg-white/10 dark:hover:bg-neutral-800/20'
                      }`}
                    >
                      {STATUS_LABELS[TaskStatus.NEW]}
                    </button>
                    <button
                      onClick={() => setSelectedStatus(TaskStatus.IN_PROGRESS)}
                      className={`px-3 py-1.5 xl:py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        selectedStatus === TaskStatus.IN_PROGRESS 
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 border-amber-600 text-neutral-900 shadow-sm' 
                          : 'border-white/10 text-neutral-600 dark:border-neutral-800 dark:text-neutral-350 hover:bg-white/10 dark:hover:bg-neutral-800/20'
                      }`}
                    >
                      {STATUS_LABELS[TaskStatus.IN_PROGRESS]}
                    </button>
                    <button
                      onClick={() => setSelectedStatus(TaskStatus.COMPLETED)}
                      className={`px-3 py-1.5 xl:py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        selectedStatus === TaskStatus.COMPLETED 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-600 text-white shadow-sm' 
                          : 'border-white/10 text-neutral-600 dark:border-neutral-800 dark:text-neutral-350 hover:bg-white/10 dark:hover:bg-neutral-800/20'
                      }`}
                    >
                      {STATUS_LABELS[TaskStatus.COMPLETED]}
                    </button>
                  </div>
                </div>

                {/* Grid List */}
                {loadingTasks ? (
                  <div className="py-20 text-center text-xs text-neutral-400 flex flex-col items-center justify-center gap-1">
                    <Clock className="w-5 h-5 animate-spin text-teal-600" />
                    <span>Тапсырмалар жүктелуде...</span>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="py-20 p-10 bg-white dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl text-center space-y-3">
                    <Heart className="w-12 h-12 text-neutral-300 dark:text-neutral-705 mx-auto animate-pulse" />
                    <h3 className="font-bold text-neutral-704 dark:text-neutral-400 text-sm">Тапсырмалар әзірге жоқ</h3>
                    <p className="text-neutral-400 text-xs text-center max-w-sm mx-auto">
                      Сіз таңдаған сүзгі критерийі бойынша қазіргі уақытта белсенді көмек өтініштері табылмады. Басқа қаланы немесе сүзгіні алып тастап көріңіз.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        currentUserId={currentUser.uid}
                        onAccept={handleAcceptTask}
                        onCancelAcceptance={handleCancelAcceptance}
                        onComplete={handleCompleteTask}
                        onDelete={handleDeleteTask}
                        onViewDetails={(task) => setSelectedTask(task)}
                        onReport={(task) => setReportModalTarget(task)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 1.1 INTERACTIVE MAP VIEW */}
            {activeTab === 'map_view' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 p-5 rounded-2xl shadow-sm">
                  <div>
                    <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                      <Map className="w-5.5 h-5.5 text-teal-600" />
                      Алматы қаласының халықтық көмек картасы
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 text-xs">
                      Алматы бойынша жарияланған белсенді көмек өтініштер мен еріктілердің тапсырмалары.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-neutral-750 dark:text-neutral-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block animate-pulse"></span>
                      Жаңа өтініштер
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-neutral-750 dark:text-neutral-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block animate-pulse"></span>
                      Орындалуда
                    </span>
                  </div>
                </div>

                {/* Map container card */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 p-4 rounded-2xl shadow-sm">
                  <div className="h-[500px] w-full">
                    <InteractiveMap
                      mode="view"
                      theme={theme}
                      tasks={tasks}
                      currentUserId={currentUser?.uid}
                      onAcceptTask={handleAcceptTask}
                    />
                  </div>
                </div>

                {/* Map tasks list index */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Картадағы тапсырмалар тізімі / Tasks Listed on Map
                  </h4>
                  
                  {tasks.filter(t => t.status !== 'completed' && t.latitude && t.longitude).length === 0 ? (
                    <div className="py-12 bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-850 border-dashed rounded-2xl text-center text-xs font-bold text-neutral-405">
                      Картада белсенді тапсырмалар табылған жоқ.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tasks
                        .filter(t => t.status !== 'completed' && t.latitude && t.longitude)
                        .map((task) => (
                          <div 
                            key={task.id}
                            className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 p-4 rounded-xl flex flex-col justify-between hover:border-teal-500/40 hover:shadow-md transition-all duration-200"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                                  {CATEGORY_LABELS[task.category] || task.category}
                                </span>
                                <span className={`w-2 h-2 rounded-full ${task.status === 'new' ? 'bg-teal-500' : 'bg-amber-500'}`} />
                              </div>
                              <h5 className="font-extrabold text-xs text-neutral-900 dark:text-white mb-1 line-clamp-1">
                                {task.title}
                              </h5>
                              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mb-2 line-clamp-2 leading-relaxed">
                                {task.description}
                              </p>
                            </div>
                            <div className="border-t border-neutral-100 dark:border-neutral-850 pt-2.5 mt-2 flex items-center justify-between">
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
            )}

            {/* 2. CREATE TASK FORM VIEW */}
            {activeTab === 'create_task' && (
              <div className="max-w-2xl mx-auto bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-150 dark:border-neutral-800 p-6 md:p-8 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                    <PlusCircle className="w-5.5 h-5.5 text-teal-600" />
                    Көмек сұрау өтінішін құру
                  </h3>
                  <p className="text-neutral-500 dark:text-neutral-400 text-xs">
                    Мұқтаждықтарыңызды немесе көмек қажет ететін мәселені егжей-тегжейлі сипаттап жазыңыз. Еріктілер тегін көмек көрсетеді.
                  </p>
                </div>

                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-600 dark:text-neutral-450">Тапсырма атауы:</label>
                    <input
                      type="text"
                      required
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Мысалы: Қарт адамға дәрі-дәрмек алып келу"
                      maxLength={100}
                      className="w-full p-3 rounded-xl border border-neutral-200 focus:border-teal-500 bg-transparent text-xs dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-600 dark:text-neutral-450">Санат:</label>
                      <select
                        value={newTaskCat}
                        onChange={(e) => setNewTaskCat(e.target.value as TaskCategory)}
                        className="w-full p-3 rounded-xl border border-neutral-200 focus:border-teal-500 bg-transparent text-xs dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 outline-none font-semibold"
                      >
                        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                          <option key={key} value={key} className="dark:text-neutral-800">{label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-600 dark:text-neutral-450">Жеделдік (Басымдық):</label>
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                        className="w-full p-3 rounded-xl border border-neutral-200 focus:border-teal-500 bg-transparent text-xs dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 outline-none font-semibold"
                      >
                        {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                          <option key={key} value={key} className="dark:text-neutral-800">{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-600 dark:text-neutral-450 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        Аяқтаудың соңғы мерзімі:
                      </label>
                      <input
                        type="date"
                        required
                        value={newTaskDeadline}
                        onChange={(e) => setNewTaskDeadline(e.target.value)}
                        className="w-full p-3 rounded-xl border border-neutral-200 focus:border-teal-500 bg-transparent text-xs dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 outline-none font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-600 dark:text-neutral-450 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                        Көмек қажет қала:
                      </label>
                      <select
                        value={newTaskCity}
                        onChange={(e) => setNewTaskCity(e.target.value)}
                        required
                        className="w-full p-3 rounded-xl border border-neutral-200 focus:border-teal-500 bg-transparent text-xs dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 outline-none font-semibold"
                      >
                        <option value="">Таңдаңыз...</option>
                        {KAZAKHSTAN_CITIES.map((c) => (
                          <option key={c} value={c} className="dark:text-neutral-800">{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-neutral-50 dark:bg-neutral-850/50 rounded-2xl border border-neutral-150 dark:border-neutral-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-bold text-neutral-600 dark:text-neutral-450 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-teal-600" />
                        Нақты мекенжайы және бағыт алу / Exact Address & Location:
                      </label>
                      <button
                        type="button"
                        onClick={handleUseMyLocation}
                        className="text-[10px] bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 dark:text-teal-300 border border-teal-100 dark:border-teal-850 px-2.5 py-1.5 rounded-xl font-extrabold flex items-center gap-1 cursor-pointer transition-all hover:scale-[1.01]"
                      >
                        🧭 Менің орналасқан жерімді қолдану
                      </button>
                    </div>

                    <input
                      type="text"
                      value={newTaskAddress}
                      onChange={(e) => {
                        setNewTaskAddress(e.target.value);
                        if (!newTaskLocationSource || newTaskLocationSource === 'geolocation') {
                          setNewTaskLocationSource('manual');
                        }
                      }}
                      placeholder="Мекенжайды енгізіңіз"
                      className="w-full p-3 rounded-xl border border-neutral-200 focus:border-teal-500 bg-transparent text-xs dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 outline-none font-semibold placeholder:text-neutral-450"
                    />

                    {geolocationStatusText && (
                      <div className="text-[10px] text-teal-700 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-950/40 p-2 rounded-lg border border-teal-100 dark:border-teal-900/40">
                        ✨ {geolocationStatusText}
                      </div>
                    )}

                    {geolocationErrorText && (
                      <div className="text-[10px] text-rose-700 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-100 dark:border-rose-900/40">
                        ⚠ {geolocationErrorText}
                      </div>
                    )}

                    {newTaskLatitude && newTaskLongitude && (
                      <div className="text-[10px] text-teal-650 dark:text-teal-400 font-bold flex items-center gap-1 bg-teal-50/50 dark:bg-teal-950/20 px-2.5 py-1.5 rounded-xl border border-teal-150/30">
                        <span>📍 GPS Координаттары қабылданды ({newTaskLocationSource === 'geolocation' ? 'Геолокация' : 'Қолмен'}): {newTaskLatitude.toFixed(6)}, {newTaskLongitude.toFixed(6)}</span>
                      </div>
                    )}

                    {newTaskCity === 'Алматы' && (
                      <div className="space-y-1.5 pt-1.5">
                        <label className="text-[11px] font-extrabold text-neutral-500 dark:text-neutral-450 uppercase tracking-wider block">
                          📍 Алматы картасынан таңдау / Select on Map:
                        </label>
                        <div className="h-[280px]">
                          <InteractiveMap
                            mode="picker"
                            theme={theme}
                            pickerLat={newTaskLatitude}
                            pickerLng={newTaskLongitude}
                            onLocationSelect={(lat, lng) => {
                              setNewTaskLatitude(lat);
                              setNewTaskLongitude(lng);
                              setNewTaskLocationSource('manual');
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-600 dark:text-neutral-450">Толық түсіндірме мәліметі (Егжей-тегжейлі):</label>
                    <textarea
                      required
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      placeholder="Көмектің маңыздылығын, қай мекенжай бойынша (көше/үй) және қандай нақты іс атқару керектігін толық сипаттаңыз..."
                      rows={5}
                      maxLength={1500}
                      className="w-full p-3 rounded-xl border border-neutral-200 focus:border-teal-500 bg-transparent text-xs dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 outline-none leading-relaxed"
                    />
                  </div>

                  {/* File Upload Attachment Widget (Firebase Storage) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-600 dark:text-neutral-450 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-teal-600" />
                      Қосымша сурет немесе құжат (Міндетті емес):
                    </label>

                    {uploadProgress !== null ? (
                      <div className="border border-dashed border-teal-200 dark:border-teal-900 rounded-xl p-6 bg-teal-50/20 dark:bg-teal-950/5 flex flex-col items-center justify-center space-y-2 text-xs">
                        <UploadCloud className="w-8 h-8 text-teal-600 animate-bounce" />
                        <span className="font-bold text-neutral-700 dark:text-neutral-300">Файл жүктелуде: {uploadProgress}%</span>
                        <div className="w-full max-w-xs bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-teal-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                      </div>
                    ) : attachmentFile ? (
                      <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 bg-neutral-50 dark:bg-neutral-800/20 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 truncate">
                          {attachmentFile.type.startsWith('image/') ? (
                            <img 
                              src={URL.createObjectURL(attachmentFile)} 
                              alt="preview" 
                              className="w-10 h-10 object-cover rounded-md border border-neutral-200 dark:border-neutral-700 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-md flex items-center justify-center font-bold font-sans text-[10px] shrink-0">
                              DOC
                            </div>
                          )}
                          <div className="truncate">
                            <div className="font-bold text-neutral-700 dark:text-neutral-300 truncate">{attachmentFile.name}</div>
                            <div className="text-[10px] text-neutral-400 font-medium">{(attachmentFile.size / (1024 * 1024)).toFixed(2)} MB</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAttachmentFile(null)}
                          className="px-2.5 py-1 text-[10px] font-bold text-rose-600 border border-rose-205 hover:bg-rose-50 dark:border-rose-950/20 dark:hover:bg-rose-950/10 rounded-lg cursor-pointer shrink-0"
                        >
                          Өшіру
                        </button>
                      </div>
                    ) : (
                      <div
                        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragActive(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            const file = e.dataTransfer.files[0];
                            if (file.size > 5 * 1024 * 1024) {
                              alert('Файл өлшемі 5MB-тан аспауы қажет');
                              return;
                            }
                            setAttachmentFile(file);
                          }
                        }}
                        className={`border-2 border-dashed rounded-xl p-5 text-center transition-all flex flex-col items-center justify-center space-y-1.5 cursor-pointer ${
                          dragActive 
                            ? 'border-teal-500 bg-teal-50/30 dark:bg-teal-950/10' 
                            : 'border-neutral-200 hover:border-teal-500 dark:border-neutral-800 dark:hover:border-neutral-700'
                        }`}
                        onClick={() => document.getElementById('file-upload-input')?.click()}
                      >
                        <UploadCloud className="w-6 h-6 text-neutral-400 animate-pulse" />
                        <div className="text-xs font-bold text-neutral-600 dark:text-neutral-350">
                          Сурет немесе құжатты сүйреп әкеліңіз немесе <span className="text-teal-600 dark:text-teal-400 decoration-dotted underline">таңдаңыз</span>
                        </div>
                        <p className="text-[10px] text-neutral-400">Максималды өлшемі: 5MB (Форматтар: JPG, PNG, PDF, DOCX)</p>
                        <input
                          id="file-upload-input"
                          type="file"
                          className="hidden"
                          accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              if (file.size > 5 * 1024 * 1024) {
                                alert('Файл өлшемі 5MB-тан аспауы қажет');
                                return;
                              }
                              setAttachmentFile(file);
                            }
                          }}
                        />
                      </div>
                    )}
                    {storageErrorWarning && (
                      <div className="p-4 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl space-y-2 mt-2">
                        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-xs">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                          <span>Firebase Storage қауіпсіздік ережесінің қатесі (Storage/Unauthorized)</span>
                        </div>
                        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-[11px]">
                          Файлды жүктеу үшін Firebase жобаңызда Storage ережелерін (Security Rules) жаңарту қажет. Төмендегі ережені Firebase консолінде орнатыңыз:
                        </p>
                        <div className="bg-neutral-900 text-neutral-200 p-2.5 rounded-lg text-[10px] font-mono whitespace-pre overflow-x-auto border border-neutral-800">
{`rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /tasks_attachments/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.resource.size < 10 * 1024 * 1024;
    }
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}`}
                        </div>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-450 leading-normal">
                          Жобаңыздың <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-teal-600 dark:text-teal-400 font-bold hover:underline">Firebase Console</a> бетіне өтіп, <strong>Storage</strong> -&gt; <strong>Rules</strong> бөліміне қойып, <strong>Publish</strong> батырмасын басыңыз.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800/45 rounded-xl text-[11px] text-neutral-400 border border-neutral-100 dark:border-neutral-800 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-teal-650 shrink-0 mt-0.5" />
                    <span>Тапсырма жарияланғаннан кейін басқа еріктілер оны қабылдағанға дейін өшіре аласыз. Тапсырманы орындаушы табылған соң, байланысу телефондарыңыз бен қорғалған деректеріңіз еріктіге қолжетімді болады.</span>
                  </div>

                  <div className="flex gap-2 justify-end pt-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('all_tasks')}
                      className="py-2.5 px-4 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200"
                    >
                      Бас тарту
                    </button>
                    <button
                      type="submit"
                      className="py-2.5 px-6 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white transition-all shadow-xs"
                    >
                      Жариялау
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 3. MY DASHBOARD VIEW */}
            {activeTab === 'my_dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Profile Panel Column */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-2xl p-6 space-y-6">
                  
                  {editProfileMode ? (
                    
                    /* EDIT PROFILE FORM BOARD */
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <h4 className="font-black text-sm text-neutral-800 dark:text-neutral-100">Профильді өңдеу</h4>
                      
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Өзгерту аватары:</label>
                        <div className="grid grid-cols-6 gap-2">
                          {PRESET_AVATARS.map((avId) => (
                            <button
                              type="button"
                              key={avId}
                              onClick={() => setEditAvatar(avId)}
                              className={`aspect-square rounded-lg flex items-center justify-center text-lg transition-all ${AVATAR_STYLING[avId]} ${
                                editAvatar === avId ? 'ring-2 ring-teal-500 scale-105' : 'opacity-60'
                              }`}
                            >
                              {AVATAR_EMOJIS[avId]}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Аты-жөніңіз:</label>
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full p-2 rounded-lg border border-neutral-200 bg-transparent text-xs dark:border-neutral-700 text-neutral-850 dark:text-neutral-100 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Тұрғылықты қалаңыз:</label>
                        <select
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          className="w-full p-2 rounded-lg border border-neutral-200 bg-transparent text-xs dark:border-neutral-700 text-neutral-850 dark:text-neutral-100 outline-none"
                        >
                          {KAZAKHSTAN_CITIES.map((c) => (
                            <option key={c} value={c} className="dark:text-neutral-800">{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Телефон:</label>
                        <input
                          type="text"
                          required
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full p-2 rounded-lg border border-neutral-200 bg-transparent text-xs dark:border-neutral-700 text-neutral-850 dark:text-neutral-100 outline-none"
                        />
                      </div>

                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setEditProfileMode(false)}
                          className="py-1.5 px-3 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                        >
                          Бас тарту
                        </button>
                        <button
                          type="submit"
                          className="py-1.5 px-4 bg-teal-600 text-white rounded-lg text-xs font-semibold"
                        >
                          Сақтау
                        </button>
                      </div>
                    </form>
                  ) : (
                    
                    /* VIEW PROFILE PANEL */
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${AVATAR_STYLING[userProfile?.avatarId || 'avatar_1']}`}>
                          {AVATAR_EMOJIS[userProfile?.avatarId || 'avatar_1']}
                        </div>
                        <div>
                          <h4 className="font-black text-lg text-neutral-900 dark:text-neutral-50 mb-0.5">{userProfile?.name}</h4>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">{userProfile?.city} тұрғыны</span>
                            <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase tracking-wider w-fit ${
                              userProfile?.isAdmin 
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' 
                                : 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
                            }`}>
                              Рөлі: {userProfile?.isAdmin ? 'Администратор' : 'Волонтер / Көрші'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Contacts details */}
                      <div className="space-y-2 border-t border-neutral-100 dark:border-neutral-850 pt-4 text-xs">
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Эл.пошта:</span>
                          <span className="font-semibold text-neutral-700 dark:text-neutral-200 truncate max-w-[180px]">{userProfile?.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Байланыс телефоны:</span>
                          <span className="font-semibold text-neutral-700 dark:text-neutral-200">{userProfile?.phone || 'Көрсетілмеген'}</span>
                        </div>
                      </div>

                      {/* User Ratings Display */}
                      <div className="grid grid-cols-2 gap-4 border-t border-b border-neutral-100 dark:border-neutral-850 py-4 text-center">
                        <div className="border-r border-neutral-100 dark:border-neutral-850">
                          <div className="text-xl font-bold text-amber-500 flex items-center justify-center gap-1">
                            <StarIcon className="w-5 h-5 fill-amber-500 text-amber-500 shrink-0" />
                            {userProfile?.rating || 5}
                          </div>
                          <div className="text-[9px] text-neutral-400 uppercase font-black tracking-wider mt-1">Орташа рейтинг</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-neutral-800 dark:text-neutral-100">
                            {userProfile?.reviewsCount || 0}
                          </div>
                          <div className="text-[9px] text-neutral-400 uppercase font-black tracking-wider mt-1">Жалпы пікірлер</div>
                        </div>
                      </div>

                      {/* Stats numbers */}
                      <div className="space-y-2.5 text-xs text-neutral-600 dark:text-neutral-300">
                        <div className="flex justify-between bg-neutral-50 dark:bg-neutral-850/30 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-850">
                          <span className="font-medium text-neutral-500">Волонтерлік көмек жасадым:</span>
                          <span className="font-extrabold text-teal-600">{userProfile?.completedTasksCount || 0} рет</span>
                        </div>
                        <div className="flex justify-between bg-neutral-50 dark:bg-neutral-850/30 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-850">
                          <span className="font-medium text-neutral-500">Қабылдаған істерім:</span>
                          <span className="font-extrabold text-neutral-705 dark:text-neutral-250">{userProfile?.acceptedTasksCount || 0} іс</span>
                        </div>
                      </div>

                      {/* Volunteer Level display */}
                      <div className="bg-gradient-to-r from-amber-500/10 to-teal-500/10 dark:from-amber-505/5 dark:to-teal-505/5 p-3 rounded-xl border border-amber-500/20 dark:border-amber-500/10 flex items-center justify-between text-xs">
                        <span className="font-medium text-amber-600 dark:text-amber-400">Ерікті деңгейі:</span>
                        <span className="font-extrabold text-teal-600 dark:text-teal-400">
                          {(() => {
                            const completed = userProfile?.completedTasksCount || 0;
                            if (completed === 0) return 'Жаңадан бастаушы 👶';
                            if (completed >= 1 && completed < 5) return 'Белсенді көмекші 🤝';
                            if (completed >= 5 && completed < 15) return 'Тәжірибелі ерікті 🌟';
                            return 'Алтын жүректі Ерікті 🏆';
                          })()}
                        </span>
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={handleOpenEditProfile}
                          className="flex-1 py-2 px-4 border border-neutral-200 dark:border-neutral-700 dark:hover:bg-neutral-800 hover:bg-neutral-50 rounded-xl text-xs font-semibold text-center text-neutral-700 dark:text-neutral-200 transition-colors"
                        >
                          Профильді өңдеу
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reviews History Post logs */}
                  <div className="border-t border-neutral-150 dark:border-neutral-800 pt-5 space-y-3.5">
                    <h5 className="font-extrabold text-xs text-neutral-800 dark:text-neutral-300 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-amber-500" />
                      Маған қалдырылған пікірлер
                    </h5>

                    <div className="space-y-3 max-h-56 overflow-y-auto">
                      {myReviews.length === 0 ? (
                        <div className="p-4 border border-neutral-100 dark:border-neutral-850 rounded-xl text-center text-[11px] text-neutral-400">
                          Пікірлер әлі жазылмаған
                        </div>
                      ) : (
                        myReviews.map((r) => (
                          <div key={r.id} className="p-3 bg-neutral-50 dark:bg-neutral-850/20 border border-neutral-100 dark:border-neutral-800 rounded-xl text-[11px]">
                            <div className="flex justify-between items-start mb-1.5">
                              <div className="flex items-center gap-1.5">
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${AVATAR_STYLING[r.reviewerAvatar || 'avatar_1']}`}>
                                  {AVATAR_EMOJIS[r.reviewerAvatar || 'avatar_1']}
                                </div>
                                <span className="font-bold text-neutral-700 dark:text-neutral-300">{r.reviewerName}</span>
                              </div>
                              <span className="font-black text-amber-400 shrink-0">⭐ {r.rating}</span>
                            </div>
                            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed italic">&quot;{r.text}&quot;</p>
                            <span className="text-[8px] text-neutral-400 block text-right mt-1">{new Date(r.createdAt).toLocaleDateString('kk')}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                {/* Activity Tracker List Column */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Part 1: My Help Requests (МЕНІҢ КӨМЕК ТАПСЫРМАЛАРЫМ) */}
                  <div className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-2xl p-6 space-y-4">
                    <div>
                      <h3 className="text-base font-black text-neutral-900 dark:text-neutral-50">Менің көмек өтініштерім</h3>
                      <p className="text-neutral-400 text-xs">Жариялаған өтініштеріңіз, олардың орындалу барысы және растау әрекеттері</p>
                    </div>

                    <div className="divide-y divide-neutral-100 dark:divide-neutral-850">
                      {tasks.filter(t => t.creatorId === currentUser.uid).length === 0 ? (
                        <div className="p-8 text-center text-xs text-neutral-400 italic">Сынама ретінде бірде-бір тапсырма жасамағансыз.</div>
                      ) : (
                        tasks.filter(t => t.creatorId === currentUser.uid).map((t) => (
                          <div key={t.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="space-y-1 max-w-md">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-neutral-800 dark:text-neutral-200 text-sm truncate">{t.title}</span>
                                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                                  t.status === 'new' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                                  t.status === 'in_progress' ? 'bg-yellow-105 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' :
                                  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                }`}>
                                  {STATUS_LABELS[t.status]}
                                </span>
                              </div>
                              <p className="text-neutral-550 dark:text-neutral-400 truncate text-xs">{t.description}</p>
                              {t.volunteerId && (
                                <div className="text-[10px] text-neutral-500 flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-850 p-1 px-2.5 rounded-md border dark:border-neutral-800 w-fit">
                                  <span>Қабылдаған Ерікті: <strong>{t.volunteerName}</strong></span>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2 shrink-0">
                              {t.status === TaskStatus.IN_PROGRESS && (
                                <button
                                  onClick={() => handleCompleteTask(t.id)}
                                  className="px-3.5 py-1.5 bg-green-605 text-white bg-green-600 hover:bg-green-700 rounded-lg font-bold text-[10px] shadow-sm flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Аяқталғанын растау
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedTask(t)}
                                className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-[10px] font-bold"
                              >
                                Толығырақ
                              </button>
                              {t.status === TaskStatus.NEW && (
                                <button
                                  onClick={() => handleDeleteTask(t.id)}
                                  className="p-1 px-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer"
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
                  <div className="glass-panel rounded-2xl p-6 space-y-4">
                    <div>
                      <h3 className="text-base font-black text-neutral-900 dark:text-neutral-50 font-sans">Менің ерікті жұмыстарым</h3>
                      <p className="text-neutral-500 dark:text-neutral-400 text-xs font-sans">Басқа адамдарға көмектесу үшін қабылдаған іс-шараларыңыз бен тарихыңыз</p>
                    </div>

                    <div className="divide-y divide-white/10 dark:divide-neutral-850">
                      {tasks.filter(t => t.volunteerId === currentUser.uid).length === 0 ? (
                        <div className="p-8 text-center text-xs text-neutral-400 italic">Әзірге ешқандай өтініш қабылдамағансыз. Көршілерге көмектесуді бастаңыз! 🤝</div>
                      ) : (
                        tasks.filter(t => t.volunteerId === currentUser.uid).map((t) => (
                          <div key={t.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="space-y-1 max-w-md">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-neutral-850 dark:text-neutral-105 text-sm truncate">{t.title}</span>
                                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                                  t.status === 'in_progress' ? 'bg-amber-100/50 text-amber-805 dark:bg-amber-955 dark:text-amber-400' :
                                  'bg-green-105/50 text-green-705 dark:bg-green-955 dark:text-green-400'
                                }`}>
                                  {STATUS_LABELS[t.status]}
                                </span>
                              </div>
                              <p className="text-neutral-550 dark:text-neutral-400 text-xs truncate leading-relaxed">{t.description}</p>
                              <div className="text-[10px] text-neutral-450 dark:text-neutral-400">Көмек иесі: <span className="font-semibold text-neutral-700 dark:text-neutral-200">{t.creatorName}</span></div>
                            </div>

                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => setSelectedTask(t)}
                                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg font-bold text-[10px] text-neutral-700 dark:text-neutral-300 cursor-pointer"
                              >
                                Көру және байланысу
                              </button>
                              {t.status === TaskStatus.IN_PROGRESS && (
                                <button
                                  onClick={() => handleCancelAcceptance(t.id)}
                                  className="px-3 py-1.5 border border-rose-250 text-rose-600 dark:border-rose-900/50 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-[10px] font-bold cursor-pointer"
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

                </div>

              </div>
            )}

            {/* 4. ADMIN VIEW PANEL PANEL */}
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
                  className="glass-modal w-full max-w-xl rounded-3xl shadow-xl overflow-hidden flex flex-col border border-white/20 dark:border-neutral-805/30"
                >
                  {/* Header Detailed */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 dark:border-neutral-800/30 bg-white/10 dark:bg-neutral-950/20">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-sm font-bold text-neutral-800 dark:text-neutral-100">Тапсырманың толық дерегі</span>
                    </div>
                    <button 
                      onClick={() => setSelectedTask(null)}
                      className="p-1 rounded-full text-neutral-400 hover:bg-white/10 dark:hover:bg-neutral-800/20 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Body Detailed */}
                  <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                          selectedTask.priority === 'high' ? 'bg-red-100 text-red-700' :
                          selectedTask.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {PRIORITY_LABELS[selectedTask.priority]} басымдық
                        </span>
                        <span className="px-2.5 py-0.5 text-[10px] font-bold bg-white/10 dark:bg-neutral-800/30 rounded-full text-neutral-600 dark:text-neutral-300">
                          {STATUS_LABELS[selectedTask.status]}
                        </span>
                        <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                          {CATEGORY_LABELS[selectedTask.category]}
                        </span>
                      </div>

                      <h2 className="text-xl font-black text-neutral-900 dark:text-neutral-50">
                        {selectedTask.title}
                      </h2>
                    </div>

                    {/* Meta info grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-white/15 dark:bg-neutral-950/15 border border-white/20 dark:border-neutral-800/20 rounded-xl text-xs">
                      <div className="flex items-center justify-between gap-2 text-neutral-600 dark:text-neutral-350">
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-[10px] text-neutral-400">Өтетін орны (Қала / Мекенжай):</div>
                            <div className="font-bold truncate" title={`${selectedTask.city}${selectedTask.address ? `, ${selectedTask.address}` : ''}`}>
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
                          className="text-[10px] bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 dark:text-teal-300 border border-teal-100 dark:border-teal-850 px-2 py-1 rounded-lg font-bold shrink-0 flex items-center gap-0.5"
                        >
                          🗺️ Карта
                        </a>
                      </div>

                      <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-350">
                        <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
                        <div>
                          <div className="text-[10px] text-neutral-400">Орындау мерзімі (Мерзім):</div>
                          <div className="font-bold">{new Date(selectedTask.deadline).toLocaleDateString('kk')}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="font-extrabold text-xs text-neutral-700 dark:text-neutral-300">Толық сипаттамасы:</h4>
                      <p className="text-xs text-neutral-650 dark:text-neutral-300 leading-relaxed bg-white/10 dark:bg-neutral-950/20 p-4 rounded-xl border border-white/20 dark:border-neutral-850/20 h-[100px] overflow-y-auto">
                        {selectedTask.description}
                      </p>
                    </div>

                    {selectedTask.attachmentUrl && (
                      <div className="space-y-1.5">
                        <h4 className="font-extrabold text-xs text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                          <Paperclip className="w-3.5 h-3.5 text-teal-600" />
                          Қосымша бекітілген файл:
                        </h4>
                        <div className="p-3 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-150 dark:border-neutral-800 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 truncate">
                            <div className="w-10 h-10 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 font-sans">
                              IMAGE
                            </div>
                            <div className="truncate">
                              <span className="font-bold text-xs text-neutral-800 dark:text-neutral-200 block truncate">
                                Тапсырмаға қатысты құжат/сурет
                              </span>
                              <span className="text-[10px] text-neutral-400 block truncate">
                                Суретті толық өлшемде жүктеу немесе көру
                              </span>
                            </div>
                          </div>
                          <a 
                            href={selectedTask.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-[10px] font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors cursor-pointer shrink-0"
                          >
                            Көру / Жүктеу
                          </a>
                        </div>
                        {/* High-fidelity responsive Image view if the link belongs to an uploaded picture */}
                        {selectedTask.attachmentUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) || selectedTask.attachmentUrl.includes('tasks_attachments') ? (
                          <div className="mt-2 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950/30 p-2">
                            <img 
                              src={selectedTask.attachmentUrl} 
                              alt="attachment preview" 
                              className="w-full max-h-48 object-contain hover:scale-[1.01] transition-all duration-300 rounded-lg" 
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Contact integration */}
                    <div className="border-t border-white/20 dark:border-neutral-800/35 pt-4 space-y-3">
                      <h4 className="font-extrabold text-xs text-neutral-700 dark:text-neutral-300">Тапсырма иесі (Көмек сұраушы):</h4>
                      <div className="flex items-center justify-between p-3.5 bg-white/15 dark:bg-white/5 border border-white/20 dark:border-neutral-800/20 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl ${AVATAR_STYLING[selectedTask.creatorAvatar || 'avatar_1']}`}>
                            {AVATAR_EMOJIS[selectedTask.creatorAvatar || 'avatar_1']}
                          </div>
                          <div>
                            <div className="font-bold text-neutral-800 dark:text-neutral-100">{selectedTask.creatorName}</div>
                            <div className="text-[9px] text-neutral-450 uppercase font-bold">Профиль бақылауында</div>
                          </div>
                        </div>

                        {/* Dialing and Coordination is only visible to creator, volunteer or admins as per security standard */}
                        {(selectedTask.creatorId === currentUser.uid || selectedTask.volunteerId === currentUser.uid || userProfile?.isAdmin) ? (
                          <div className="flex items-center gap-2">
                            <a 
                              href={`tel:${selectedTask.creatorId === currentUser.uid ? userProfile?.phone : 'телефон байланысы'}`} 
                              className="p-2 bg-teal-50 hover:bg-teal-100 text-teal-650 rounded-xl transition-all"
                              title="Телефон шалу"
                            >
                              <PhoneCall className="w-4 h-4" />
                            </a>
                            <span className="text-xs font-extrabold text-teal-600">Тегін байланыс рұқсат</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-neutral-400 text-right shrink-0">
                            Телефон байланысы тек <br /><strong>Ерікті орнында көрсетіледі</strong>
                          </span>
                        )}
                      </div>

                      {/* Display Creator's Phone explicitly if user is the assigned volunteer */}
                      {selectedTask.volunteerId === currentUser.uid && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 rounded-xl text-center text-xs font-bold border border-emerald-500/20 dark:border-emerald-900/10 flex items-center justify-center gap-2">
                          <Smartphone className="w-4 h-4 text-emerald-600" />
                          <span>Байланыс телефоны: <strong className="text-sm select-all">{selectedTask.creatorName} телефон номерлерімен сөйлесуге ашық!</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Actions Panel inside Modal */}
                    <div className="border-t border-neutral-150 dark:border-neutral-800 pt-4 flex gap-2 justify-end">
                      <button 
                        onClick={() => setSelectedTask(null)}
                        className="py-2.5 px-4 font-bold text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200"
                      >
                        Жабу
                      </button>

                      {selectedTask.status === TaskStatus.NEW && selectedTask.creatorId !== currentUser.uid && (
                        <button
                          onClick={() => handleAcceptTask(selectedTask.id)}
                          className="py-2.5 px-6 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 shadow-sm"
                        >
                          <HeartHandshake className="w-4 h-4" />
                          Көмектесуді бастау
                        </button>
                      )}

                      {selectedTask.status === TaskStatus.IN_PROGRESS && selectedTask.volunteerId === currentUser.uid && (
                        <button
                          onClick={() => handleCancelAcceptance(selectedTask.id)}
                          className="py-2.5 px-5 border border-rose-250 text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-xl"
                        >
                          Орындаудан бас тарту
                        </button>
                      )}

                      {selectedTask.status === TaskStatus.IN_PROGRESS && selectedTask.creatorId === currentUser.uid && (
                        <button
                          onClick={() => handleCompleteTask(selectedTask.id)}
                          className="py-2.5 px-5 bg-green-600 hover:bg-green-700 text-white text-xs font-extrabold rounded-xl"
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
                  className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="relative w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl z-10 text-left space-y-4"
                >
                  <div className="flex items-start gap-4">
                    {confirmDialog.iconType === 'warning' && (
                      <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-900/30">
                        <AlertTriangle className="w-6 h-6 animate-pulse" />
                      </div>
                    )}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <h3 className="text-sm font-black text-neutral-900 dark:text-neutral-50 leading-snug">
                        {confirmDialog.title}
                      </h3>
                      <p className="text-neutral-500 dark:text-neutral-400 text-xs leading-relaxed whitespace-pre-line font-medium">
                        {confirmDialog.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 text-xs pt-2">
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

          {/* Humble simple Page Footer (strictly matches anti-larping, anti-status noise principles) */}
          <footer className="bg-white dark:bg-neutral-900 border-t border-neutral-150 dark:border-neutral-800 py-6 text-center text-xs text-neutral-450 dark:text-neutral-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-teal-600" />
                <span><strong>Qolda.kz</strong> &mdash; Ұлы Дала елінің бірлік пен жәрдем еріктілер платформасы.</span>
              </div>
              <div className="flex items-center gap-4">
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
