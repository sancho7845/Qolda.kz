import React from 'react';
import { Award, Medal, Trophy, Star, CheckCircle, Lock } from 'lucide-react';
import { UserProfile } from '../types';

interface AchievementsPageProps {
  userProfile: UserProfile;
}

export default function AchievementsPage({ userProfile }: AchievementsPageProps) {
  const completed = userProfile?.completedTasksCount || 0;
  const totalHours = userProfile?.totalVolunteerHours || 0;
  const ratingVal = userProfile?.rating || 5;

  // Determine current tier
  const getTierInfo = () => {
    if (completed <= 2) {
      return {
        title: 'Жаңадан келген 👶',
        description: 'Волонтерлік жолыңыздың басы. Көршілерге көмектесуді жалғастырыңыз!',
        nextTier: 'Белсенді волонтер (3 тапсырма)',
        progress: (completed / 3) * 100,
        color: 'from-blue-500 to-cyan-500'
      };
    }
    if (completed >= 3 && completed <= 10) {
      return {
        title: 'Белсенді волонтер 🤝',
        description: 'Сіз көптеген адамдарға көмектесе алдыңыз. Жарайсыз!',
        nextTier: 'Тәжірибелі волонтер (11 тапсырма)',
        progress: (completed / 11) * 100,
        color: 'from-amber-500 to-orange-500'
      };
    }
    if (completed > 10 && completed <= 25) {
      return {
        title: 'Тәжірибелі волонтер 🌟',
        description: 'Сіз біздің қауымдастықтың сенімді әрі маңызды тірегісіз.',
        nextTier: 'Лидер (26 тапсырма)',
        progress: (completed / 26) * 100,
        color: 'from-teal-500 to-emerald-500'
      };
    }
    return {
      title: 'Лидер 🏆',
      description: 'Сіз - нағыз волонтерлік көшбасшысыз! Шеберлігіңіз шексіз.',
      nextTier: 'Жоғары деңгейге жеттіңіз!',
      progress: 100,
      color: 'from-purple-600 to-pink-600'
    };
  };

  const tier = getTierInfo();

  const achievementsList = [
    {
      id: 'first_task',
      title: 'Алғашқы қадам',
      desc: 'Ең алғашқы тапсырманы ойдағыдай аяқтау',
      icon: <CheckCircle className="w-8 h-8 text-emerald-500" />,
      requirement: '1 тапсырманы орындау',
      unlocked: completed >= 1
    },
    {
      id: 'five_tasks',
      title: 'Бес көмекші',
      desc: '5 тапсырманы аяқтаған белсенді ерікті',
      icon: <Medal className="w-8 h-8 text-blue-500" />,
      requirement: '5 тапсырманы орындау',
      unlocked: completed >= 5
    },
    {
      id: 'ten_tasks',
      title: 'Алтын Жүрек',
      desc: '10 тапсырманы аяқтаған қайырымды ерікті',
      icon: <Trophy className="w-8 h-8 text-amber-500" />,
      requirement: '10 тапсырманы орындау',
      unlocked: completed >= 10
    },
    {
      id: 'hours_50',
      title: 'Қоғам Қалқаны',
      desc: '50 толық сағат бойы көмек көрсеткен',
      icon: <Star className="w-8 h-8 text-teal-500" />,
      requirement: '50 волонтерлік сағат жинау',
      unlocked: totalHours >= 50
    },
    {
      id: 'hours_100',
      title: 'Ұлттық қамқоршы',
      desc: '100 толық сағат бойы көмек көрсеткен',
      icon: <Award className="w-8 h-8 text-rose-500" />,
      requirement: '100 волонтерлік сағат жинау',
      unlocked: totalHours >= 100
    },
    {
      id: 'best_volunteer',
      title: 'Мінсіз Көмекші',
      desc: '3+ тапсырманы аяқтап, 5.0 деңгейіндегі мінсіз рейтинг алу',
      icon: <Trophy className="w-8 h-8 text-purple-500" />,
      requirement: '3+ аяқталған іс және 5.0 таза рейтинг',
      unlocked: ratingVal >= 5.0 && completed >= 3
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 font-sans" id="achievements_page_wrapper">
      {/* Header and overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <Award className="w-7 h-7 text-amber-500 animate-pulse" />
            Жетістіктер мен медальдар
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Сіздің волонтерлік белсенділігіңіз бен марапаттарыңыздың есеп деңгейі
          </p>
        </div>
      </div>

      {/* Tier Progress Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row gap-6 items-center">
        <div className={`w-28 h-28 rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center shrink-0 shadow-md text-white`}>
          <Medal className="w-16 h-16" />
        </div>
        <div className="flex-1 w-full space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-neutral-400 block">Ағымдағы Мәртебе</span>
              <h3 className="text-xl font-black text-neutral-800 dark:text-neutral-100">{tier.title}</h3>
            </div>
            <div className="text-right sm:text-right text-xs">
              <span className="text-neutral-400 block">Келесі деңгей:</span>
              <span className="font-extrabold text-neutral-700 dark:text-neutral-300">{tier.nextTier}</span>
            </div>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 italic">
            "{tier.description}"
          </p>
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-neutral-500">
              <span>Прогресс</span>
              <span>{Math.min(100, Math.round(tier.progress))}%</span>
            </div>
            <div className="w-full h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-teal-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, tier.progress)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Achievements */}
      <div className="space-y-4">
        <h4 className="font-extrabold text-base text-neutral-800 dark:text-neutral-200">Қолжетімді марапаттар тізімі</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="achievements_grid_list">
          {achievementsList.map((a) => (
            <div 
              key={a.id} 
              className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-48 ${
                a.unlocked 
                  ? 'bg-gradient-to-br from-white to-teal-50/20 dark:from-neutral-900 dark:to-teal-950/10 border-teal-200 dark:border-teal-900 shadow-sm hover:shadow-md'
                  : 'bg-neutral-55 bg-neutral-50/50 dark:bg-neutral-900/30 border-neutral-150 dark:border-neutral-950 text-neutral-400 opacity-65'
              }`}
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className={`p-3 rounded-xl shrink-0 ${a.unlocked ? 'bg-teal-50 dark:bg-teal-950/30' : 'bg-neutral-100 dark:bg-neutral-800/50'}`}>
                  {a.unlocked ? a.icon : <Lock className="w-8 h-8 text-neutral-400" />}
                </div>
                <div className="text-right">
                  <span className={`px-2.5 py-1 text-[9px] uppercase font-black tracking-wider rounded-lg ${
                    a.unlocked 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' 
                      : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-450'
                  }`}>
                    {a.unlocked ? 'Қол жетті' : 'Бұғатталған'}
                  </span>
                </div>
              </div>

              <div>
                <h5 className={`font-black text-sm font-sans ${a.unlocked ? 'text-neutral-850 text-neutral-900 dark:text-neutral-100' : 'text-neutral-450 text-neutral-500'}`}>
                  {a.title}
                </h5>
                <p className="text-[11px] text-neutral-450 dark:text-neutral-500 mt-1 line-clamp-2">
                  {a.desc}
                </p>
              </div>

              <div className="border-t border-neutral-100 dark:border-neutral-800 pt-2.5 mt-2.5 text-[10px] flex items-center justify-between">
                <span className="text-neutral-400">Талабы:</span>
                <span className={`font-bold ${a.unlocked ? 'text-teal-600 dark:text-teal-400' : 'text-neutral-500'}`}>
                  {a.requirement}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
