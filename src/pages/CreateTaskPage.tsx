import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Calendar, 
  MapPin, 
  Paperclip, 
  UploadCloud, 
  AlertTriangle, 
  Info 
} from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../services/firebase';
import { 
  createTask as dbCreateTask 
} from '../services/dbService';
import { 
  TaskCategory, 
  TaskPriority, 
  UserProfile, 
  CATEGORY_LABELS, 
  PRIORITY_LABELS, 
  KAZAKHSTAN_CITIES 
} from '../types';
import { InteractiveMap, isInsideAlmaty } from '../components/InteractiveMap';
import { validateAntiSpam } from '../utils/filter';

interface CreateTaskPageProps {
  userProfile: UserProfile;
  theme: 'light' | 'dark';
  setActiveTab: (tab: 'all_tasks' | 'map_view' | 'my_dashboard' | 'create_task' | 'admin') => void;
  onSuccess: () => void;
}

export default function CreateTaskPage({
  userProfile,
  theme,
  setActiveTab,
  onSuccess,
}: CreateTaskPageProps) {
  // Input States for New Task
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskCat, setNewTaskCat] = useState<TaskCategory>(TaskCategory.OTHER);
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [newTaskCity, setNewTaskCity] = useState(userProfile?.city || '');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [newTaskAddress, setNewTaskAddress] = useState('');
  const [newTaskLatitude, setNewTaskLatitude] = useState<number | null>(null);
  const [newTaskLongitude, setNewTaskLongitude] = useState<number | null>(null);
  const [newTaskLocationSource, setNewTaskLocationSource] = useState<'manual' | 'geolocation' | null>(null);
  const [geolocationStatusText, setGeolocationStatusText] = useState<string | null>(null);
  const [geolocationErrorText, setGeolocationErrorText] = useState<string | null>(null);
  const [storageErrorWarning, setStorageErrorWarning] = useState<boolean>(false);

  // CAPTCHA States
  const [captchaNum1, setCaptchaNum1] = useState(0);
  const [captchaNum2, setCaptchaNum2] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  const generateCaptcha = () => {
    setCaptchaNum1(Math.floor(Math.random() * 9) + 1);
    setCaptchaNum2(Math.floor(Math.random() * 9) + 1);
    setCaptchaAnswer('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  useEffect(() => {
    if (userProfile?.city && !newTaskCity) {
      setNewTaskCity(userProfile.city);
    }
  }, [userProfile, newTaskCity]);

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

    if (auth.currentUser && !auth.currentUser.emailVerified) {
      alert('Тапсырма жариялау үшін бірінші электрондық поштаңызды растаңыз! (Please verify your email first)');
      return;
    }

    if (!startDateTime) {
      alert('Тапсырманың басталу уақытын (startDateTime) енгізу міндетті!');
      return;
    }

    if (!endDateTime) {
      alert('Тапсырманың аяқталу уақытын (endDateTime) енгізу міндетті!');
      return;
    }

    if (!newTaskTitle.trim()) {
      alert('Тапсырма атауын (тақырыбын) толтыру қажет!');
      return;
    }
    const titleSpamCheck = validateAntiSpam(newTaskTitle);
    if (titleSpamCheck.isSpam) {
      alert(`Тақырыпта спам немесе күдікті сілтеме анықталды: ${titleSpamCheck.reason}`);
      try { generateCaptcha(); } catch(e){}
      return;
    }

    if (!newTaskDesc.trim()) {
      alert('Тапсырма сипаттамасын толтыру қажет!');
      return;
    }
    const descSpamCheck = validateAntiSpam(newTaskDesc);
    if (descSpamCheck.isSpam) {
      alert(`Сипаттамада спам немесе күдікті сілтеме анықталды: ${descSpamCheck.reason}`);
      try { generateCaptcha(); } catch(e){}
      return;
    }

    // Validate CAPTCHA
    if (parseInt(captchaAnswer) !== captchaNum1 + captchaNum2) {
      alert('Робот емес екеніңізді дәлелдеңіз: Боттарға қарсы тексеру сұрағының жауабы қате!');
      try { generateCaptcha(); } catch(e){}
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
        setUploadProgress(1);
        const uniqueFileName = `${Date.now()}_${attachmentFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const fileRef = ref(storage, `tasks_attachments/${uniqueFileName}`);
        const uploadTask = uploadBytesResumable(fileRef, attachmentFile, { contentType: attachmentFile.type });

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
            console.log('Firebase Storage fell back to base64 inline.');
          } catch (fallbackErr) {
            alert('Файлды кірістіру барысында қате орын алды: ' + String(fallbackErr));
            setUploadProgress(null);
            return;
          }
        } else if (isAuthError) {
          setStorageErrorWarning(true);
          alert('Файлды жүктеуге құқық жеткіліксіз (storage/unauthorized). Сіз өлшемі 800 КБ-тан кіші файлды жүктей аласыз.');
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
      await dbCreateTask(
        newTaskTitle,
        newTaskDesc,
        newTaskCat,
        newTaskPriority,
        newTaskDeadline,
        startDateTime,
        endDateTime,
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
      setStartDateTime('');
      setEndDateTime('');
      setAttachmentFile(null);
      setNewTaskAddress('');
      setNewTaskLatitude(null);
      setNewTaskLongitude(null);
      setNewTaskLocationSource(null);

      onSuccess();
    } catch (err: any) {
      alert('Тапсырманы жасау сәтсіз өтті: ' + String(err));
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-150 dark:border-neutral-800 p-6 md:p-8 shadow-sm space-y-6">
      <div className="bg-transparent">
        <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-50 flex items-center gap-2 font-sans bg-transparent">
          <PlusCircle className="w-5.5 h-5.5 text-teal-600" />
          Көмек сұрау өтінішін құру
        </h3>
        <p className="text-neutral-500 dark:text-neutral-400 text-xs font-sans">
          Мұқтаждықтарыңызды немесе көмек қажет ететін мәселені егжей-тегжейлі сипаттап жазыңыз. Еріктілер тегін көмек көрсетеді.
        </p>
      </div>

      <form onSubmit={handleCreateTask} className="space-y-4 bg-transparent">
        <div className="space-y-1 bg-transparent">
          <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Тапсырма атауы:</label>
          <input
            type="text"
            required
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Мысалы: Қарт адамға дәрі-дәрмек алып келу"
            maxLength={100}
            className="w-full p-3 rounded-xl border border-neutral-250 focus:border-teal-500 bg-transparent text-xs dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-transparent">
          <div className="space-y-1 bg-transparent">
            <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Санат:</label>
            <select
              value={newTaskCat}
              onChange={(e) => setNewTaskCat(e.target.value as TaskCategory)}
              className="w-full p-3 rounded-xl border border-neutral-250 focus:border-teal-500 bg-transparent text-xs dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 outline-none font-semibold"
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key} className="dark:text-neutral-800">{label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1 bg-transparent">
            <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Жеделдік (Басымдық):</label>
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
              className="w-full p-3 rounded-xl border border-neutral-250 focus:border-teal-500 bg-transparent text-xs dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 outline-none font-semibold"
            >
              {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                <option key={key} value={key} className="dark:text-neutral-800">{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-transparent">
          <div className="space-y-1 bg-transparent">
            <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-teal-650" />
              Көмектің басталу уақыты (startDateTime): *
            </label>
            <input
              type="datetime-local"
              required
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
              className="w-full p-3 rounded-xl border border-neutral-250 focus:border-teal-500 bg-transparent text-xs dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 outline-none font-semibold"
            />
          </div>

          <div className="space-y-1 bg-transparent">
            <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-teal-650" />
              Көмектің аяқталу уақыты (endDateTime): *
            </label>
            <input
              type="datetime-local"
              required
              value={endDateTime}
              onChange={(e) => {
                setEndDateTime(e.target.value);
                if (e.target.value) {
                  setNewTaskDeadline(e.target.value.split('T')[0]);
                }
              }}
              className="w-full p-3 rounded-xl border border-neutral-250 focus:border-teal-500 bg-transparent text-xs dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 outline-none font-semibold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 bg-transparent">
          <div className="space-y-1 bg-transparent">
            <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-teal-650" />
              Көмек қажет қала: *
            </label>
            <select
              value={newTaskCity}
              onChange={(e) => setNewTaskCity(e.target.value)}
              required
              className="w-full p-3 rounded-xl border border-neutral-250 focus:border-teal-500 bg-transparent text-xs dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 outline-none font-semibold"
            >
              <option value="">Таңдаңыз...</option>
              {KAZAKHSTAN_CITIES.map((c) => (
                <option key={c} value={c} className="dark:text-neutral-800">{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-4 bg-neutral-50 dark:bg-neutral-850/50 rounded-2xl border border-neutral-150 dark:border-neutral-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-transparent">
            <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5 bg-transparent">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              Нақты мекенжайы және бағыт алу / Exact Address & Location:
            </label>
            <button
              type="button"
              onClick={handleUseMyLocation}
              className="text-[10px] bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 dark:text-teal-300 border border-teal-100 dark:border-teal-800 px-2.5 py-1.5 rounded-xl font-extrabold flex items-center gap-1 cursor-pointer transition-all shrink-0 font-sans"
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
            className="w-full p-3 rounded-xl border border-neutral-250 focus:border-teal-500 bg-transparent text-xs dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 outline-none font-semibold"
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
            <div className="text-[10px] text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1 bg-teal-50/50 dark:bg-teal-950/20 px-2.5 py-1.5 rounded-xl border border-teal-150/30">
              <span>📍 GPS Координаттары қабылданды ({newTaskLocationSource === 'geolocation' ? 'Геолокация' : 'Қолмен'}): {newTaskLatitude.toFixed(6)}, {newTaskLongitude.toFixed(6)}</span>
            </div>
          )}

          {newTaskCity === 'Алматы' && (
            <div className="space-y-1.5 pt-1.5 bg-transparent">
              <label className="text-[11px] font-extrabold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block bg-transparent font-sans">
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

        <div className="space-y-1 bg-transparent">
          <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Толық түсіндірме мәліметі (Егжей-тегжейлі):</label>
          <textarea
            required
            value={newTaskDesc}
            onChange={(e) => setNewTaskDesc(e.target.value)}
            placeholder="Көмектің маңыздылығын, қай мекенжай бойынша (көше/үй) және қандай нақты іс атқару керектігін толық сипаттаңыз..."
            rows={5}
            maxLength={1500}
            className="w-full p-3 rounded-xl border border-neutral-250 focus:border-teal-500 bg-transparent text-xs dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 outline-none leading-relaxed"
          />
        </div>

        {/* File Upload Widget */}
        <div className="space-y-1 bg-transparent">
          <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5 bg-transparent">
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
              <div className="flex items-center gap-2.5 truncate bg-transparent">
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
                <div className="truncate bg-transparent">
                  <div className="font-bold text-neutral-705 dark:text-neutral-300 truncate">{attachmentFile.name}</div>
                  <div className="text-[10px] text-neutral-400 font-medium font-sans">{(attachmentFile.size / (1024 * 1024)).toFixed(2)} MB</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAttachmentFile(null)}
                className="px-2.5 py-1 text-[10px] font-bold text-rose-600 border border-rose-200 hover:bg-rose-50 dark:border-rose-950/25 dark:hover:bg-rose-950/10 rounded-lg cursor-pointer shrink-0"
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
                  : 'border-neutral-250 hover:border-teal-500 dark:border-neutral-800 dark:hover:border-neutral-700'
              }`}
              onClick={() => document.getElementById('file-upload-input')?.click()}
            >
              <UploadCloud className="w-6 h-6 text-neutral-400 animate-pulse pointer-events-none" />
              <div className="text-xs font-bold text-neutral-600 dark:text-neutral-350 pointer-events-none">
                Сурет немесе құжатты сүйреп әкеліңіз немесе <span className="text-teal-600 dark:text-teal-400 decoration-dotted underline">таңдаңыз</span>
              </div>
              <p className="text-[10px] text-neutral-400 pointer-events-none">Максималды өлшемі: 5MB (Форматтар: JPG, PNG, PDF, DOCX)</p>
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
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-xs bg-transparent">
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
            </div>
          )}
        </div>

        {/* Anti-bot Math Challenge CAPTCHA */}
        <div className="p-4 bg-amber-550/5 dark:bg-amber-950/10 border border-amber-500/15 dark:border-amber-900/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-black text-amber-700 dark:text-amber-400 flex items-center gap-1.5 bg-transparent">
              🛡️ Анти-бот тексерісі
            </span>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 bg-transparent">
              Жүйені спам-боттардан қорғау үшін қарапайым математикалық есепті шешіңіз:
            </p>
          </div>
          <div className="flex items-center gap-3 bg-transparent shrink-0">
            <span className="text-sm font-black text-teal-600 dark:text-teal-400 font-mono bg-white dark:bg-neutral-900 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs flex items-center justify-center shrink-0">
              {captchaNum1} + {captchaNum2} =
            </span>
            <input
              type="text"
              required
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              placeholder="Жауап"
              className="w-24 p-2.5 rounded-xl border border-neutral-250 focus:border-teal-500 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm outline-none text-center font-bold text-neutral-800 dark:text-neutral-100 shadow-2xs"
            />
          </div>
        </div>

        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/45 rounded-xl text-[11px] text-neutral-400 border border-neutral-100 dark:border-neutral-800 flex items-start gap-2.5 bg-transparent">
          <Info className="w-4 h-4 text-teal-650 shrink-0 mt-0.5" />
          <span>Тапсырма жарияланғаннан кейін басқа еріктілер оны қабылдағанға дейін өшіре аласыз. Тапсырманы орындаушы табылған соң, байланысу телефондарыңыз бен қорғалған деректеріңіз еріктіге қолжетімді болады.</span>
        </div>

        <div className="flex gap-2 justify-end pt-3 bg-transparent">
          <button
            type="button"
            onClick={() => setActiveTab('all_tasks')}
            className="py-2.5 px-4 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-105 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-250 cursor-pointer"
          >
            Бас тарту
          </button>
          <button
            type="submit"
            className="py-2.5 px-6 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white transition-all shadow-xs cursor-pointer"
          >
            Жариялау
          </button>
        </div>
      </form>
    </div>
  );
}
