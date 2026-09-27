import { Send, CheckCircle2, MailOpen, MousePointerClick, AlertCircle } from 'lucide-react';
import { EmailStats, fmtNum, fmtPct } from './emailAnalyticsTypes';

/** The KPI tile row shared by the overview and campaign detail views. */
export function KpiGrid({ stats }: { stats: EmailStats }) {
  const tiles = [
    { label: 'Sent', value: fmtNum(stats.sent), sub: `${fmtNum(stats.total)} attempted`, icon: <Send size={15} /> },
    { label: 'Delivered', value: fmtNum(stats.delivered), sub: stats.bounced ? `${fmtNum(stats.bounced)} bounced` : 'accepted by mail server', icon: <CheckCircle2 size={15} /> },
    { label: 'Opened', value: fmtNum(stats.opened), sub: `${fmtPct(stats.openRate)} open rate · ${fmtNum(stats.totalOpens)} total`, icon: <MailOpen size={15} /> },
    { label: 'Clicked', value: fmtNum(stats.clicked), sub: `${fmtPct(stats.clickRate)} CTR · ${fmtPct(stats.clickToOpen)} of opens`, icon: <MousePointerClick size={15} /> },
    { label: 'Failed', value: fmtNum(stats.failed), sub: stats.total ? `${fmtPct((stats.failed / stats.total) * 100)} of attempted` : 'no sends yet', icon: <AlertCircle size={15} /> },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {tiles.map(t => (
        <div key={t.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
            <span className="text-gray-400">{t.icon}</span>{t.label}
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1.5 tabular-nums">{t.value}</p>
          <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{t.sub}</p>
        </div>
      ))}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-50 text-green-700 border-green-200',
    sending: 'bg-blue-50 text-blue-700 border-blue-200',
    scheduled: 'bg-amber-50 text-amber-700 border-amber-200',
    sent: 'bg-green-50 text-green-700 border-green-200',
    queued: 'bg-gray-50 text-gray-600 border-gray-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    bounced: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full border text-[11px] font-semibold capitalize ${styles[status] ?? styles.queued}`}>
      {status}
    </span>
  );
}
