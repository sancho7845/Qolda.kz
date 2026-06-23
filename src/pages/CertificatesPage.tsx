import React from 'react';
import { Award, Download, FileText, Gift, ShieldCheck, History } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { UserProfile, Certificate } from '../types';
import { saveCertificate, getUserCertificates } from '../services/dbService';

interface CertificatesPageProps {
  userProfile: UserProfile;
}

export default function CertificatesPage({ userProfile }: CertificatesPageProps) {
  const totalHours = userProfile?.totalVolunteerHours || 0;
  const isEligible = totalHours >= 50;

  const [certs, setCerts] = React.useState<Certificate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);

  React.useEffect(() => {
    async function fetchCerts() {
      if (!userProfile?.uid) return;
      try {
        setLoading(true);
        const list = await getUserCertificates(userProfile.uid);
        setCerts(list);
      } catch (err) {
        console.error('Error fetching certs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCerts();
  }, [userProfile?.uid]);

  const generatePDF = (cert: Certificate) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const certSerialId = cert.certificateId;
    const issueDateStr = new Date(cert.issuedAt).toLocaleDateString('kk-KZ');

    // Set A4 Landscape dimensions (297 x 210)
    // Draw majestic dual border limits
    doc.setDrawColor(13, 148, 136); // Teal primary
    doc.setLineWidth(2);
    doc.rect(10, 10, 277, 190);

    doc.setDrawColor(20, 184, 166); // Teal secondary outline
    doc.setLineWidth(0.5);
    doc.rect(13, 13, 271, 184);

    // Title Banner Logo styling
    doc.setTextColor(13, 148, 136);
    doc.setFontSize(38);
    doc.text('Qolda.kz', 148, 45, { align: 'center' });

    // Subtitle
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(22);
    doc.text('ЕРІКТІЛІК СЕРТИФИКАТЫ', 148, 65, { align: 'center' });

    // Body descriptive
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(13);
    doc.text('Осы марапат жаны жомарт, өз ісіне өте адал белсенді азаматқа беріледі:', 148, 85, { align: 'center' });

    // Participant Main Name
    doc.setTextColor(15, 118, 110);
    doc.setFontSize(26);
    doc.text(cert.userName || 'Құрметті Ерікті', 148, 105, { align: 'center' });

    // Achievement description text message
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(14);
    doc.text(`Qolda.kz платформасында көршілерге қамқорлық танытып, қоғамға зор үлес қосқаны,`, 148, 122, { align: 'center' });
    doc.text(`және де жалпы есепте ${cert.totalHours} сағат пайдалы волонтерлік уақыт жұмсағаны үшін расталады.`, 148, 132, { align: 'center' });

    doc.setTextColor(115, 115, 115);
    doc.setFontSize(11);
    doc.text(`Сіздің әрбір сағатыңыз біздің жылы қоғамымыздың іргесін нығайтады! Мың алғыс!`, 148, 146, { align: 'center' });

    // Graphic alignment ornaments divider
    doc.setDrawColor(204, 251, 241);
    doc.setFillColor(13, 148, 136);
    doc.rect(118, 153, 60, 1, 'F');

    // Signature stamp and Dates placeholder columns
    doc.setDrawColor(226, 232, 240);
    doc.line(50, 178, 110, 178);
    doc.line(187, 178, 247, 178);

    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('Платформа жетекшілігі / Qolda CEO', 80, 183, { align: 'center' });
    doc.text(`Берілген күні: ${issueDateStr}`, 217, 183, { align: 'center' });

    // Draw Certificate ID
    doc.setFontSize(10);
    doc.setTextColor(13, 148, 136);
    doc.text(`Сертификат ID: ${certSerialId}`, 148, 163, { align: 'center' });

    // Download execution save
    doc.save(`Qolda_Certificate_${cert.userName?.replace(/\s+/g, '_') || 'volunteer'}_${certSerialId}.pdf`);
  };

  const handleDownloadCertificate = async () => {
    if (!isEligible || generating) return;
    try {
      setGenerating(true);
      const newCert = await saveCertificate(userProfile.uid, userProfile.name, totalHours);
      if (newCert) {
        setCerts(prev => [newCert, ...prev]);
        generatePDF(newCert);
      }
    } catch (err) {
      console.error('Failed to save and generate certificate:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 font-sans" id="certificates_page_wrapper">
      <div>
        <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <FileText className="w-7 h-7 text-teal-600" />
          Рәсімделген Сертификаттар
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
          Мұнда сіз өзіңіздің волонтерлік қызметіңізді растайтын ресми сертификатты жүктей аласыз
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Certificate Display Screen Design/Card */}
        <div className="md:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden min-h-80 shadow-xs">
          {/* Decorative watermark/accent */}
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 text-teal-500/5 dark:text-teal-400/5 rotate-12 select-none pointer-events-none">
            <Award className="w-64 h-64 font-bold" />
          </div>

          <div className="border border-dashed border-teal-500/20 dark:border-teal-500/10 p-5 rounded-xl h-full flex flex-col justify-between">
            <div className="text-center space-y-1.5">
              <span className="font-extrabold text-teal-600 tracking-widest text-lg block uppercase font-sans">QOLDA.KZ</span>
              <h3 className="text-xs uppercase font-extrabold text-neutral-450 tracking-wider">ЕРІКТІЛІК СЕРТИФИКАТЫ</h3>
            </div>

            <div className="text-center py-6">
              <span className="text-[10px] text-neutral-400 block mb-1">Осы марапат иесі:</span>
              <h2 className="text-xl font-black text-teal-700 dark:text-teal-400 font-sans">{userProfile?.name || 'Құрметті Ерікті'}</h2>
              <p className="text-xs text-neutral-500 mt-2 max-w-sm mx-auto leading-relaxed">
                Қоғамға және мұқтаж жандарға қамқорлық танытып белсенді уақыт бөлгені үшін расталады.
              </p>
            </div>

            <div className="flex justify-between items-center text-[9px] text-neutral-400 font-semibold border-t border-neutral-100 dark:border-neutral-800 pt-3">
              <span>Платформа Жетекшілігі</span>
              <span>Пайдалы есеп уақыты: {totalHours} сағат</span>
            </div>
          </div>
        </div>

        {/* Certificate Instructions/Action Box */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 flex flex-col justify-between shadow-xs space-y-4">
          <div className="space-y-4">
            <h3 className="text-sm font-black text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              Растау Мәртебесі
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-450">
                <span>Жалпы сағатыңыз:</span>
                <span className="font-black text-neutral-900 dark:text-neutral-300">{totalHours} сағат</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-450">
                <span>Шекті талап:</span>
                <span>50 сағат</span>
              </div>
            </div>

            <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${isEligible ? 'bg-green-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, (totalHours / 50) * 100)}%` }}
              />
            </div>

            {!isEligible ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200/55 dark:border-amber-900/30">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">
                  Сертификатқа дейін {50 - totalHours} сағат қалды
                </p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-normal">
                  Жалпы волонтерлік сағатыңыз кем дегенде 50 сағатқа жеткенде ресми PDF сертификатын алуға мүмкіндігіңіз ашылады.
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 leading-normal">
                Құттықтаймыз! Сіз сертификат алу талаптарын толық орындадыңыз. Сіздің ресми құжатыңыз дайын!
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
            {isEligible ? (
              <button
                onClick={handleDownloadCertificate}
                disabled={generating}
                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait"
              >
                <Download className="w-4 h-4" />
                {generating ? 'Сертификат әзірленуде...' : 'PDF сертификат жүктеу'}
              </button>
            ) : (
              <div className="w-full py-3 px-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed">
                Жүктеу уақытша жабық 🔒
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History of Previously Issued Certificates */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-black text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
          <History className="w-5 h-5 text-teal-600" />
          Жүктелген сертификаттар тарихы
        </h3>

        {loading ? (
          <div className="text-center py-8 text-xs font-semibold text-neutral-400 italic">
            Тарих жүктелуде...
          </div>
        ) : certs.length === 0 ? (
          <div className="text-center py-8 text-xs text-neutral-400 dark:text-neutral-500 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
            Бұрын жүктелген сертификаттар табылмады. 
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {certs.map((c) => (
              <div 
                key={c.id} 
                className="p-4 bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200 dark:border-neutral-800/80 rounded-xl flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="font-extrabold text-xs text-teal-600 dark:text-teal-400">
                    {c.certificateId}
                  </div>
                  <div className="text-[11px] text-neutral-700 dark:text-neutral-300">
                    {c.totalHours} сағат волонтерлік жұмыс
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    Берілген күні: {new Date(c.issuedAt).toLocaleDateString('kk-KZ')}
                  </div>
                </div>
                <button
                  onClick={() => generatePDF(c)}
                  className="p-2 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-teal-600 dark:text-teal-400 border border-neutral-200 dark:border-neutral-700 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                  title="Қайта жүктеу (PDF)"
                >
                  <Download className="w-3.5 h-3.5" />
                  Жүктеу
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rewards Description / Info */}
      <div className="bg-gradient-to-br from-teal-50/50 to-amber-50/50 dark:from-neutral-900/40 dark:to-neutral-900/20 border border-teal-100 dark:border-teal-900/50 rounded-2xl p-6">
        <h4 className="text-sm font-black text-neutral-800 dark:text-teal-400 flex items-center gap-1.5">
          <Gift className="w-5 h-5 text-teal-605 text-teal-600" />
          Біздің еріктілер үшін басқа қандай мүмкіндіктер бар?
        </h4>
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed mt-2">
          Qolda.kz платформасында белсенді волонтерлік жұмыс жасап, 50 сағаттан астам уақытын бөлген жандарға ресми сертификаттан бөлек серіктестеріміздің арнайы жеңілдіктері мен сыйлықтары (кітаптар, коворкинг орталықтарына тегін абонементтер және білім беру курстарына купондар) қарастырылған. Көршілерге көмектесу - тек жақсылық қана емес, сонымен бірге тамаша тәжірибе жинау!
        </p>
      </div>
    </div>
  );
}
