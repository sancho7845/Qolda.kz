import React, { useState, useEffect } from 'react';
import { Trophy, Search, Star, Medal, Clock, ShieldCheck, Heart } from 'lucide-react';
import { UserProfile, AVATAR_STYLING, AVATAR_EMOJIS } from '../types';
import { getUsers } from '../services/dbService';

export default function LeaderboardPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const getLevelLabel = (count: number) => {
    if (count <= 2) return 'Жаңадан келген 🌱';
    if (count <= 10) return 'Белсенді волонтер ⚡';
    if (count <= 25) return 'Тәжірибелі волонтер 💪';
    return 'Лидер 🏆';
  };

  const getTrustBadge = (pPoints: number, dbStatus?: string) => {
    const isLow = pPoints >= 3 || dbStatus === 'Төмен сенімді';
    if (isLow) return { name: 'Төмен сенімді ⚠️', style: 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-500/10' };
    return { name: dbStatus || 'Жоғары сенімді ✅', style: 'bg-teal-50 text-teal-600 dark:bg-teal-950/10 dark:text-teal-400 border border-teal-500/10' };
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const list = await getUsers();
        // filter out system/banned users if appropriate, but anyway show volunteers
        const activeVolunteers = (list || []).filter(u => !u.isBanned);
        
        // Sort by completedTasksCount DESC, then totalVolunteerHours DESC, then rating DESC
        const sorted = activeVolunteers.sort((a, b) => {
          const aTasks = a.completedTasksCount || 0;
          const bTasks = b.completedTasksCount || 0;
          if (bTasks !== aTasks) return bTasks - aTasks;

          const aHours = a.totalVolunteerHours || 0;
          const bHours = b.totalVolunteerHours || 0;
          if (bHours !== aHours) return bHours - aHours;

          const aRating = a.rating || 5;
          const bRating = b.rating || 5;
          return bRating - aRating;
        });

        setUsers(sorted);
      } catch (e) {
        console.error('Error fetching leaderboard:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users by search
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Top 3 Podium
  const top3 = filteredUsers.slice(0, 3);
  const theRest = filteredUsers.slice(3);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 font-sans animate-in fade-in duration-300" id="leaderboard_page_wrapper">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-500 animate-bounce" />
            Үздік волонтерлер рейтингі
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1 flex items-center gap-1">
            <span>Платформадағы ең белсенді және жүрегі жомарт азаматтар көшбасшылығы</span>
          </p>
        </div>

        {/* Live Search bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Волонтерды немесе қаланы іздеу..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs font-bold text-neutral-450 italic">
          Көшбасшылар тізімі жүктелуде...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-12 text-center text-neutral-400">
          Сұранысыңызға сәйкес белсенді волонтерлер табылмады.
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Top 3 Podium Cards */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4" id="leaderboard_podium_container">
              
              {/* Silver #2 */}
              {top3[1] && (
                <div className="order-2 md:order-1 flex flex-col items-center bg-white dark:bg-neutral-950 p-6 rounded-2xl border border-neutral-150 dark:border-neutral-850 shadow-xs relative pt-10 text-center min-h-[280px] justify-between">
                  {/* Badge position */}
                  <div className="absolute -top-4 w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-neutral-900 flex items-center justify-center text-xs font-extrabold text-slate-700 dark:text-slate-300 shadow-sm">
                    2
                  </div>
                  
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    {top3[1].avatarUrl ? (
                      <img src={top3[1].avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-slate-300 shadow-xs" referrerPolicy="no-referrer" />
                    ) : (
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 border-slate-300 ${AVATAR_STYLING[top3[1].avatarId || 'avatar_1']}`}>
                        {AVATAR_EMOJIS[top3[1].avatarId || 'avatar_1']}
                      </div>
                    )}
                    <h3 className="font-black text-sm text-neutral-800 dark:text-neutral-100 line-clamp-1">{top3[1].name}</h3>
                    <span className="text-[10px] text-neutral-450 uppercase font-bold tracking-wide">{top3[1].city}</span>
                    
                    {/* Rank & Trust */}
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-extrabold">{getLevelLabel(top3[1].completedTasksCount || 0)}</span>
                    {(() => {
                      const trust = getTrustBadge(top3[1].penaltyPoints || 0, top3[1].trustStatus);
                      return (
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${trust.style}`}>
                          {trust.name}
                        </span>
                      );
                    })()}
                  </div>
                  
                  <div className="w-full grid grid-cols-2 gap-2 border-t border-neutral-100 dark:border-neutral-900 pt-3 text-[11px] font-extrabold mt-3">
                    <div className="text-center border-r border-neutral-50 dark:border-neutral-900">
                      <span className="text-neutral-450 text-[9px] block">Орындаулары</span>
                      <span className="text-teal-600 dark:text-teal-400">{top3[1].completedTasksCount || 0} рет</span>
                    </div>
                    <div className="text-center">
                      <span className="text-neutral-450 text-[9px] block">Жалпы уақыты</span>
                      <span className="text-amber-500">{top3[1].totalVolunteerHours || 0} сағ</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Gold #1 */}
              {top3[0] && (
                <div className="order-1 md:order-2 flex flex-col items-center bg-gradient-to-b from-amber-500/10 to-transparent dark:from-amber-950/20 bg-white dark:bg-neutral-950 p-6 rounded-2xl border-2 border-amber-300 dark:border-amber-900/40 shadow-md relative pt-12 text-center min-h-[310px] justify-between z-10 scale-100 md:scale-105">
                  {/* Badge position */}
                  <div className="absolute -top-6 w-12 h-12 rounded-full bg-amber-400 border-4 border-white dark:border-neutral-900 flex items-center justify-center text-base font-black text-amber-900 shadow-md animate-bounce">
                    👑
                  </div>
                  
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    {top3[0].avatarUrl ? (
                      <img src={top3[0].avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 shadow-sm" referrerPolicy="no-referrer" />
                    ) : (
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl border-2 border-amber-400 ${AVATAR_STYLING[top3[0].avatarId || 'avatar_1']}`}>
                        {AVATAR_EMOJIS[top3[0].avatarId || 'avatar_1']}
                      </div>
                    )}
                    <h3 className="font-black text-base text-neutral-800 dark:text-neutral-100 line-clamp-1">{top3[0].name}</h3>
                    <span className="text-[10px] text-neutral-455 uppercase font-bold tracking-wide">{top3[0].city}</span>
                    
                    {/* Rank & Trust */}
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-extrabold">{getLevelLabel(top3[0].completedTasksCount || 0)}</span>
                    {(() => {
                      const trust = getTrustBadge(top3[0].penaltyPoints || 0, top3[0].trustStatus);
                      return (
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${trust.style}`}>
                          {trust.name}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="w-full grid grid-cols-2 gap-2 border-t border-neutral-100 dark:border-neutral-850 pt-3 text-[11px] font-black mt-3">
                    <div className="text-center border-r border-neutral-50 dark:border-neutral-850">
                      <span className="text-neutral-450 text-[9px] block">Орындаулары</span>
                      <span className="text-teal-600 dark:text-teal-400">{top3[0].completedTasksCount || 0} рет</span>
                    </div>
                    <div className="text-center">
                      <span className="text-neutral-450 text-[9px] block">Жалпы уақыты</span>
                      <span className="text-amber-500">{top3[0].totalVolunteerHours || 0} сағ</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bronze #3 */}
              {top3[2] && (
                <div className="order-3 md:order-3 flex flex-col items-center bg-white dark:bg-neutral-950 p-6 rounded-2xl border border-neutral-150 dark:border-neutral-850 shadow-xs relative pt-10 text-center min-h-[260px] justify-between">
                  {/* Badge position */}
                  <div className="absolute -top-4 w-9 h-9 rounded-full bg-amber-600 text-white border-2 border-white dark:border-neutral-900 flex items-center justify-center text-xs font-extrabold shadow-sm">
                    3
                  </div>
                  
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    {top3[2].avatarUrl ? (
                      <img src={top3[2].avatarUrl} alt="" className="w-13 h-13 rounded-full object-cover border-2 border-amber-600/30 shadow-xs" referrerPolicy="no-referrer" />
                    ) : (
                      <div className={`w-13 h-13 rounded-full flex items-center justify-center text-2xl border-2 border-amber-600/30 ${AVATAR_STYLING[top3[2].avatarId || 'avatar_1']}`}>
                        {AVATAR_EMOJIS[top3[2].avatarId || 'avatar_1']}
                      </div>
                    )}
                    <h3 className="font-black text-sm text-neutral-800 dark:text-neutral-100 line-clamp-1">{top3[2].name}</h3>
                    <span className="text-[10px] text-neutral-455 uppercase font-bold tracking-wide">{top3[2].city}</span>
                    
                    {/* Rank & Trust */}
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-extrabold">{getLevelLabel(top3[2].completedTasksCount || 0)}</span>
                    {(() => {
                      const trust = getTrustBadge(top3[2].penaltyPoints || 0, top3[2].trustStatus);
                      return (
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${trust.style}`}>
                          {trust.name}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="w-full grid grid-cols-2 gap-2 border-t border-neutral-100 dark:border-neutral-900 pt-3 text-[11px] font-extrabold mt-3">
                    <div className="text-center border-r border-neutral-50 dark:border-neutral-900">
                      <span className="text-neutral-450 text-[9px] block">Орындаулары</span>
                      <span className="text-teal-600 dark:text-teal-400">{top3[2].completedTasksCount || 0} рет</span>
                    </div>
                    <div className="text-center">
                      <span className="text-neutral-450 text-[9px] block">Жалпы уақыты</span>
                      <span className="text-amber-500">{top3[2].totalVolunteerHours || 0} сағ</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* List of Other Volunteers */}
          {theRest.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="px-6 py-4.5 bg-neutral-50/50 dark:bg-neutral-900/50 border-b border-neutral-100 dark:border-neutral-800">
                <h4 className="font-black text-xs text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Басқа да белсенді еріктілер</h4>
              </div>

              <div className="divide-y divide-neutral-100 dark:divide-neutral-800" id="leaderboard_volunteers_list">
                {theRest.map((u, index) => (
                  <div key={u.uid} className="px-6 py-4 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-4">
                      {/* Place index */}
                      <span className="w-6 text-center font-bold text-neutral-400 dark:text-neutral-500">
                        {index + 4}
                      </span>

                      {/* Avatar */}
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm shrink-0 border border-neutral-100 ${AVATAR_STYLING[u.avatarId || 'avatar_1']}`}>
                          {AVATAR_EMOJIS[u.avatarId || 'avatar_1']}
                        </div>
                      )}

                      {/* Name & City */}
                      <div>
                        <div className="font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5 flex-wrap">
                          <span>{u.name}</span>
                          {u.rating && u.rating >= 4.9 && (
                            <span className="text-[10px] text-amber-500 font-bold shrink-0">⭐ {u.rating}</span>
                          )}
                          <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400">
                            ({getLevelLabel(u.completedTasksCount || 0)})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-neutral-400 font-medium">{u.city} қаласы</span>
                          {(() => {
                            const trust = getTrustBadge(u.penaltyPoints || 0, u.trustStatus);
                            return (
                              <span className={`text-[8px] font-semibold uppercase px-1.5 py-0.2 rounded ${trust.style}`}>
                                {trust.name}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Stats columns */}
                    <div className="flex items-center gap-5 sm:gap-10 shrink-0 text-right">
                      <div>
                        <span className="text-neutral-400 text-[9px] block">Сағаттары</span>
                        <span className="font-extrabold text-neutral-700 dark:text-neutral-300 flex items-center gap-1 justify-end">
                          <Clock className="w-3.5 h-3.5 text-teal-600 mt-0.5" />
                          {u.totalVolunteerHours || 0}
                        </span>
                      </div>
                      <div className="w-16">
                        <span className="text-neutral-400 text-[9px] block">Орындаулары</span>
                        <span className="font-black text-slate-800 dark:text-teal-400">{u.completedTasksCount || 0} рет</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
