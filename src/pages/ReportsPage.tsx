import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertCircle, FileText, CheckCircle, Clock } from 'lucide-react';
import { Report } from '../types';
import { getReports } from '../services/dbService';

interface ReportsPageProps {
  currentUser: any;
}

export default function ReportsPage({ currentUser }: ReportsPageProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      if (!currentUser?.uid) return;
      try {
        const allReports = await getReports() || [];
        // Filter by user who reported
        const myReportsList = allReports.filter(r => r.reporterId === currentUser.uid);
        setReports(myReportsList);
      } catch (e) {
        console.error('Error fetching reports:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [currentUser?.uid]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 font-sans animate-in fade-in" id="reports_page_wrapper">
      <div>
        <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <ShieldAlert className="w-7 h-7 text-rose-500 animate-pulse" />
          Менің шағымдарым мен өтініштерім
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
          Мұнда сіз платформа қауіпсіздігі мен ережелердің бұзылуына байланысты жіберген барлық шағымдарыңыздың барысын тексере аласыз
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs font-bold text-neutral-450 italic">
          Тізім жүктелуде...
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-12 text-center text-neutral-450 max-w-xl mx-auto space-y-3">
          <AlertCircle className="w-12 h-12 text-neutral-300 mx-auto" />
          <h3 className="font-extrabold text-sm text-neutral-800 dark:text-neutral-300">Шағымдар табылмады</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Сіз ешқандай заңсыз немесе ережеге қайшы әрекетке шағым түсірмегенсіз. Қауіпсіз ортаны бірге қорғағаныңыз үшін рақмет!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4" id="my_reports_cards_grid">
          {reports.map((r) => {
            const dateVal = r.createdAt ? new Date(r.createdAt).toLocaleString('kk-KZ', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : '';

            return (
              <div 
                key={r.id} 
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-lg shrink-0">
                      <ShieldAlert className="w-4 h-4" />
                    </span>
                    <h3 className="font-black text-sm text-neutral-800 dark:text-neutral-100 pb-0.5">
                      {r.targetLabel || 'Белгісіз нысан'}
                    </h3>
                    <span className="px-2 py-0.5 text-[8px] uppercase font-black bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-md shrink-0">
                      {r.targetType === 'task' ? 'Тапсырма' : 'Пайдаланушы'}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed italic bg-neutral-55 bg-neutral-50/50 dark:bg-neutral-950/20 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-850">
                    &quot;{r.reason}&quot;
                  </p>

                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 pt-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Жіберілген уақыты: {dateVal}</span>
                  </div>
                </div>

                <div className="shrink-0 self-end sm:self-center" id={`report_status_${r.id}`}>
                  {r.status === 'pending' ? (
                    <span className="px-3.5 py-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-black flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 animate-spin-slow" />
                      Қаралуда ⏳
                    </span>
                  ) : (
                    <span className="px-3.5 py-1.5 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-full text-[10px] font-black flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Шешілді ✅
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
