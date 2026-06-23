import React, { useState } from 'react';
import { Settings, User, Phone, MapPin, Smile, Upload, Save, Check, RefreshCw } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';
import { 
  UserProfile, 
  PRESET_AVATARS, 
  AVATAR_STYLING, 
  AVATAR_EMOJIS, 
  KAZAKHSTAN_CITIES 
} from '../types';

interface SettingsPageProps {
  userProfile: UserProfile;
  currentUser: any;
  updateUserBio: (data: Partial<UserProfile>) => Promise<void>;
  loadTasks: () => Promise<void>;
}

export default function SettingsPage({
  userProfile,
  currentUser,
  updateUserBio,
  loadTasks,
}: SettingsPageProps) {
  const [editName, setEditName] = useState(userProfile?.name || '');
  const [editCity, setEditCity] = useState(userProfile?.city || 'Алматы');
  const [editPhone, setEditPhone] = useState(userProfile?.phone || '');
  const [editAvatar, setEditAvatar] = useState(userProfile?.avatarId || 'avatar_1');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    
    setSavingStatus(true);
    try {
      await updateUserBio({
        name: editName,
        city: editCity,
        phone: editPhone,
        avatarId: editAvatar
      });
      
      alert('Профиль мәліметтеріңіз сәтті өзгертілді!');
      await loadTasks();
    } catch (err: any) {
      alert('Профильді жаңарту сәтсіз өтті: ' + String(err));
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 font-sans animate-in fade-in" id="settings_page_wrapper">
      <div>
        <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <Settings className="w-7 h-7 text-teal-600 animate-spin-slow" />
          Жеке баптаулар
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
          Профиль ақпаратын жаңарту, мекенжай баптаулары және дербес логистика
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Avatar manager preview */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 h-fit text-center space-y-4 shadow-xs">
          <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest block text-left">Профиль суреті</h3>
          
          <div className="flex flex-col items-center gap-3">
            {userProfile?.avatarUrl ? (
              <img 
                src={userProfile.avatarUrl} 
                alt="" 
                className="w-24 h-24 rounded-full object-cover border-4 border-teal-500/20 shadow-md"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl border-4 border-teal-555/40 border-teal-500/10 shadow-md ${AVATAR_STYLING[userProfile?.avatarId || 'avatar_1']}`}>
                {AVATAR_EMOJIS[userProfile?.avatarId || 'avatar_1']}
              </div>
            )}

            <div>
              <h4 className="font-extrabold text-sm text-neutral-800 dark:text-neutral-105">{userProfile?.name}</h4>
              <span className="text-[10px] text-neutral-400 uppercase font-black">{userProfile?.city} қаласы</span>
            </div>
          </div>

          <div className="pt-2">
            <label className="w-full py-2.5 px-4 border border-dashed border-teal-300 dark:border-teal-800 hover:bg-teal-50/50 dark:hover:bg-teal-950/10 text-teal-600 dark:text-teal-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors relative">
              {uploadingAvatar ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Жүктелуде...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Суретті өзгерту
                </>
              )}
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleAvatarFileChange}
                disabled={uploadingAvatar}
                className="hidden"
              />
            </label>
            <span className="text-[9px] text-neutral-400 mt-1 block">JPEG, PNG немесе WEBP (Макс: 5MB)</span>
          </div>
        </div>

        {/* Right Column: Edit info Form */}
        <form onSubmit={handleUpdateProfile} className="md:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-5 shadow-xs" id="settings_edit_form">
          <h3 className="text-sm font-black text-neutral-800 dark:text-neutral-200">Жеке мәліметтерді өңдеу</h3>
          
          <div className="space-y-4">
            
            {/* Input Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-neutral-400" />
                Есіміңіз бен Тегіңіз
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Мысалы: Асан Төлеген"
                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-805 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Select City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  Тұратын қалаңыз
                </label>
                <select
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-808 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {KAZAKHSTAN_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Input Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-neutral-400" />
                  Телефон нөміріңіз
                </label>
                <input
                  type="tel"
                  maxLength={30}
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Үлгі: +7 777 777 7777"
                  className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-805 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Select Preset Avatar Emoji */}
            <div className="space-y-2">
              <label className="text-xs font-black text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                <Smile className="w-3.5 h-3.5 text-neutral-400" />
                Жылдам эмодзи таңдау
              </label>
              
              <div className="grid grid-cols-6 gap-2">
                {Object.keys(AVATAR_EMOJIS).map((avId) => {
                  const isSelected = editAvatar === avId;
                  return (
                    <button
                      key={avId}
                      type="button"
                      onClick={() => setEditAvatar(avId)}
                      className={`p-3 rounded-xl border text-2xl flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'border-teal-555 border-teal-500 bg-teal-50 dark:bg-teal-950/20 scale-105 shadow-sm' 
                          : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
                      }`}
                    >
                      {AVATAR_EMOJIS[avId]}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-850 flex justify-end">
            <button
              type="submit"
              disabled={savingStatus}
              className="px-6 py-2.5 bg-teal-650 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
            >
              {savingStatus ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Сақталуда...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Баптауларды сақтау
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
