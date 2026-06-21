import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, AlertTriangle } from 'lucide-react';
import { 
  KAZAKHSTAN_CITIES, 
  PRESET_AVATARS, 
  AVATAR_EMOJIS, 
  AVATAR_STYLING 
} from '../types';

interface AuthPageProps {
  onAuthSuccess?: () => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const { signIn, signUp, sendPasswordResetEmail } = useAuth();

  // Auth States
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
  const [loading, setLoading] = useState(false);

  // CAPTCHA States
  const [captchaNum1, setCaptchaNum1] = useState(0);
  const [captchaNum2, setCaptchaNum2] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  const generateCaptcha = () => {
    setCaptchaNum1(Math.floor(Math.random() * 9) + 1);
    setCaptchaNum2(Math.floor(Math.random() * 9) + 1);
    setCaptchaAnswer('');
  };

  React.useEffect(() => {
    if (authTab === 'register') {
      generateCaptcha();
    }
  }, [authTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setLoading(true);
    try {
      await signIn(email, password);
      onAuthSuccess?.();
    } catch (err: any) {
      setAuthError('Қате: Пайдаланушы аты немесе құпия сөз дұрыс емес, немесе аккаунт табылмады.');
    } finally {
      setLoading(false);
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

    if (parseInt(captchaAnswer) !== captchaNum1 + captchaNum2) {
      setAuthError('Робот емес екеніңізді дәлелдеңіз: Боттарға қарсы тексеру сұрағының жауабы қате!');
      generateCaptcha();
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name, city, phone, avatarIndex);
      setAuthSuccess('Тіркелу сәтті аяқталды! Жүйеге қосылудасыз...');
      onAuthSuccess?.();
    } catch (err: any) {
      setAuthError('Тіркелу кезінде қате орун алды: ' + err.message);
    } finally {
      setLoading(false);
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
    setLoading(true);
    try {
      await sendPasswordResetEmail(email);
      setAuthSuccess('Құпия сөзді қалпына келтіру сілтемесі поштаңызға жіберілді!');
    } catch (err: any) {
      setAuthError('Қате: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Aesthetic Intro Panel */}
      <div className="md:w-1/2 bg-teal-900/75 text-teal-50 p-10 md:p-16 flex flex-col justify-between relative overflow-hidden border-r border-white/10 backdrop-blur-md">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-800/80 to-teal-950/90 opacity-90" />
        
        {/* Ambient pattern decorations */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-teal-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-emerald-500/25 rounded-full blur-3xl" />

        <div className="relative z-10 space-y-4">
          <span className="bg-teal-700/50 text-emerald-400 border border-teal-500/30 font-black tracking-widest text-[10px] uppercase py-1.5 px-3.5 rounded-full inline-block">
            ҚОҒАМДЫҚ КӨМЕК ОРТАЛЫҒЫ
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none text-white flex items-center gap-2">
            Qolda.kz 🤝
          </h1>
          <p className="text-teal-100 text-sm max-w-sm leading-relaxed font-medium">
            Біз қиын жағдайға тап болған отандастарымызға және оларға қол ұшын созуға дайын жомарт еріктілерге ортақ көмек көпірін құрамыз.
          </p>
        </div>

        <div className="relative z-10 space-y-6 mt-12 md:mt-0">
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-lg bg-teal-700/60 text-emerald-400 text-xs font-bold flex items-center justify-center font-mono">👵</div>
              <div>
                <h4 className="font-bold text-xs text-white">Қарттарға және мұқтаждарға қолдау</h4>
                <p className="text-[11px] text-teal-200">Үй жұмысы, азық-түлік тасу немесе аула күтіміне қолұшын беру</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-lg bg-teal-700/60 text-emerald-400 text-xs font-bold flex items-center justify-center font-mono">📚</div>
              <div>
                <h4 className="font-bold text-xs text-white">Тегін білім беру және бағыт таңдау</h4>
                <p className="text-[11px] text-teal-200">Желпіндіріп сабағына жәрдемдесіп, технологияны түсіндіру</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-lg bg-teal-700/60 text-emerald-400 text-xs font-bold flex items-center justify-center font-mono">✨</div>
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
                  className="text-xs text-teal-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  &larr; Артқа қайту
                </button>
                <h2 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 mt-4 font-sans">Құпия сөзді ұмыттыңыз ба?</h2>
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
                  disabled={loading}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold rounded-xl transition-all text-xs cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Жіберілуде...' : 'Қалпына келтіру сілтемесін алу'}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Tab Selector */}
              <div className="flex border-b border-neutral-100 dark:border-neutral-800 pb-1 gap-4">
                <button
                  onClick={() => { setAuthTab('login'); setAuthError(''); setAuthSuccess(''); }}
                  className={`pb-2.5 text-base font-black relative transition-all cursor-pointer ${
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
                  className={`pb-2.5 text-base font-black relative transition-all cursor-pointer ${
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
                      className="w-full p-3 rounded-xl border border-neutral-200 focus:border-teal-500 bg-transparent text-sm dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center bg-transparent">
                      <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-neutral-400" />
                        Құпия сөз:
                      </label>
                      <button
                        type="button"
                        onClick={() => setForgotPasswordMode(true)}
                        className="text-[11px] text-teal-600 hover:underline font-semibold cursor-pointer"
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
                      className="w-full p-3 rounded-xl border border-neutral-200 focus:border-teal-500 bg-transparent text-sm dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold rounded-xl transition-all text-xs cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Кіру...' : 'Жүйеге кіру'}
                  </button>
                </form>
              ) : (
                
                /* REGISTER FORM */
                <form onSubmit={handleRegister} className="space-y-3">
                  {/* Avatar Picker */}
                  <div className="space-y-1.5 bg-transparent">
                    <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400">
                      Қоғамдық бейнеңіз (Аватар таңдаңыз):
                    </label>
                    <div className="grid grid-cols-6 gap-2 bg-transparent">
                      {PRESET_AVATARS.map((avId) => (
                        <button
                          type="button"
                          key={avId}
                          onClick={() => setAvatarIndex(avId)}
                          className={`aspect-square rounded-xl flex items-center justify-center text-xl transition-all hover:scale-110 cursor-pointer ${AVATAR_STYLING[avId]} ${
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

                  <div className="space-y-1 bg-transparent">
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

                  <div className="grid grid-cols-2 gap-2 bg-transparent">
                    <div className="space-y-1 bg-transparent">
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

                    <div className="space-y-1 bg-transparent">
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

                  <div className="space-y-1 bg-transparent">
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

                  <div className="space-y-1 bg-transparent">
                    <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Құпия сөз (Кемінде 6 белгі):</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-2.5 rounded-xl border border-neutral-200 focus:border-teal-500 bg-transparent text-sm dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 outline-none"
                    />
                  </div>

                  {/* Simple Math CAPTCHA */}
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-between gap-3 text-neutral-800 dark:text-neutral-100">
                    <div className="bg-transparent">
                      <span className="block text-[9px] font-bold text-neutral-400 uppercase tracking-widest leading-none mb-1">Анти-бот тексеріс</span>
                      <span className="text-xs font-black text-teal-600 dark:text-teal-400 font-mono">{captchaNum1} + {captchaNum2} = ?</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                      placeholder="Жауапты енгізіңіз"
                      className="w-32 p-2 rounded-lg border border-neutral-250 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs focus:border-teal-100 dark:focus:border-teal-800 outline-none text-center font-bold text-neutral-800 dark:text-neutral-100 placeholder-neutral-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold rounded-xl transition-all text-xs cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Тіркелуде...' : 'Жаңа тіркелу'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
