import React from 'react';
import { 
  Sparkles, 
  Plus, 
  Search, 
  Filter, 
  Heart, 
  Clock 
} from 'lucide-react';
import { 
  Task, 
  TaskCategory, 
  TaskPriority, 
  TaskStatus, 
  UserProfile, 
  CATEGORY_LABELS, 
  PRIORITY_LABELS, 
  STATUS_LABELS, 
  KAZAKHSTAN_CITIES 
} from '../types';
import TaskCard from '../components/TaskCard';

interface AllTasksPageProps {
  tasks: Task[];
  loadingTasks: boolean;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  selectedCity: string;
  setSelectedCity: (v: string) => void;
  sortBy: 'newest' | 'deadline' | 'priority';
  setSortBy: (v: 'newest' | 'deadline' | 'priority') => void;
  selectedStatus: string;
  setSelectedStatus: (v: string) => void;
  currentUser: any;
  userProfile: any;
  handleAcceptTask: (id: string) => void;
  handleCancelAcceptance: (id: string) => void;
  handleCompleteTask: (id: string) => void;
  handleDeleteTask: (id: string) => void;
  setSelectedTask: (t: Task) => void;
  setReportModalTarget: (t: Task) => void;
  setActiveTab: (tab: 'all_tasks' | 'map_view' | 'my_dashboard' | 'create_task' | 'admin') => void;
}

