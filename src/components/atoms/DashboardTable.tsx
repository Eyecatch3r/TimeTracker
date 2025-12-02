import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient.ts';
import { motion, AnimatePresence } from 'framer-motion';
import HoverButton from "@/components/atoms/HoverButton.tsx";
import {Download, Trash2, Pencil, Save, X, Clock, Calendar, ArrowLeft, ClipboardClock} from 'lucide-react';

interface TimeLog {
    id: number;
    task_name: string;
    start_time: string;
    end_time: string;
    notes: string;
}

// --- Helpers ---
function formatDateTime(dt: string, mobile = false) {
    if (!dt) return '';
    const opts: Intl.DateTimeFormatOptions = mobile
        ? { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }
        : { month: 'numeric', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dt).toLocaleString(undefined, opts);
}

function toInputFormat(isoString: string) {
    if (!isoString) return '';
    const date = new Date(isoString);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
}

function calculateHoursWorked(startTime: string, endTime: string): number[] {
    if (!startTime || !endTime) return [0, 0];
    const diffMs = new Date(endTime).getTime() - new Date(startTime).getTime();
    return diffMs < 0 ? [0, 0] : [Math.floor(diffMs / 3600000), Math.floor((diffMs / 60000) % 60)];
}

function formatDuration(h: number, m: number) {
    if (h === 0 && m === 0) return '0m';
    return `${h > 0 ? h + 'h ' : ''}${m}m`;
}

