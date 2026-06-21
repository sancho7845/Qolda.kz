import React, { useState, useEffect } from 'react';
import { 
  StarIcon, 
  MessageSquare, 
  Check, 
  HeartHandshake 
} from 'lucide-react';
import { 
  Task, 
  UserProfile, 
  STATUS_LABELS, 
  TaskStatus, 
  PRESET_AVATARS, 
  AVATAR_STYLING, 
  AVATAR_EMOJIS, 
  KAZAKHSTAN_CITIES 
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
}: MyDashboardPageProps) {
  // Editing profile states
  const [editProfileMode, setEditProfileMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

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
      await loadTasks();
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

  if (!currentUser || !userProfile) {
    return (
      <div className="py-12 text-center text-xs font-bold text-neutral-400 font-sans">
        Профиль деректері жүктелуде немесе табылмады...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start bg-transparent">
      
      {/* Profile Panel Column */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-2xl p-6 space-y-6">
        
        {editProfileMode ? (
          
          /* EDIT PROFILE FORM BOARD */
          <form onSubmit={handleUpdateProfile} className="space-y-4 bg-transparent">
            <h4 className="font-black text-sm text-neutral-800 dark:text-neutral-100 font-sans bg-transparent">Профильді өңдеу</h4>
            
            <div className="space-y-1 bg-transparent">
              <label className="text-xs font-bold text-neutral-600 dark:text-neutral-450">Өзгерту аватары:</label>
              <div className="grid grid-cols-6 gap-2 bg-transparent">
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

            <div className="space-y-1 bg-transparent">
              <label className="text-xs font-bold text-neutral-600 dark:text-neutral-450">Аты-жөніңіз:</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full p-2 rounded-lg border border-neutral-250 bg-transparent text-xs dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 outline-none"
              />
            </div>

            <div className="space-y-1 bg-transparent">
              <label className="text-xs font-bold text-neutral-600 dark:text-neutral-450">Тұрғылықты қалаңыз:</label>
              <select
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                className="w-full p-2 rounded-lg border border-neutral-250 bg-transparent text-xs dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 outline-none font-semibold"
              >
                {KAZAKHSTAN_CITIES.map((c) => (
                  <option key={c} value={c} className="dark:text-neutral-800">{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 bg-transparent">
              <label className="text-xs font-bold text-neutral-600 dark:text-neutral-450">Телефон:</label>
              <input
                type="text"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full p-2 rounded-lg border border-neutral-250 bg-transparent text-xs dark:border-neutral-700 text-neutral-805 dark:text-neutral-100 outline-none font-semibold"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2 bg-transparent">
              <button
                type="button"
                onClick={() => setEditProfileMode(false)}
                className="py-1.5 px-3 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
              >
                Бас тарту
              </button>
              <button
                type="submit"
                className="py-1.5 px-4 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 cursor-pointer"
              >
                Сақтау
              </button>
            </div>
          </form>
        ) : (
          
          /* VIEW PROFILE PANEL */
          <div className="space-y-6 bg-transparent">
            <div className="flex items-center gap-4 bg-transparent">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${AVATAR_STYLING[userProfile?.avatarId || 'avatar_1']}`}>
                {AVATAR_EMOJIS[userProfile?.avatarId || 'avatar_1']}
              </div>
              <div className="bg-transparent">
                <h4 className="font-black text-lg text-neutral-900 dark:text-neutral-50 mb-0.5 font-sans">{userProfile?.name}</h4>
                <div className="flex flex-col gap-1 bg-transparent">
                  <span className="text-[10px] text-neutral-450 font-semibold uppercase tracking-wider font-sans">{userProfile?.city} тұрғыны</span>
                  <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase tracking-wider w-fit font-sans ${
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
            <div className="space-y-2 border-t border-neutral-100 dark:border-neutral-800 pt-4 text-xs bg-transparent">
              <div className="flex justify-between bg-transparent">
                <span className="text-neutral-450">Эл.пошта:</span>
                <span className="font-semibold text-neutral-705 dark:text-neutral-200 truncate max-w-[180px]">{userProfile?.email}</span>
              </div>
              <div className="flex justify-between bg-transparent">
                <span className="text-neutral-450">Байланыс телефоны:</span>
                <span className="font-semibold text-neutral-705 dark:text-neutral-200">{userProfile?.phone || 'Көрсетілмеген'}</span>
              </div>
            </div>

            {/* User Ratings Display */}
            <div className="grid grid-cols-2 gap-4 border-t border-b border-neutral-100 dark:border-neutral-800 py-4 text-center bg-transparent">
              <div className="border-r border-neutral-100 dark:border-neutral-800 bg-transparent">
                <div className="text-xl font-bold text-amber-500 flex items-center justify-center gap-1 bg-transparent">
                  <StarIcon className="w-5 h-5 fill-amber-500 text-amber-500 shrink-0" />
                  {userProfile?.rating || 5}
                </div>
                <div className="text-[9px] text-neutral-400 uppercase font-black tracking-wider mt-1 font-sans">Орташа рейтинг</div>
              </div>
              <div className="bg-transparent">
                <div className="text-xl font-bold text-neutral-800 dark:text-neutral-100 bg-transparent">
                  {userProfile?.reviewsCount || 0}
                </div>
                <div className="text-[9px] text-neutral-400 uppercase font-black tracking-wider mt-1 font-sans">Жалпы пікірлер</div>
              </div>
            </div>

            {/* Stats numbers */}
            <div className="space-y-2.5 text-xs text-neutral-600 dark:text-neutral-300 bg-transparent">
              <div className="flex justify-between bg-neutral-50 dark:bg-neutral-850/30 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                <span className="font-medium text-neutral-500">Волонтерлік көмек жасадым:</span>
                <span className="font-extrabold text-teal-650">{userProfile?.completedTasksCount || 0} рет</span>
              </div>
              <div className="flex justify-between bg-neutral-50 dark:bg-neutral-850/30 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                <span className="font-medium text-neutral-500">Қабылдаған істерім:</span>
                <span className="font-extrabold text-neutral-700 dark:text-neutral-250">{userProfile?.acceptedTasksCount || 0} іс</span>
              </div>
            </div>

            {/* Volunteer Level display */}
            <div className="bg-gradient-to-r from-amber-500/10 to-teal-500/10 dark:from-amber-500/5 dark:to-teal-500/5 p-3 rounded-xl border border-amber-500/20 dark:border-amber-500/10 flex items-center justify-between text-xs">
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
            <div className="flex gap-2 bg-transparent animate-in fade-in">
              <button
                onClick={handleOpenEditProfile}
                className="flex-1 py-2 px-4 border border-neutral-200 dark:border-neutral-700 dark:hover:bg-neutral-800 hover:bg-neutral-100 rounded-xl text-xs font-semibold text-center text-neutral-705 dark:text-neutral-200 transition-colors cursor-pointer"
              >
                Профильді өңдеу
              </button>
            </div>
          </div>
        )}

        {/* Reviews History Post logs */}
        <div className="border-t border-neutral-150 dark:border-neutral-800 pt-5 space-y-3.5 bg-transparent">
          <h5 className="font-extrabold text-xs text-neutral-800 dark:text-neutral-300 flex items-center gap-1.5 font-sans bg-transparent">
            <MessageSquare className="w-4 h-4 text-amber-500" />
            Маған қалдырылған пікірлер
          </h5>

          <div className="space-y-3 max-h-56 overflow-y-auto bg-transparent">
            {myReviews.length === 0 ? (
              <div className="p-4 border border-neutral-100 dark:border-neutral-800 rounded-xl text-center text-[11px] text-neutral-400 font-sans">
                Пікірлер әлі жазылмаған
              </div>
            ) : (
              myReviews.map((r) => (
                <div key={r.id} className="p-3 bg-neutral-50 dark:bg-neutral-850/20 border border-neutral-100 dark:border-neutral-800 rounded-xl text-[11px]">
                  <div className="flex justify-between items-start mb-1.5 bg-transparent">
                    <div className="flex items-center gap-1.5 bg-transparent">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${AVATAR_STYLING[r.reviewerAvatar || 'avatar_1']}`}>
                        {AVATAR_EMOJIS[r.reviewerAvatar || 'avatar_1']}
                      </div>
                      <span className="font-bold text-neutral-700 dark:text-neutral-300">{r.reviewerName}</span>
                    </div>
                    <span className="font-black text-amber-400 shrink-0">⭐ {r.rating}</span>
                  </div>
                  <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed italic">&quot;{r.text}&quot;</p>
                  <span className="text-[8px] text-neutral-450 block text-right mt-1 font-sans">{new Date(r.createdAt).toLocaleDateString('kk')}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Activity Tracker List Column */}
      <div className="lg:col-span-2 space-y-6 bg-transparent">
        
        {/* Part 1: My Help Requests (МЕНІҢ КӨМЕК ТАПСЫРМАЛАРЫМ) */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-2xl p-6 space-y-4">
          <div className="bg-transparent">
            <h3 className="text-base font-black text-neutral-900 dark:text-neutral-50 font-sans bg-transparent">Менің көмек өтініштерім</h3>
            <p className="text-neutral-450 text-xs font-sans">Жариялаған өтініштеріңіз, олардың орындалу барысы және растау әрекеттері</p>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-transparent">
            {tasks.filter(t => t.creatorId === currentUser.uid).length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400 italic font-sans bg-transparent">Сынама ретінде бірде-бір тапсырма жасамағансыз.</div>
            ) : (
              tasks.filter(t => t.creatorId === currentUser.uid).map((t) => (
                <div key={t.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1 max-w-md bg-transparent">
                    <div className="flex items-center gap-2 bg-transparent">
                      <span className="font-bold text-neutral-800 dark:text-neutral-200 text-sm truncate font-sans">{t.title}</span>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full font-sans ${
                        t.status === 'new' ? 'bg-blue-105 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                        t.status === 'in_progress' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                        'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      }`}>
                        {STATUS_LABELS[t.status]}
                      </span>
                    </div>
                    <p className="text-neutral-500 dark:text-neutral-400 truncate text-xs">{t.description}</p>
                    {t.volunteerId && (
                      <div className="text-[10px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-800 p-1 px-2.5 rounded-md border dark:border-neutral-800 w-fit">
                        <span>Қабылдаған Ерікті: <strong>{t.volunteerName}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0 bg-transparent">
                    {t.status === TaskStatus.IN_PROGRESS && (
                      <button
                        onClick={() => handleCompleteTask(t.id)}
                        className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-[10px] shadow-sm flex items-center gap-1 cursor-pointer transition-all shrink-0"
                      >
                        <Check className="w-3.5 h-3.5 pointer-events-none" />
                        Аяқталғанын растау
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedTask(t)}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Толығырақ
                    </button>
                    {t.status === TaskStatus.NEW && (
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
        <div className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-2xl p-6 space-y-4">
          <div className="bg-transparent">
            <h3 className="text-base font-black text-neutral-900 dark:text-neutral-50 font-sans">Менің ерікті жұмыстарым</h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-xs font-sans">Басқа адамдарға көмектесу үшін қабылдаған іс-шараларыңыз бен тарихыңыз</p>
          </div>

          <div className="divide-y divide-neutral-105 dark:divide-neutral-800 bg-transparent">
            {tasks.filter(t => t.volunteerId === currentUser.uid).length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400 italic font-sans bg-transparent">Әзірге ешқандай өтініш қабылдамағансыз. Көршілерге көмектесуді бастаңыз! 🤝</div>
            ) : (
              tasks.filter(t => t.volunteerId === currentUser.uid).map((t) => (
                <div key={t.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1 max-w-md bg-transparent">
                    <div className="flex items-center gap-2 bg-transparent">
                      <span className="font-bold text-neutral-800 dark:text-neutral-200 text-sm truncate font-sans">{t.title}</span>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full font-sans ${
                        t.status === 'in_progress' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                        'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      }`}>
                        {STATUS_LABELS[t.status]}
                      </span>
                    </div>
                    <p className="text-neutral-500 dark:text-neutral-400 text-xs truncate leading-relaxed">{t.description}</p>
                    <div className="text-[10px] text-neutral-450 dark:text-neutral-400">Көмек иесі: <span className="font-semibold text-neutral-700 dark:text-neutral-200">{t.creatorName}</span></div>
                  </div>

                  <div className="flex gap-2 shrink-0 bg-transparent">
                    <button
                      onClick={() => setSelectedTask(t)}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg font-bold text-[10px] text-neutral-700 dark:text-neutral-300 cursor-pointer"
                    >
                      Көру және байланысу
                    </button>
                    {t.status === TaskStatus.IN_PROGRESS && (
                      <button
                        onClick={() => handleCancelAcceptance(t.id)}
                        className="px-3 py-1.5 border border-rose-200 text-rose-600 dark:border-rose-900/40 dark:text-rose-405 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-[10px] font-bold cursor-pointer"
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
  );
}
