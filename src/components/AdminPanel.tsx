import React, { useEffect, useState } from 'react';
import { 
  getPlatformStats, 
  getReports, 
  getUsers, 
  getTasks,
  toggleUserBan, 
  updateReportStatus, 
  deleteTask 
} from '../dbService';
import { Report, UserProfile, Task } from '../types';
import { 
  Users, 
  Layers, 
  CheckCircle, 
  Activity, 
  ShieldAlert, 
  Radio, 
  UserMinus, 
  Slash, 
  RotateCw, 
  Check, 
  Trash2, 
  ShieldCheck, 
  UserCheck,
  FileText,
  ExternalLink,
  X,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminPanel() {
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'reports' | 'users'>('stats');
  const [loading, setLoading] = useState(true);
  const [selectedUserForFiles, setSelectedUserForFiles] = useState<UserProfile | null>(null);

  // Sign-up date range filter states
  const [userStartDate, setUserStartDate] = useState<string>('');
  const [userEndDate, setUserEndDate] = useState<string>('');

  const setDatePreset = (preset: 'today' | '7days' | 'thismonth' | 'all') => {
    const now = new Date();
    if (preset === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      setUserStartDate(todayStr);
      setUserEndDate(todayStr);
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      setUserStartDate(past.toISOString().split('T')[0]);
      setUserEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'thismonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setUserStartDate(firstDay.toISOString().split('T')[0]);
      setUserEndDate(now.toISOString().split('T')[0]);
    } else {
      setUserStartDate('');
      setUserEndDate('');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!u.createdAt) return true;
    const regDate = new Date(u.createdAt);
    
    if (userStartDate) {
      const start = new Date(userStartDate);
      start.setHours(0, 0, 0, 0);
      if (regDate < start) return false;
    }
    
    if (userEndDate) {
      const end = new Date(userEndDate);
      end.setHours(23, 59, 59, 999);
      if (regDate > end) return false;
    }
    
    return true;
  });

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const fetchedStats = await getPlatformStats();
      const fetchedReports = await getReports();
      const fetchedUsers = await getUsers();
      const fetchedTasks = await getTasks();
      setStats(fetchedStats);
      setReports(fetchedReports);
      setUsers(fetchedUsers);
      setTasks(fetchedTasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleResolveReport = async (reportId: string) => {
    if (!window.confirm('Бұл шағымды шешілді деп белгілегіңіз келе ме?')) return;
    try {
      await updateReportStatus(reportId, 'resolved');
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
    } catch (e) {
      alert('Қате орын алды: ' + String(e));
    }
  };

  const handleToggleBan = async (userId: string, currentBanStatus: boolean) => {
    const actionText = currentBanStatus ? 'пайдаланушы бұғаттауын ашуды' : 'пайдаланушыны бұғаттауды';
    if (!window.confirm(`Шын мәнінде ${actionText} қалайсыз ба?`)) return;
    try {
      await toggleUserBan(userId, !currentBanStatus);
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, isBanned: !currentBanStatus } : u));
    } catch (e) {
      alert('Қате орын алды: ' + String(e));
    }
  };

  const handleDeleteTaskAdmin = async (taskId: string, reportId: string) => {
    if (!window.confirm('Бұл тапсырманы бұзылған ережелер үшін жүйеден біржола өшіргіңіз келе ме?')) return;
    try {
      await deleteTask(taskId);
      await updateReportStatus(reportId, 'resolved');
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
      alert('Тапсырма өшірілді және шағым шешілді.');
      loadAdminData();
    } catch (e) {
      alert('Өшіру кезінде қате кетті: ' + String(e));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-black text-neutral-900 dark:text-neutral-50 flex items-center gap-2 flex-wrap">
            <ShieldAlert className="w-5.5 h-5.5 text-rose-600 dark:text-rose-450 shrink-0" />
            <span>Админ бақылау тақтасы</span>
            <span className="text-[10px] uppercase font-sans tracking-widest font-black text-red-650 bg-red-100 dark:bg-rose-950/40 dark:text-rose-400 px-2 py-0.5 rounded-full border border-rose-300 dark:border-rose-900 flex items-center gap-1 shrink-0">
               ● АДМИНИСТРАТОР РЕЖИМІ
            </span>
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-xs">
            Тіркелген пайдаланушыларды реттеу, шағымдарды қарастыру және белсенділік өлшемдерін сараптау
          </p>
        </div>
        <button
          onClick={loadAdminData}
          className="self-start px-3.5 py-2 border border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-xl transition-all text-xs font-semibold flex items-center gap-1.5"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Жаңарту
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-100 dark:border-neutral-800 p-1">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'stats' 
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border' 
              : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
          }`}
        >
          Басты көрсеткіштер
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'reports' 
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border' 
              : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
          }`}
        >
          Шағымдар тізімі
          {reports.filter(r => r.status === 'pending').length > 0 && (
            <span className="w-2.5 h-2.5 bg-rose-600 rounded-full animate-ping" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'users' 
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border' 
              : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
          }`}
        >
          Пайдаланушылар базасы
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-neutral-400 flex flex-col items-center justify-center gap-2">
          <RotateCw className="w-6 h-6 animate-spin text-teal-600" />
          <span>Мәліметтер жүктелуде...</span>
        </div>
      ) : (
        <div>
          {/* STATS VIEW */}
          {activeTab === 'stats' && stats && (
            <div className="space-y-6">
              {/* Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 glass-card rounded-2xl flex items-center gap-4 hover:scale-103 transition-transform">
                  <div className="w-10 h-10 rounded-xl bg-blue-50/50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 flex items-center justify-center font-bold">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-neutral-900 dark:text-neutral-50">{stats.totalTasks}</div>
                    <div className="text-[10px] text-neutral-400">Жалпы өтініштер</div>
                  </div>
                </div>

                <div className="p-4 glass-card rounded-2xl flex items-center gap-4 hover:scale-103 transition-transform">
                  <div className="w-10 h-10 rounded-xl bg-yellow-50/50 text-yellow-600 dark:bg-yellow-950/20 dark:text-yellow-400 flex items-center justify-center font-bold">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-neutral-900 dark:text-neutral-50">{stats.activeTasks}</div>
                    <div className="text-[10px] text-neutral-400">Белсенді көмектер</div>
                  </div>
                </div>

                <div className="p-4 glass-card rounded-2xl flex items-center gap-4 hover:scale-103 transition-transform">
                  <div className="w-10 h-10 rounded-xl bg-green-50/50 text-green-600 dark:bg-green-950/20 dark:text-green-400 flex items-center justify-center font-bold">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-neutral-900 dark:text-neutral-50">{stats.completedTasks}</div>
                    <div className="text-[10px] text-neutral-400">Сәтті аяқталды</div>
                  </div>
                </div>

                <div className="p-4 glass-card rounded-2xl flex items-center gap-4 hover:scale-103 transition-transform">
                  <div className="w-10 h-10 rounded-xl bg-teal-50/50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400 flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-neutral-900 dark:text-neutral-50">{stats.totalUsers}</div>
                    <div className="text-[10px] text-neutral-400">Тіркелген адамы</div>
                  </div>
                </div>
              </div>

              {/* Graphical representation in clean SVG or styling bars */}
              <div className="glass-panel p-5 rounded-3xl">
                <h4 className="font-bold text-sm text-neutral-800 dark:text-neutral-200 mb-4">Тапсырмалар статистикасының бөлінісі</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1 text-neutral-500 dark:text-neutral-400">
                      <span>Жаңа тапсырмалар (Көмекшілер қабылдамаған)</span>
                      <span className="font-bold">{stats.newTasks} ({stats.totalTasks ? Math.round((stats.newTasks / stats.totalTasks) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${stats.totalTasks ? (stats.newTasks / stats.totalTasks) * 100 : 0}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1 text-neutral-500 dark:text-neutral-400">
                      <span>Орындалудағы тапсырмалар (Еріктілер жұмысы)</span>
                      <span className="font-bold">{stats.activeTasks} ({stats.totalTasks ? Math.round((stats.activeTasks / stats.totalTasks) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-yellow-500 h-full rounded-full transition-all duration-500" style={{ width: `${stats.totalTasks ? (stats.activeTasks / stats.totalTasks) * 100 : 0}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1 text-neutral-500 dark:text-neutral-400">
                      <span>Орындалған тапсырмалар (Расталған табыс)</span>
                      <span className="font-bold">{stats.completedTasks} ({stats.totalTasks ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full rounded-full transition-all duration-500" style={{ width: `${stats.totalTasks ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-neutral-100 dark:border-neutral-800 pt-5 mt-5 text-center">
                  <div className="p-3 bg-white/10 dark:bg-neutral-950/20 rounded-xl">
                    <div className="text-xl font-bold text-neutral-700 dark:text-neutral-200">{stats.totalVolunteers}</div>
                    <div className="text-[10px] text-neutral-400">Белсенді еріктілер саны</div>
                  </div>
                  <div className="p-3 bg-white/10 dark:bg-neutral-950/20 rounded-xl">
                    <div className="text-xl font-bold text-rose-650 text-rose-600 dark:text-rose-450">{stats.totalReports}</div>
                    <div className="text-[10px] text-neutral-400">Жүйелік шағымдар</div>
                  </div>
                  <div className="col-span-2 md:col-span-1 p-3 bg-white/10 dark:bg-neutral-950/20 rounded-xl">
                    <div className="text-xl font-bold text-teal-600">
                      {stats.totalUsers ? (stats.totalVolunteers / stats.totalUsers * 100).toFixed(1) : 0}%
                    </div>
                    <div className="text-[10px] text-neutral-400">Еріктілік деңгейі</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REPORTS VIEW */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              {reports.length === 0 ? (
                <div className="p-10 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl text-center text-xs text-neutral-400">
                  Шағымдар табылмады. Қоғамдастық таза! 👍
                </div>
              ) : (
                <div className="grid gap-3">
                  {reports.map((report) => (
                    <div 
                      key={report.id} 
                      className={`p-4 glass-card rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all ${
                        report.status === 'resolved' 
                          ? 'border-white/10 opacity-60 dark:border-neutral-800/20' 
                          : 'border-rose-300 dark:border-rose-950/40 shadow-xs'
                      }`}
                    >
                      <div className="space-y-2 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-sm ${
                            report.targetType === 'user' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {report.targetType === 'user' ? 'Пайдаланушы' : 'Тапсырма'}
                          </span>
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-sm ${
                            report.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {report.status === 'resolved' ? 'Шешілді' : 'Күтуде'}
                          </span>
                          <span className="text-[10px] text-neutral-400">ID: {report.id}</span>
                        </div>

                        <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                          Нысан: &quot;{report.targetLabel}&quot;
                        </div>

                        <p className="text-xs text-neutral-600 dark:text-neutral-450 italic bg-neutral-50 dark:bg-neutral-850 p-2 px-3 rounded-lg border dark:border-neutral-800">
                          Баяндама себебі: {report.reason}
                        </p>

                        <div className="text-[10px] text-neutral-400">
                          Жолдаған: <span className="font-semibold text-neutral-600 dark:text-neutral-300">{report.reporterName}</span> &bull; Күн: {new Date(report.createdAt).toLocaleDateString('kk')}
                        </div>
                      </div>

                      {/* Operations */}
                      {report.status === 'pending' && (
                        <div className="flex gap-2 shrink-0">
                          {report.targetType === 'task' && (
                            <button
                              onClick={() => handleDeleteTaskAdmin(report.targetId, report.id)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Тапсырманы өшіру
                            </button>
                          )}
                          <button
                            onClick={() => handleResolveReport(report.id)}
                            className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-600 dark:bg-green-950/20 dark:text-green-450 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Жабу / Рұқсат беру
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* USERS VIEW */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Date Filters Panel */}
              <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-3xl shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-teal-650 shrink-0" />
                      Тіркелу уақыты бойынша сүзгілеу / Filter by registration date
                    </h3>
                    <p className="text-[10px] text-neutral-400">
                      Пайдаланушылардың жүйеге тіркелген уақыт аралығын таңдаңыз
                    </p>
                  </div>
                  
                  {/* Quick presets */}
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                    <button
                      onClick={() => setDatePreset('all')}
                      className={`px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                        !userStartDate && !userEndDate
                          ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-neutral-900'
                          : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-250 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-750'
                      }`}
                    >
                      Барлығы / All Time
                    </button>
                    <button
                      onClick={() => setDatePreset('today')}
                      className={`px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                        (() => {
                          const todayStr = new Date().toISOString().split('T')[0];
                          return userStartDate === todayStr && userEndDate === todayStr;
                        })()
                          ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-neutral-900'
                          : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-250 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-750'
                      }`}
                    >
                      Бүгін / Today
                    </button>
                    <button
                      onClick={() => setDatePreset('7days')}
                      className={`px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                        (() => {
                          const now = new Date();
                          const past = new Date();
                          past.setDate(now.getDate() - 7);
                          const pastStr = past.toISOString().split('T')[0];
                          const nowStr = now.toISOString().split('T')[0];
                          return userStartDate === pastStr && userEndDate === nowStr;
                        })()
                          ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-neutral-900'
                          : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-250 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-750'
                      }`}
                    >
                      Соңғы 7 күн / Last 7 Days
                    </button>
                    <button
                      onClick={() => setDatePreset('thismonth')}
                      className={`px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                        (() => {
                          const now = new Date();
                          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                          const firstDayStr = firstDay.toISOString().split('T')[0];
                          const nowStr = now.toISOString().split('T')[0];
                          return userStartDate === firstDayStr && userEndDate === nowStr;
                        })()
                          ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-neutral-900'
                          : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-250 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-750'
                      }`}
                    >
                      Осы ай / This Month
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-neutral-150 dark:border-neutral-800">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
                      Басталу күні / Start Date
                    </label>
                    <input
                      type="date"
                      value={userStartDate}
                      onChange={(e) => setUserStartDate(e.target.value)}
                      className="w-full sm:w-44 px-3 py-1.5 border border-neutral-250 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600 transition-all text-neutral-750"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
                      Аяқталу күні / End Date
                    </label>
                    <input
                      type="date"
                      value={userEndDate}
                      onChange={(e) => setUserEndDate(e.target.value)}
                      className="w-full sm:w-44 px-3 py-1.5 border border-neutral-250 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600 transition-all text-neutral-750"
                    />
                  </div>

                  {(userStartDate || userEndDate) && (
                    <button
                      onClick={() => {
                        setUserStartDate('');
                        setUserEndDate('');
                      }}
                      className="px-3.5 py-1.5 border border-dashed border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-405 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer h-[32px]"
                    >
                      <X className="w-3.5 h-3.5" />
                      Тазалау / Reset
                    </button>
                  )}

                  <div className="ml-auto text-[10px] font-bold text-neutral-450 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-850 border border-neutral-150 dark:border-neutral-800 px-3 py-2 rounded-xl h-[32px] flex items-center shrink-0">
                    Табылды / Found: {filteredUsers.length} / {users.length}
                  </div>
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="p-16 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl text-center text-xs text-neutral-400 space-y-2">
                  <div className="text-3xl">📅</div>
                  <div className="font-bold">Бұл уақыт аралығында тіркелген пайдаланушылар табылмады.</div>
                  <p className="text-[10px]">Басқа уақыт аралығын таңдап көріңіз немесе сүзгілерді тазалаңыз.</p>
                </div>
              ) : (
                <div className="glass-card rounded-3xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-neutral-500 dark:text-neutral-400">
                      <thead className="bg-neutral-50 dark:bg-neutral-800/40 text-[10px] uppercase font-bold text-neutral-400 border-b border-neutral-150 dark:border-neutral-800">
                        <tr>
                          <th className="px-5 py-3.5">Аты-жөні / Эл.пошта / Тіркелген күні</th>
                          <th className="px-5 py-3.5">Қала</th>
                          <th className="px-5 py-3.5">Статистика</th>
                          <th className="px-5 py-3.5">Жүктелген файлдар</th>
                          <th className="px-5 py-3.5">Рейтинг</th>
                          <th className="px-5 py-3.5">Админ бе?</th>
                          <th className="px-5 py-3.5 text-right">Әрекеттер</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {filteredUsers.map((u) => {
                          const userUploadedFiles = tasks.filter(t => t.creatorId === u.uid && t.attachmentUrl);
                          const fileCount = userUploadedFiles.length;
                          const formattedRegDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString('kk', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'Белгісіз';

                          return (
                            <tr key={u.uid} className={`hover:bg-neutral-50/50 dark:hover:bg-neutral-850/20 ${u.isBanned ? 'bg-rose-50/20' : ''}`}>
                              <td className="px-5 py-4">
                                <div className="font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                                  {u.name}
                                  {u.isBanned && (
                                    <span className="bg-rose-100 text-rose-800 text-[8px] font-bold px-1.5 py-0.5 rounded-sm">
                                      Бұғатталған
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-neutral-400 mt-0.5">{u.email}</div>
                                <div className="text-[9px] text-neutral-400/80 mt-1 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Тіркелді: {formattedRegDate}
                                </div>
                              </td>
                              <td className="px-5 py-4 text-neutral-700 dark:text-neutral-300 font-semibold">{u.city}</td>
                              <td className="px-5 py-4">
                                <div className="text-[10px] text-neutral-600 dark:text-neutral-300">
                                  Аяқталған тапсырыс: <span className="font-bold">{u.completedTasksCount || 0}</span>
                                </div>
                                <div className="text-[9px] text-neutral-400 mt-0.5">Қабылданған: {u.acceptedTasksCount || 0}</div>
                              </td>
                              <td className="px-5 py-4">
                                <button
                                  onClick={() => setSelectedUserForFiles(u)}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    fileCount > 0
                                      ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 cursor-pointer'
                                      : 'bg-neutral-50 text-neutral-400 dark:bg-neutral-900/50 cursor-pointer hover:bg-neutral-100/50 hover:text-neutral-500'
                                  }`}
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>{fileCount} файл</span>
                                </button>
                              </td>
                              <td className="px-5 py-4 font-bold text-amber-500">⭐ {u.rating || 5} ({u.reviewsCount || 0})</td>
                              <td className="px-5 py-4">
                                {u.isAdmin ? (
                                  <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 dark:text-emerald-400 font-bold p-1 px-2 rounded-md">Иә</span>
                                ) : (
                                  <span className="text-neutral-300">Жоқ</span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-right">
                                {u.email !== 'sanjaresenalin@gmail.com' ? (
                                  <button
                                    onClick={() => handleToggleBan(u.uid, u.isBanned)}
                                    className={`p-1.5 rounded-xl font-bold transition-colors ${
                                      u.isBanned
                                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/25 dark:text-emerald-400'
                                        : 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/25 dark:text-rose-400'
                                    }`}
                                  >
                                    {u.isBanned ? 'Бұғаттаудан босату' : 'Бұғаттау'}
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-neutral-400 shrink-0">Қол тигізусіз</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* USER FILES MODAL OVERLAY */}
      <AnimatePresence>
        {selectedUserForFiles && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUserForFiles(null)}
              className="absolute inset-0 bg-neutral-950/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[85vh] text-left"
            >
              <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-50">
                      Жүктелген файлдар тізімі
                    </h3>
                    <p className="text-[9px] text-neutral-400">
                      Пайдаланушы: {selectedUserForFiles.name} &bull; {selectedUserForFiles.email}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUserForFiles(null)}
                  className="w-8 h-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Files Area */}
              <div className="p-5 overflow-y-auto space-y-3 flex-1">
                {(() => {
                  const userFiles = tasks.filter(t => t.creatorId === selectedUserForFiles.uid && t.attachmentUrl);
                  if (userFiles.length === 0) {
                    return (
                      <div className="py-12 text-center text-xs text-neutral-400 flex flex-col items-center justify-center gap-2">
                        <FileText className="w-8 h-8 text-neutral-300 dark:text-neutral-700" />
                        Бұл пайдаланушы бірде-бір файл жүктемеген.
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-2.5">
                      {userFiles.map((f) => (
                        <div 
                          key={f.id}
                          className="p-3.5 bg-neutral-50 hover:bg-neutral-100/70 dark:bg-neutral-950/20 dark:hover:bg-neutral-950/40 border border-neutral-100 dark:border-neutral-800/60 rounded-2xl flex items-center justify-between gap-4 transition-all"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="text-xs font-bold text-neutral-800 dark:text-neutral-100 truncate">
                              {f.attachmentName || 'Қосымша файл'}
                            </div>
                            <div className="text-[10px] text-neutral-400 flex items-center gap-1.5">
                              <span>Тапсырма: <span className="font-semibold text-neutral-500 dark:text-neutral-300">{f.title}</span></span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <a 
                              href={f.attachmentUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors group"
                            >
                              <span>Ашу</span>
                              <ExternalLink className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Footer */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
                <button 
                  onClick={() => setSelectedUserForFiles(null)}
                  className="px-4 py-2 bg-neutral-150 hover:bg-neutral-200 dark:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-750 dark:text-neutral-200 rounded-xl text-xs font-bold transition-colors"
                >
                  Жабу
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