// --- Component ---
export const DashboardTable: React.FC = () => {
    const [logs, setLogs] = useState<TimeLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<TimeLog>>({});

    useEffect(() => { fetchLogs(); }, []);

    const fetchLogs = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('time_logs').select('*').order('start_time', { ascending: false });
        if (error) setError(error.message); else setLogs(data || []);
        setLoading(false);
    };

    // --- CSV Export Logic ---
    const handleExportCSV = useCallback(() => {
        if (logs.length === 0) return;
        const headers = ["Task", "Start", "End", "Duration", "Notes"];
        const csvRows = logs.map(log => {
            const [h, m] = calculateHoursWorked(log.start_time, log.end_time);
            const escape = (txt: string) => `"${String(txt || '').replace(/"/g, '""')}"`;
            return [
                escape(log.task_name),
                escape(formatDateTime(log.start_time)),
                escape(formatDateTime(log.end_time)),
                escape(formatDuration(h, m)),
                escape(log.notes)
            ].join(',');
        });
        const csvString = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'time_logs.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [logs]);

    const { totalHours, totalMinutes } = useMemo(() => {
        let tMin = 0;
        logs.forEach(l => {
            const [h, m] = calculateHoursWorked(l.start_time, l.end_time);
            tMin += (h * 60) + m;
        });
        return { totalHours: Math.floor(tMin / 60), totalMinutes: tMin % 60 };
    }, [logs]);

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this log?")) return;
        const prev = [...logs];
        setLogs(p => p.filter(l => l.id !== id));
        const { error } = await supabase.from('time_logs').delete().eq('id', id);
        if (error) { setError("Failed to delete"); setLogs(prev); }
    };

    const saveEditing = async (id: number) => {
        const { error } = await supabase.from('time_logs').update({
            task_name: editForm.task_name,
            start_time: new Date(editForm.start_time!).toISOString(),
            end_time: new Date(editForm.end_time!).toISOString(),
            notes: editForm.notes
        }).eq('id', id);
        if (error) setError(error.message);
        else {
            setLogs(p => p.map(l => l.id === id ? { ...l, ...editForm } as TimeLog : l));
            setEditingId(null);
        }
    };

    const inputClass = "bg-slate-950/50 text-white border border-slate-500/30 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
                opacity: 1,
                scale: 1,
                boxShadow: ["0px 0px 0px rgba(59, 130, 246, 0)", "0px 0px 20px rgba(59, 130, 246, 0.4)", "0px 0px 0px rgba(59, 130, 246, 0)"]
            }}
            className="flex flex-col w-full h-[100dvh] sm:h-[80vh] sm:max-w-3xl bg-slate-900 sm:shadow-2xl text-white sm:rounded-xl overflow-hidden relative border-none sm:border sm:border-slate-700/50"
            style={{ maxWidth: editingId && window.innerWidth > 640 ? '1000px' : undefined }}
            transition={{
                type: 'spring', stiffness: 300, damping: 30,
                boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
        >


            <div className="flex-none flex justify-between items-center p-4 sm:p-6 bg-slate-900 z-20 border-b border-slate-800">
                <h1 className="text-xl sm:text-2xl font-bold truncate mr-2 text-blue-100">Dashboard</h1>

                <div className="flex gap-3 shrink-0 items-center">
                    {/* Export Button */}
                    <HoverButton
                        text=""
                        onClick={handleExportCSV}
                        icon={Download}
                        disabled={loading || logs.length === 0}
                        compactOnMobile={true}
                    />

                    {/* Back Button */}
                    <HoverButton
                        text=""
                        href="/"
                        icon={ClipboardClock}
                        compactOnMobile={true}
                    />
                </div>
            </div>

            {/* 2. CONTENT AREA */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-transparent p-0 sm:p-2">
                {loading ? (
                    <div className="flex h-full items-center justify-center"><span className="loading loading-spinner text-blue-300" /></div>
                ) : (
                    <>
                        {/* DESKTOP TABLE */}
                        <table className="w-full hidden sm:table border-separate border-spacing-y-1">
                            <thead className="sticky top-0 bg-slate-900 z-10">
                                <tr className="text-blue-300/80 text-xs font-bold uppercase tracking-wider text-left">
                                    <th className="px-4 py-2">Task</th>
                                    <th className="px-4 py-2">Start</th>
                                    <th className="px-4 py-2">End</th>
                                    <th className="px-4 py-2 text-center">Dur</th>
                                    <th className="px-4 py-2">Notes</th>
                                    <th className="px-4 py-2 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode='popLayout'>
                                    {logs.map((log, index) => {
                                        const isEditing = editingId === log.id;
                                        const [h, m] = calculateHoursWorked(isEditing ? editForm.start_time! : log.start_time, isEditing ? editForm.end_time! : log.end_time);

                                        return (
                                            <motion.tr
                                                layout="position"
                                                key={log.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                transition={{ delay: index * 0.05 }}
                                                className={`group rounded-lg transition-colors ${isEditing ? 'bg-slate-800/50' : 'hover:bg-slate-800/30'}`}
                                            >
                                                {isEditing ? (
                                                    <>
                                                        <td className="px-2 py-3"><input autoFocus value={editForm.task_name} onChange={e => setEditForm({ ...editForm, task_name: e.target.value })} className={inputClass} /></td>
                                                        <td className="px-2 py-3"><input type="datetime-local" value={toInputFormat(editForm.start_time!)} onChange={e => setEditForm({ ...editForm, start_time: new Date(e.target.value).toISOString() })} className={inputClass} /></td>
                                                        <td className="px-2 py-3"><input type="datetime-local" value={toInputFormat(editForm.end_time!)} onChange={e => setEditForm({ ...editForm, end_time: new Date(e.target.value).toISOString() })} className={inputClass} /></td>
                                                        <td className="px-2 py-3 text-center whitespace-nowrap text-sm font-mono text-blue-200">{formatDuration(h, m)}</td>
                                                        <td className="px-2 py-3"><input value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} className={inputClass} /></td>
                                                        <td className="px-2 py-3 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={() => saveEditing(log.id)} className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"><Save size={16} /></button>
                                                                <button onClick={() => setEditingId(null)} className="p-1.5 bg-gray-500/20 text-gray-400 rounded hover:bg-gray-500/30"><X size={16} /></button>
                                                            </div>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="px-4 py-3 font-medium text-blue-100 rounded-l-lg">{log.task_name}</td>
                                                        <td className="px-4 py-3 text-sm text-blue-300 whitespace-nowrap">{formatDateTime(log.start_time)}</td>
                                                        <td className="px-4 py-3 text-sm text-blue-300 whitespace-nowrap">{formatDateTime(log.end_time)}</td>
                                                        <td className="px-4 py-3 text-center"><span className="text-xs font-mono bg-slate-800/60 px-2 py-1 rounded text-blue-200 whitespace-nowrap">{formatDuration(h, m)}</span></td>
                                                        <td className="px-4 py-3 text-sm text-blue-400 truncate max-w-[150px]">{log.notes}</td>
                                                        <td className="px-4 py-3 text-right rounded-r-lg">
                                                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => { setEditingId(log.id); setEditForm({ ...log }) }} className="text-blue-400 hover:text-blue-200"><Pencil size={15} /></button>
                                                                <button onClick={() => handleDelete(log.id)} className="text-red-400 hover:text-red-200"><Trash2 size={15} /></button>
                                                            </div>
                                                        </td>
                                                    </>
                                                )}
                                            </motion.tr>
                                        )
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>

                        {/* MOBILE CARDS */}
                        <div className="sm:hidden flex flex-col gap-2 p-3 pb-20">
                            <AnimatePresence mode="popLayout">
                                {logs.map((log, index) => {
                                    const isEditing = editingId === log.id;
                                    const [h, m] = calculateHoursWorked(isEditing ? editForm.start_time! : log.start_time, isEditing ? editForm.end_time! : log.end_time);

                                    return (
                                        <motion.div
                                            layout="position"
                                            key={log.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={`rounded-xl p-4 border ${isEditing ? 'bg-slate-800/80 border-blue-500/50' : 'bg-slate-800/20 border-slate-800/50'}`}
                                        >
                                            {isEditing ? (
                                                <div className="flex flex-col gap-3">
                                                    <input autoFocus value={editForm.task_name} onChange={e => setEditForm({ ...editForm, task_name: e.target.value })} className={`${inputClass} font-bold text-base`} placeholder="Task Name" />
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="flex flex-col gap-1">
                                                            <label className="text-[10px] uppercase text-blue-400 font-bold tracking-wider">Start</label>
                                                            <input type="datetime-local" value={toInputFormat(editForm.start_time!)} onChange={e => setEditForm({ ...editForm, start_time: new Date(e.target.value).toISOString() })} className={inputClass} />
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <label className="text-[10px] uppercase text-blue-400 font-bold tracking-wider">End</label>
                                                            <input type="datetime-local" value={toInputFormat(editForm.end_time!)} onChange={e => setEditForm({ ...editForm, end_time: new Date(e.target.value).toISOString() })} className={inputClass} />
                                                        </div>
                                                    </div>
                                                    <textarea rows={2} value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} className={inputClass} placeholder="Notes..." />

                                                    <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-700/50">
                                                        <span className="text-xs font-mono text-blue-300">Dur: {formatDuration(h, m)}</span>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => setEditingId(null)} className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 text-sm font-medium">Cancel</button>
                                                            <button onClick={() => saveEditing(log.id)} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium flex items-center gap-1">Save</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex justify-between items-start mb-3">
                                                        <h3 className="font-bold text-lg text-blue-100 leading-tight break-words pr-2">{log.task_name}</h3>
                                                        <span className="text-xs font-mono bg-slate-700/40 text-blue-200 px-2 py-1 rounded whitespace-nowrap">{formatDuration(h, m)}</span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 text-sm text-blue-300 mb-3">
                                                        <div className="flex items-center gap-1.5"><Calendar size={13} className="text-blue-500" /> {formatDateTime(log.start_time, true)}</div>
                                                        <div className="flex items-center gap-1.5 justify-end"><Clock size={13} className="text-blue-500" /> {formatDateTime(log.end_time, true).split(',')[1]}</div>
                                                    </div>

                                                    {log.notes && (
                                                        <p className="text-sm text-blue-400/80 italic bg-slate-900/20 p-2 rounded mb-3 break-words">{log.notes}</p>
                                                    )}

                                                    <div className="flex justify-end gap-3 pt-2 border-t border-slate-800/50">
                                                        <button onClick={() => { setEditingId(log.id); setEditForm({ ...log }) }} className="flex items-center gap-1.5 text-sm text-blue-300 hover:text-white p-2"><Pencil size={14} /> Edit</button>
                                                        <button onClick={() => handleDelete(log.id)} className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 p-2"><Trash2 size={14} /> Delete</button>
                                                    </div>
                                                </>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </>
                )}
            </div>

            {/* 3. FOOTER */}
            <div className="flex-none p-4 bg-slate-900/95 backdrop-blur border-t border-slate-800 z-20 flex justify-between items-center">
                <span className="text-blue-300 text-sm font-medium">Summary</span>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] sm:text-xs text-blue-400 uppercase tracking-wider">Total</span>
                    <motion.div
                        key={totalMinutes} initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                        className="bg-slate-800 text-white font-bold font-mono px-3 py-1.5 rounded-lg border border-slate-700 text-sm sm:text-base"
                    >
                        {formatDuration(totalHours, totalMinutes)}
                    </motion.div>
                </div>
            </div>

        </motion.div>
    );
};