export default function AllTasksPage({
  tasks,
  loadingTasks,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedCity,
  setSelectedCity,
  sortBy,
  setSortBy,
  selectedStatus,
  setSelectedStatus,
  currentUser,
  userProfile,
  handleAcceptTask,
  handleCancelAcceptance,
  handleCompleteTask,
  handleDeleteTask,
  setSelectedTask,
  setReportModalTarget,
  setActiveTab,
}: AllTasksPageProps) {

  // Filtration and Sorting process
  const filteredTasks = tasks.filter((task) => {
    // Hide expired, blocked, or pending review tasks from main list
    const isExcludedStatus = 
      task.status === TaskStatus.EXPIRED || 
      task.status === TaskStatus.BLOCKED || 
      task.status === TaskStatus.PENDING_REVIEW ||
      task.status === 'expired' as any ||
      task.status === 'blocked' as any ||
      task.status === 'pending_review' as any;

    if (isExcludedStatus) {
      return false;
    }

    // Search query matches
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.address || '').toLowerCase().includes(searchQuery.toLowerCase());

    // Category matches
    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;

    // City matches
    const matchesCity = selectedCity === 'all' || task.city === selectedCity;

    // Status matches
    const matchesStatus = 
      selectedStatus === 'all' || 
      task.status === selectedStatus ||
      (selectedStatus === TaskStatus.ACTIVE && task.status === 'new' as any) ||
      (selectedStatus === TaskStatus.ACCEPTED && task.status === 'in_progress' as any);

    return matchesSearch && matchesCategory && matchesCity && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA; // descending order
    } else if (sortBy === 'deadline') {
      const tA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const tB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return tA - tB; // ascending
    } else if (sortBy === 'priority') {
      const priorityWeights = { high: 3, medium: 2, low: 1 };
      const weightA = priorityWeights[a.priority] || 1;
      const weightB = priorityWeights[b.priority] || 1;
      return weightB - weightA; // high priority first
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Hero Search & Advanced Filters Container */}
      <div className="glass-panel rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-transparent">
          <div className="bg-transparent">
            <h2 className="text-xl font-black text-neutral-900 dark:text-neutral-50 flex items-center gap-1.5 font-sans bg-transparent">
              <Sparkles className="w-5 h-5 text-teal-600 animate-pulse" />
              Бүгінгі белсенді өтініштер
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-0.5 font-sans">
              Мұқтаж жандарға көмек көрсетіп, игі істер марапатына ие болыңыз
            </p>
          </div>

          <button
            onClick={() => setActiveTab('create_task')}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm shrink-0 self-stretch sm:self-auto text-center justify-center cursor-pointer font-sans"
          >
            <Plus className="w-3.5 h-3.5" />
            Маған көмек қажет
          </button>
        </div>

        {/* Search box and filtering drop-downs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-white/20 dark:border-neutral-800/30 bg-transparent">
          
          {/* Input search */}
          <div className="relative lg:col-span-2 bg-transparent">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Кілтті сөздерді жазыңыз (мысалы: тамақ, тасу)..."
              className="w-full p-3 pl-10 rounded-xl border border-neutral-250 focus:border-teal-500 bg-transparent text-xs dark:border-neutral-800 outline-none text-neutral-800 dark:text-neutral-50 font-sans"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 font-sans bg-transparent">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-3 rounded-xl border border-neutral-250 focus:border-teal-500 bg-transparent text-xs dark:border-neutral-800 text-neutral-800 dark:text-neutral-50 outline-none font-bold"
            >
              <option value="all">Барлық санаттар</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key} className="dark:text-neutral-900 bg-neutral-100 dark:bg-neutral-900">{label}</option>
              ))}
            </select>
          </div>

          {/* City filter */}
          <div className="flex items-center gap-1.5 font-sans bg-transparent">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full p-3 rounded-xl border border-neutral-250 focus:border-teal-500 bg-transparent text-xs dark:border-neutral-800 text-neutral-800 dark:text-neutral-50 outline-none font-bold"
            >
              <option value="all">Қазақстанның барлық қалалары</option>
              {KAZAKHSTAN_CITIES.map((c) => (
                <option key={c} value={c} className="dark:text-neutral-900 bg-neutral-100 dark:bg-neutral-900">{c}</option>
              ))}
            </select>
          </div>

          {/* Sorting criteria */}
          <div className="flex items-center gap-1.5 font-sans bg-transparent">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full p-3 rounded-xl border border-neutral-250 focus:border-teal-500 bg-transparent text-xs dark:border-neutral-800 text-neutral-800 dark:text-neutral-50 outline-none font-bold"
            >
              <option value="newest">Жарияланған күні бойынша (Жаңа)</option>
              <option value="deadline">Орындалу мерзімі бойымен</option>
              <option value="priority">Орны бойынша (Басымдық)</option>
            </select>
          </div>

        </div>

        {/* Status selection quick tags */}
        <div className="flex flex-wrap gap-2 items-center pt-2 bg-transparent">
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
            onClick={() => setSelectedStatus(TaskStatus.ACTIVE)}
            className={`px-3 py-1.5 xl:py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              selectedStatus === TaskStatus.ACTIVE 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-600 text-white shadow-sm' 
                : 'border-white/10 text-neutral-600 dark:border-neutral-800 dark:text-neutral-350 hover:bg-white/10 dark:hover:bg-neutral-800/20'
            }`}
          >
            {STATUS_LABELS[TaskStatus.ACTIVE]}
          </button>
          <button
            onClick={() => setSelectedStatus(TaskStatus.ACCEPTED)}
            className={`px-3 py-1.5 xl:py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              selectedStatus === TaskStatus.ACCEPTED 
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 border-amber-600 text-neutral-950 shadow-sm' 
                : 'border-white/10 text-neutral-600 dark:border-neutral-800 dark:text-neutral-350 hover:bg-white/10 dark:hover:bg-neutral-800/20'
            }`}
          >
            {STATUS_LABELS[TaskStatus.ACCEPTED]}
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
        <div className="py-20 text-center text-xs text-neutral-400 flex flex-col items-center justify-center gap-1 bg-transparent">
          <Clock className="w-5 h-5 animate-spin text-teal-600" />
          <span>Тапсырмалар жүктелуде...</span>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-20 p-10 bg-white dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl text-center space-y-3">
          <Heart className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto animate-pulse" />
          <h3 className="font-bold text-neutral-700 dark:text-neutral-400 text-sm">Тапсырмалар әзірге жоқ</h3>
          <p className="text-neutral-400 text-xs text-center max-w-sm mx-auto">
            Сіз таңдаған сүзгі критерийі бойынша қазіргі уақытта белсенді көмек өтініштері табылмады. Басқа қаланы немесе сүзгіні алып тастап көріңіз.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 bg-transparent">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              currentUserId={currentUser?.uid}
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
  );
}
