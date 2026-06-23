import React, { useState } from 'react';
import { Bell, Check, CheckSquare, Clock, Info, MailOpen, Trash2 } from 'lucide-react';
import { Notification } from '../types';
import { markNotificationAsRead, markAllNotificationsAsRead } from '../services/dbService';

interface NotificationsPageProps {
  notifications: Notification[];
  currentUser: any;
  loadNotifications: () => Promise<void>;
}

export default function NotificationsPage({
  notifications,
  currentUser,
  loadNotifications,
}: NotificationsPageProps) {
  const [loading, setLoading] = useState(false);

  // Mark single as read
  const handleMarkAsRead = async (notifId: string) => {
    try {
      await markNotificationAsRead(notifId);
      await loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (!currentUser?.uid) return;
    setLoading(true);
    try {
      await markAllNotificationsAsRead(currentUser.uid);
      await loadNotifications();
      alert('Барлық хабарламалар оқылды деп белгіленді');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 font-sans" id="notifications_page_wrapper">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <Bell className="w-7 h-7 text-amber-500 animate-swing" />
            Хабарламалар орталығы
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Сіздің белсенділігіңіз бен тапсырмалар мәртебесі туралы платформалық ескертулер
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={loading}
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-220 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <CheckSquare className="w-4 h-4" />
            Барлығын оқылды деу
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-12 text-center text-neutral-450 font-sans max-w-xl mx-auto">
          <MailOpen className="w-12 h-12 text-neutral-350 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-neutral-850 dark:text-neutral-350">Хабарламалар таза</h3>
          <p className="text-xs text-neutral-400 mt-1">Хабарламалар тізімі әзірге бос.</p>
        </div>
      ) : (
        <div className="space-y-3" id="notifications_list_container">
          {notifications.map((n) => {
            const formattedDate = n.createdAt ? new Date(n.createdAt).toLocaleString('kk-KZ', {
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit'
            }) : '';

            return (
              <div 
                key={n.id} 
                className={`p-4 rounded-xl border transition-all flex justify-between gap-4 relative overflow-hidden ${
                  n.isRead 
                    ? 'bg-white dark:bg-neutral-900/60 border-neutral-150 dark:border-neutral-850 text-neutral-700' 
                    : 'bg-white dark:bg-neutral-900 border-teal-200 dark:border-teal-900/60 shadow-xs'
                }`}
              >
                {/* Visual Unread Bar Indicator */}
                {!n.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500" />
                )}

                <div className="flex gap-3">
                  <div className={`p-2 rounded-xl shrink-0 h-9 w-9 flex items-center justify-center mt-0.5 ${
                    n.isRead 
                      ? 'bg-neutral-100 text-neutral-400' 
                      : 'bg-amber-50 dark:bg-amber-950/20 text-amber-500'
                  }`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-black ${n.isRead ? 'text-neutral-725 dark:text-neutral-350' : 'text-neutral-900 dark:text-neutral-50'}`}>
                        {n.title}
                      </h4>
                      {!n.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-medium">
                      <Clock className="w-3 h-3" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="p-1 px-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-805 self-start rounded-lg text-[10px] text-teal-600 font-bold flex items-center gap-1 cursor-pointer hover:border border-teal-500/10"
                    title="Оқылды деп белгілеу"
                  >
                    <Check className="w-3 h-3 text-teal-500" />
                    Оқылды
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
