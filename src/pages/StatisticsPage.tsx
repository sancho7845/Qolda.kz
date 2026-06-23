import React from 'react';
import { BarChart, Clock, Award, Star, AlertTriangle, ShieldCheck, HeartPulse, Sparkles } from 'lucide-react';
import { Task, UserProfile } from '../types';

interface StatisticsPageProps {
  userProfile: UserProfile;
  tasks: Task[];
  currentUser: any;
}

export default function StatisticsPage({ userProfile, tasks, currentUser }: StatisticsPageProps) {
  const totalHours = userProfile?.totalVolunteerHours || 0;
  const completedCount = userProfile?.completedTasksCount || 0;
  const rating = userProfile?.rating || 5;
  const penalties = userProfile?.penaltyPoints || 0;

  const getVolunteerRank = (count: number) => {
    if (count <= 2) return { name: 'Жаңадан келген', desc: 'Ізгілік жолындағы алғашқы қадамдар 🌱', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40' };
    if (count <= 10) return { name: 'Белсенді волонтер', desc: 'Көршілерге тұрақты көмек көрсетуші ⚡', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40' };
    if (count <= 25) return { name: 'Тәжірибелі волонтер', desc: 'Сенімді тірекі және жаны жомарт тұлға 💪', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/40' };
    return { name: 'Лидер', desc: 'Ізгі істердің нағыз шамшырағы мен мақтанышы 🌟', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40' };
  };

  const getTrustLabelInfo = (pPoints: number, dbStatus?: string) => {
    const isLow = pPoints >= 3 || dbStatus === 'Төмен сенімді';
    if (isLow) return { name: 'Төмен сенімді', desc: 'Штрафтарға байланысты сенім деңгейі төмендеген ⚠️', badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-455 dark:border-rose-900/40' };
    return { name: dbStatus || 'Жоғары сенімді', desc: 'Ережелер мен уақытты мүлтіксіз сақтайтын ерікті ✅', badgeColor: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/40' };
  };

  const rankInfo = getVolunteerRank(completedCount);
  const trustInfo = getTrustLabelInfo(penalties, userProfile?.trustStatus);

  // Real data: let's analyze the completed tasks by this user to count by category!
  const myCompletedTasks = tasks.filter(
    (t) => t.volunteerId === currentUser?.uid && t.status === 'completed'
  );

  const categoryCounts: Record<string, number> = {};
  myCompletedTasks.forEach((t) => {
    const cat = t.category || 'other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'delivery': return 'Жеткізу және тасымалдау 📦';
      case 'cleaning': return 'Үй және аула тазалығы 🧹';
      case 'shopping': return 'Азық-түлік алу және дүкен 🛒';
      case 'elderly': return 'Қарттарға көмек көрсету 👵';
      case 'children': return 'Балалармен сырласу/күту 👶';
      case 'pets': return 'Үй жануарларына көмек 🐾';
      case 'other': return 'Басқа да көмек көрсетулер 🤝';
      default: return cat;
    }
  };

  const categoriesData = Object.entries(categoryCounts).map(([cat, count]) => ({
    label: getCategoryLabel(cat),
    count,
    percent: completedCount > 0 ? (count / completedCount) * 105 : 0
  }));

  // Dummy monthly tracker for gorgeous visuals
  const monthsData = [
    { name: 'Қаң', hours: Math.min(totalHours, Math.round(totalHours * 0.1)) },
    { name: 'Ақп', hours: Math.min(totalHours, Math.round(totalHours * 0.15)) },
    { name: 'Нау', hours: Math.min(totalHours, Math.round(totalHours * 0.2)) },
    { name: 'Сәу', hours: Math.min(totalHours, Math.round(totalHours * 0.25)) },
    { name: 'Мам', hours: Math.min(totalHours, Math.round(totalHours * 0.15)) },
    { name: 'Мау', hours: Math.min(totalHours, Math.round(totalHours * 0.155)) },
  ];

  const maxMonthHours = Math.max(...monthsData.map(m => m.hours), 1);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 font-sans" id="statistics_page_wrapper">
      <div>
        <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <BarChart className="w-7 h-7 text-teal-600" />
          Жеке волонтерлік статистикаңыз
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
          Сіздің пайдалы қызмет сағаттарыңыздың, көрсеткіштеріңіздің және жетістіктеріңіздің кеңейтілген анализі
        </p>
      </div>

      {/* Volunteer Badge and Trust Level Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="stats_badge_trust_panel">
        {/* Volunteer Level Badge Card */}
        <div className={`p-5 rounded-3xl border flex items-start gap-4 shadow-xs transition-shadow ${rankInfo.badgeColor}`}>
          <div className="p-3 bg-white/70 dark:bg-neutral-900/40 rounded-2xl border border-current">
            <Award className="w-7 h-7 shrink-0" />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-black tracking-widest opacity-75">Ағымдағы дәрежеңіз</span>
            <h3 className="text-lg font-black">{rankInfo.name}</h3>
            <p className="text-xs opacity-90">{rankInfo.desc}</p>
            <div className="text-[10px] mt-1 font-semibold opacity-75">
              Сізде аяқталған {completedCount} тапсырма бар. (3+ Белсенді, 11+ Тәжірибелі, 26+ Лидер)
            </div>
          </div>
        </div>

        {/* Trust Status Card */}
        <div className={`p-5 rounded-3xl border flex items-start gap-4 shadow-xs transition-shadow ${trustInfo.badgeColor}`}>
          <div className="p-3 bg-white/70 dark:bg-neutral-900/40 rounded-2xl border border-current">
            <ShieldCheck className="w-7 h-7 shrink-0" />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-black tracking-widest opacity-75">Сенімділік мәртебесі (Trust Status)</span>
            <h3 className="text-lg font-black">{trustInfo.name}</h3>
            <p className="text-xs opacity-90">{trustInfo.desc}</p>
            <div className="text-[10px] mt-1 font-semibold opacity-75">
              Жалпы айыппұл ұпайыңыз: {penalties}/5. ({penalties >= 3 ? 'Сенімділік төмендеді!' : 'Қауымдастық сенімі жоғары'})
            </div>
          </div>
        </div>
      </div>

      {/* Grid of 4 Core KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats_kpi_grid">
        {/* KPI 1 */}
        <div className="bg-gradient-to-br from-white to-teal-50/10 dark:from-neutral-900 dark:to-neutral-950/20 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="p-3.5 bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 rounded-xl">
            <Clock className="w-6 h-6 shrink-0" />
          </div>
          <div>
            <span className="text-[10px] text-neutral-450 uppercase font-black tracking-wider block">Жалпы уақыт</span>
            <span className="text-2xl font-black text-neutral-800 dark:text-neutral-100">{totalHours} сағат</span>
            <span className="text-[9px] text-emerald-500 font-extrabold block mt-0.5">Қоғамға сыйланған уақыт ❤️</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-gradient-to-br from-white to-sky-50/10 dark:from-neutral-900 dark:to-neutral-950/20 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="p-3.5 bg-sky-50 dark:bg-sky-950/30 text-sky-605 text-sky-500 rounded-xl">
            <Award className="w-6 h-6 shrink-0" />
          </div>
          <div>
            <span className="text-[10px] text-neutral-450 uppercase font-black tracking-wider block">Аяқталған істер</span>
            <span className="text-2xl font-black text-neutral-800 dark:text-neutral-100">{completedCount} тапсырма</span>
            <span className="text-[9px] text-sky-500 font-bold block mt-0.5">Расталған сәтті көмектер ✨</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-gradient-to-br from-white to-amber-50/10 dark:from-neutral-900 dark:to-neutral-950/20 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 text-amber-550 text-amber-500 rounded-xl">
            <Star className="w-6 h-6 shrink-0 fill-amber-500/10" />
          </div>
          <div>
            <span className="text-[10px] text-neutral-450 uppercase font-black tracking-wider block">Орташа рейтинг</span>
            <span className="text-2xl font-black text-neutral-800 dark:text-neutral-100">⭐ {rating.toFixed(1)}</span>
            <span className="text-[9px] text-amber-500 font-bold block mt-0.5">Тапсырыс берушілер бағасы 🌟</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-gradient-to-br from-white to-rose-50/10 dark:from-neutral-900 dark:to-neutral-950/20 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-955/10 text-rose-500 rounded-xl">
            <AlertTriangle className="w-6 h-6 shrink-0" />
          </div>
          <div>
            <span className="text-[10px] text-neutral-450 uppercase font-black tracking-wider block">Айыппұл ұпайы</span>
            <span className="text-2xl font-black text-neutral-805 text-neutral-800 dark:text-neutral-100">{penalties} ұпай</span>
            <span className={`text-[9px] font-bold block mt-0.5 ${penalties === 0 ? 'text-green-500' : 'text-rose-500'}`}>
              {penalties === 0 ? 'Сенімділігі өте жоғары ✅' : 'Ережелерді сақтаңыз! ⚠️'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Monthly activity simulated chart */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xs">
          <div>
            <h3 className="text-sm font-black text-neutral-860 text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-teal-600" />
              Айлық волонтерлік белсенділік (Сағат есебімен)
            </h3>
            <p className="text-[11px] text-neutral-450">Платформада көршілерге белсенді көмек көрсеткен сағаттардың айлар бойынша көрсеткіші</p>
          </div>

          <div className="flex items-end justify-between h-48 pt-6 px-2 border-b border-neutral-100 dark:border-neutral-800" id="statistics_monthly_graph">
            {monthsData.map((m) => {
              const heightPercent = maxMonthHours > 0 ? (m.hours / maxMonthHours) * 100 : 0;
              return (
                <div key={m.name} className="flex flex-col items-center gap-2 w-10">
                  <div className="text-[10px] font-black text-neutral-600 dark:text-neutral-450">{m.hours} сағ</div>
                  <div 
                    className="w-8 rounded-t-lg bg-gradient-to-t from-teal-650 to-teal-500 from-teal-600 to-teal-400 transition-all duration-500 hover:opacity-80 cursor-pointer"
                    style={{ height: `${Math.max(5, heightPercent)}%` }}
                  />
                  <div className="text-xs font-bold text-neutral-450 mt-1">{m.name}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category breakdown analysis bar list */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xs">
          <div>
            <h3 className="text-sm font-black text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <HeartPulse className="w-5 h-5 text-teal-605 text-teal-600" />
              Бағыттар бойынша көмек көрсету үлесі (%)
            </h3>
            <p className="text-[11px] text-neutral-450">Сіздің аяқтаған тапсырмаларыңыздың санаттар бойынша жіктелуі</p>
          </div>

          <div className="space-y-4 pt-2" id="statistics_category_list">
            {categoriesData.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400 italic font-sans">
                Санаттарды талдау үшін кем дегенде 1 тапсырманы ойдағыдай аяқтау қажет.
              </div>
            ) : (
              categoriesData.map((cat) => (
                <div key={cat.label} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    <span>{cat.label}</span>
                    <span>{cat.count} рет</span>
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-teal-600 rounded-full"
                      style={{ width: `${Math.min(100, cat.percent)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Motivational Bottom Quote Banner */}
      <div className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-2xl p-6 text-center space-y-2 shadow-xs">
        <h4 className="font-extrabold text-sm font-sans">Сіз жүректерді жылытып жүрсіз! 💖</h4>
        <p className="text-xs max-w-2xl mx-auto opacity-90 leading-relaxed font-sans">
          "Жақсылық жасау - ақшамен немесе байлықпен өлшенбейді. Ол тек сенің адал ниетің және басқаның мұңына бей-жай қарамаған жылы жүрегің арқылы жасалады." Сіздің әрбір волонтерлік уақытыңыз Қазақстанның әрбір қаласында ізгілік нышанын нығайтады!
        </p>
      </div>

    </div>
  );
}
