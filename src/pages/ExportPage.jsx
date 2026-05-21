import React, { useState } from 'react';
import { db } from '../services/db.js';
import { useAuthStore } from '../store/authStore.js';
import {
  Download, FileText, Table, FileJson, FileSpreadsheet,
  CheckCircle2, Loader2, BarChart2, Calendar, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Export helpers ────────────────────────────────────────────────────────────

async function collectData(user) {
  const goals      = await db.goals.toArray();
  const activities = await db.activities.toArray();
  const plans      = await db.plans.toArray();
  return { user, goals, activities, plans };
}

// ── CSV ─────────────────────────────────────────────────────────────────────
function toCSV(rows, headers) {
  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines  = [headers.map(escape).join(',')];
  rows.forEach(r => lines.push(headers.map(h => escape(r[h])).join(',')));
  return lines.join('\n');
}

function downloadText(filename, text, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── JSON ─────────────────────────────────────────────────────────────────────
async function exportJSON(user) {
  const data = await collectData(user);
  const text = JSON.stringify(data, null, 2);
  downloadText(`habit-os-export-${Date.now()}.json`, text, 'application/json');
}

// ── CSV (habits) ─────────────────────────────────────────────────────────────
async function exportCSV(user) {
  const { goals, activities } = await collectData(user);

  const goalsCSV = toCSV(
    goals.map(g => ({
      date: g.dateKey, category: g.category, type: g.type,
      current: g.currentValue, target: g.targetValue,
      progress: `${Math.round(g.progress || 0)}%`,
      completed: g.completionTimestamp ? 'Yes' : 'No'
    })),
    ['date','category','type','current','target','progress','completed']
  );

  const activitiesCSV = toCSV(
    activities.map(a => ({
      date: new Date(a.timestamp).toLocaleDateString(), type: a.type,
      title: a.title, description: a.description, xp: a.xpEarned
    })),
    ['date','type','title','description','xp']
  );

  downloadText(`habits-${Date.now()}.csv`, goalsCSV, 'text/csv');
  setTimeout(() => downloadText(`activities-${Date.now()}.csv`, activitiesCSV, 'text/csv'), 300);
}

// ── XLSX ─────────────────────────────────────────────────────────────────────
async function exportXLSX(user) {
  const XLSX = await import('xlsx');
  const { goals, activities, plans } = await collectData(user);

  const wb = XLSX.utils.book_new();

  // Sheet 1: Habits
  const habitRows = goals.map(g => ({
    Date: g.dateKey, Category: g.category, Type: g.type,
    'Current Value': g.currentValue, 'Target Value': g.targetValue,
    'Progress (%)': Math.round(g.progress || 0),
    Completed: g.completionTimestamp ? 'Yes' : 'No'
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(habitRows), 'Habits');

  // Sheet 2: Activities
  const actRows = activities.map(a => ({
    Date: new Date(a.timestamp).toLocaleDateString(), Type: a.type,
    Title: a.title, Description: a.description, 'XP Earned': a.xpEarned
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(actRows), 'Activities');

  // Sheet 3: Plans
  const planRows = plans.map(p => ({
    Name: p.name, Period: p.period,
    'Number of Habits': (p.habits || []).length,
    Active: p.active ? 'Yes' : 'No',
    Created: new Date(p.createdAt).toLocaleDateString()
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(planRows), 'Plans');

  // Sheet 4: Summary
  const totalGoals    = goals.length;
  const completed     = goals.filter(g => g.completionTimestamp).length;
  const completionPct = totalGoals ? Math.round((completed / totalGoals) * 100) : 0;
  const totalXP       = activities.reduce((s, a) => s + (a.xpEarned || 0), 0);
  const summaryRows   = [
    { Metric: 'Total Habit Logs', Value: totalGoals },
    { Metric: 'Completed',        Value: completed   },
    { Metric: 'Completion Rate',  Value: `${completionPct}%` },
    { Metric: 'Total XP Earned',  Value: totalXP     },
    { Metric: 'Total Plans',      Value: plans.length },
    { Metric: 'Export Date',      Value: new Date().toLocaleString() },
    { Metric: 'User',             Value: user?.username || 'N/A' },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Summary');

  XLSX.writeFile(wb, `habit-os-${Date.now()}.xlsx`);
}

// ── PDF ──────────────────────────────────────────────────────────────────────
async function exportPDF(user) {
  const jsPDF     = (await import('jspdf')).default;
  const autoTable = (await import('jspdf-autotable')).default;
  const { goals, activities, plans } = await collectData(user);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ── Page 1: Cover ──
  doc.setFillColor(7, 7, 7);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setTextColor(124, 58, 237);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Health & Habit OS', 105, 90, { align: 'center' });
  doc.setTextColor(160, 160, 170);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Your personal health data export', 105, 100, { align: 'center' });
  doc.setFontSize(9);
  doc.text(`User: ${user?.username || 'N/A'}   ·   Exported: ${new Date().toLocaleString()}`, 105, 112, { align: 'center' });

  // Stats block
  const totalGoals    = goals.length;
  const completed     = goals.filter(g => g.completionTimestamp).length;
  const completionPct = totalGoals ? Math.round((completed / totalGoals) * 100) : 0;
  const totalXP       = activities.reduce((s, a) => s + (a.xpEarned || 0), 0);
  const stats = [
    ['Habit Logs', totalGoals], ['Completed', completed],
    ['Rate', `${completionPct}%`], ['Total XP', totalXP], ['Plans', plans.length]
  ];
  doc.setFontSize(10);
  stats.forEach(([label, val], i) => {
    const x = 20 + i * 36;
    doc.setTextColor(124, 58, 237);
    doc.setFont('helvetica', 'bold');
    doc.text(String(val), x, 140);
    doc.setTextColor(120, 120, 130);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(label, x, 146);
    doc.setFontSize(10);
  });

  // ── Page 2: Habits table ──
  doc.addPage();
  doc.setFillColor(7, 7, 7);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setTextColor(124, 58, 237);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Habit Log', 14, 18);

  autoTable(doc, {
    startY: 24,
    head: [['Date', 'Category', 'Type', 'Current', 'Target', '%', 'Done']],
    body: goals.slice(0, 200).map(g => [
      g.dateKey, g.category, g.type,
      g.currentValue, g.targetValue,
      `${Math.round(g.progress || 0)}%`,
      g.completionTimestamp ? '✓' : '—'
    ]),
    styles:     { fontSize: 7, cellPadding: 2, textColor: [200, 200, 210], fillColor: [15, 15, 20] },
    headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [20, 20, 28] },
    theme: 'grid',
  });

  // ── Page 3: Activities ──
  doc.addPage();
  doc.setFillColor(7, 7, 7);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setTextColor(124, 58, 237);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Activity Log', 14, 18);

  autoTable(doc, {
    startY: 24,
    head: [['Date', 'Type', 'Title', 'XP']],
    body: activities.slice(0, 200).map(a => [
      new Date(a.timestamp).toLocaleDateString(), a.type, a.title, a.xpEarned
    ]),
    styles:     { fontSize: 7, cellPadding: 2, textColor: [200, 200, 210], fillColor: [15, 15, 20] },
    headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [20, 20, 28] },
    theme: 'grid',
  });

  // ── Page 4: Plans ──
  if (plans.length > 0) {
    doc.addPage();
    doc.setFillColor(7, 7, 7);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setTextColor(124, 58, 237);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('My Plans', 14, 18);

    autoTable(doc, {
      startY: 24,
      head: [['Name', 'Period', 'Habits', 'Active', 'Created']],
      body: plans.map(p => [
        p.name, p.period, (p.habits || []).length,
        p.active ? 'Yes' : 'No', new Date(p.createdAt).toLocaleDateString()
      ]),
      styles:     { fontSize: 8, cellPadding: 3, textColor: [200, 200, 210], fillColor: [15, 15, 20] },
      headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [20, 20, 28] },
      theme: 'grid',
    });
  }

  doc.save(`habit-os-${Date.now()}.pdf`);
}

// ── Export button component ──────────────────────────────────────────────────
function ExportButton({ icon: Icon, label, desc, color, bgColor, borderColor, onClick, loading }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={loading}
      className="relative flex flex-col items-start p-5 rounded-2xl border text-left transition-all overflow-hidden group disabled:opacity-60"
      style={{ backgroundColor: bgColor, borderColor }}
    >
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 pointer-events-none"
        style={{ backgroundColor: color }} />
      <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: color + '20', border: `1px solid ${color}40` }}>
        {loading ? <Loader2 className="h-5 w-5 animate-spin" style={{ color }} /> : <Icon className="h-5 w-5" style={{ color }} />}
      </div>
      <div className="font-bold text-sm text-text-white">{label}</div>
      <div className="text-xs text-text-muted mt-1 leading-relaxed">{desc}</div>
      <div className="mt-3 flex items-center space-x-1 text-xs font-bold" style={{ color }}>
        <Download className="h-3.5 w-3.5" />
        <span>{loading ? 'Exporting…' : 'Download'}</span>
      </div>
    </motion.button>
  );
}

// ── Main Export Page ──────────────────────────────────────────────────────────
export default function ExportPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState({});
  const [done,    setDone]    = useState({});

  const run = async (key, fn) => {
    setLoading(l => ({ ...l, [key]: true }));
    try { await fn(user); setDone(d => ({ ...d, [key]: true })); setTimeout(() => setDone(d => ({ ...d, [key]: false })), 3000); }
    finally { setLoading(l => ({ ...l, [key]: false })); }
  };

  const formats = [
    {
      key: 'pdf', label: 'PDF Report', icon: FileText,
      desc: 'A beautiful multi-page report with all your habits, activities, and plans. Great for printing or sharing.',
      color: '#EF4444', bgColor: '#EF444410', borderColor: '#EF444430',
      fn: exportPDF
    },
    {
      key: 'xlsx', label: 'Excel (XLSX)', icon: FileSpreadsheet,
      desc: 'Full spreadsheet with 4 sheets: Habits, Activities, Plans, and a Summary overview.',
      color: '#10B981', bgColor: '#10B98110', borderColor: '#10B98130',
      fn: exportXLSX
    },
    {
      key: 'csv', label: 'CSV Files', icon: Table,
      desc: 'Two CSV files — one for habits and one for activities. Works with any spreadsheet app.',
      color: '#F59E0B', bgColor: '#F59E0B10', borderColor: '#F59E0B30',
      fn: exportCSV
    },
    {
      key: 'json', label: 'JSON', icon: FileJson,
      desc: 'Raw data export in JSON format. Useful for developers or importing into other apps.',
      color: '#3B82F6', bgColor: '#3B82F610', borderColor: '#3B82F630',
      fn: exportJSON
    },
  ];

  return (
    <div className="space-y-6 pb-16 max-w-3xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-text-white">Export My Data</h1>
        <p className="text-sm text-text-muted mt-1">Download all your habits, plans, and activities in the format you prefer.</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Activity,  label: 'Habits',     key: 'goals'      },
          { icon: BarChart2, label: 'Activities',  key: 'activities' },
          { icon: Calendar,  label: 'Plans',       key: 'plans'      },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="bg-surface-dark border border-border-slate/60 rounded-2xl p-4 flex items-center space-x-3">
            <Icon className="h-5 w-5 text-accent-purple shrink-0" />
            <div>
              <div className="text-xs font-bold text-text-white">{label}</div>
              <div className="text-[10px] text-text-muted">Included in export</div>
            </div>
          </div>
        ))}
      </div>

      {/* Success toast */}
      <AnimatePresence>
        {Object.values(done).some(Boolean) && (
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="flex items-center space-x-3 bg-success-emerald/10 border border-success-emerald/30 rounded-2xl px-5 py-3 text-sm text-success-emerald">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>Your file has been downloaded successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export format grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {formats.map(f => (
          <ExportButton
            key={f.key}
            icon={f.icon}
            label={f.label}
            desc={f.desc}
            color={f.color}
            bgColor={f.bgColor}
            borderColor={f.borderColor}
            loading={!!loading[f.key]}
            onClick={() => run(f.key, f.fn)}
          />
        ))}
      </div>

      {/* Note */}
      <div className="bg-surface-dark border border-border-slate/40 rounded-2xl p-5 text-xs text-text-muted space-y-1.5">
        <div className="font-bold text-text-white text-sm">📌 About your data</div>
        <p>All your data is stored on <strong className="text-text-white">your device</strong> using IndexedDB. Nothing is sent to any third party — exports happen entirely in your browser.</p>
        <p>The PDF is best for reports. Excel is best for analysis. CSV works everywhere. JSON is for developers.</p>
      </div>
    </div>
  );
}
