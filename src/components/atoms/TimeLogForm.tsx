import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient.ts';
import { motion, AnimatePresence } from 'framer-motion';
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button.tsx";
import { toast } from "sonner";

// Define your predefined task names
const PREDEFINED_TASKS = [
    "Reading Papers/Theory",
    "Project Report Writing",
    "Presentation Preparation",
    "Prototype Programming",
    "Meeting/Discussion",
    "General Admin/Planning",
    "Bug Fixing",
];

function formatDateTimeLocal(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatElapsed(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TimeLogForm() {
    const [taskName, setTaskName] = useState('');
    const [notes, setNotes] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [timerRunning, setTimerRunning] = useState(false);
    const [timerStart, setTimerStart] = useState<Date | null>(null);
    const [timerElapsed, setTimerElapsed] = useState(0);

    // 1. NEW STATE: Store combined tasks here
    const [suggestedTasks, setSuggestedTasks] = useState<string[]>(PREDEFINED_TASKS);

    // 2. NEW EFFECT: Fetch existing tasks from DB on mount
    useEffect(() => {
        const fetchTasks = async () => {
            // Fetch only the task_name column
            const { data, error } = await supabase
                .from('time_logs')
                .select('task_name');

            if (!error && data) {
                // Extract names from objects
                const dbTasks = data.map((item: any) => item.task_name).filter(Boolean);

                // Combine predefined + db tasks, use Set to remove duplicates, and sort
                const uniqueTasks = Array.from(new Set([...PREDEFINED_TASKS, ...dbTasks])).sort();

                setSuggestedTasks(uniqueTasks);
            }
        };

        fetchTasks();
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;
        if (timerRunning && timerStart) {
            interval = setInterval(() => {
                setTimerElapsed(Math.floor((Date.now() - timerStart.getTime()) / 1000));
            }, 1000);
        } else {
            setTimerElapsed(0);
        }
        return () => interval && clearInterval(interval);
    }, [timerRunning, timerStart]);

    const handleTimerClick = () => {
        if (!timerRunning) {
            const now = new Date();
            setTimerStart(now);
            setStartTime(formatDateTimeLocal(now));
            setEndTime('');
            setTimerRunning(true);
        } else {
            const now = new Date();
            setEndTime(formatDateTimeLocal(now));
            setTimerRunning(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const toastId = toast.loading('Saving time log...');

        try {
            const { error } = await supabase.from('time_logs').insert([
                {
                    task_name: taskName,
                    start_time: startTime,
                    end_time: endTime,
                    notes: notes,
                },
            ]);

            if (error) {
                toast.error('Failed to save time log', {
                    id: toastId,
                    description: error.message,
                    duration: 4000,
                });
            } else {
                toast.success('Time log saved successfully!', {
                    id: toastId,
                    description: `Task: ${taskName}`,
                    duration: 3000,
                });

                // Optional: Add the new task to the suggestion list immediately without refetching
                setSuggestedTasks(prev => Array.from(new Set([...prev, taskName])).sort());

                setTaskName('');
                setNotes('');
                setStartTime('');
                setEndTime('');
                setTimerRunning(false);
                setTimerStart(null);
                setTimerElapsed(0);
            }
        } catch (error) {
            toast.error('An unexpected error occurred', { id: toastId, duration: 4000 });
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            boxShadow: ["0px 0px 0px rgba(59, 130, 246, 0)", "0px 0px 20px rgba(59, 130, 246, 0.4)", "0px 0px 0px rgba(59, 130, 246, 0)"],
            transition: {
                opacity: { duration: 0.5, ease: "easeOut" },
                y: { duration: 0.5, ease: "easeOut" },
                boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
    };

    return (
        <motion.div
            layout
            className="bg-slate-900/90 backdrop-blur-md shadow-2xl text-white rounded-xl p-8 w-full max-w-md border border-slate-800"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.h1
                className="text-2xl font-bold mb-6 text-center text-blue-100"
                variants={{
                    hidden: { opacity: 0, y: -10 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
                }}
            >
                Projektarbeit Time Logger
            </motion.h1>

            <motion.div className={"flex flex-row justify-between gap-3 mb-6"} layout variants={itemVariants}>
                <motion.div className="flex flex-col items-center" layout>
                    <motion.button
                        type="button"
                        className={`btn btn-lg ${timerRunning ? 'btn-error' : 'btn-success'} mb-2 shadow-lg`}
                        onClick={handleTimerClick}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            backgroundColor: timerRunning ? '#ef4444' : '#22c55e'
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{
                            duration: 0.3,
                            backgroundColor: { duration: 0.4, ease: "easeInOut" }
                        }}
                    >
                        <motion.span
                            key={timerRunning ? 'stop' : 'start'}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.2 }}
                        >
                            {timerRunning ? 'Stop Timer' : 'Start Timer'}
                        </motion.span>
                    </motion.button>

                    <AnimatePresence mode="wait">
                        {timerRunning && (
                            <motion.div
                                key="timer-display"
                                initial={{ opacity: 0, y: -20, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.8, transition: { duration: 0.3 } }}
                                transition={{ duration: 0.4 }}
                                className="flex flex-col items-center"
                            >
                                <motion.span
                                    className="text-lg font-mono bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 text-blue-200"
                                    animate={{ scale: [1, 1.02, 1] }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    {formatElapsed(timerElapsed)}
                                </motion.span>
                                <motion.div
                                    className="text-xs text-blue-300 mt-1"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    Timer running...
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
                <InteractiveHoverButton className={"max-h-fit"}>
                    <a href="/dashboard" className="text-blue-200 hover:text-white text-sm inline-flex items-center">
                        <span>View All Time Logs</span>
                    </a>
                </InteractiveHoverButton>
            </motion.div>

            <motion.form
                onSubmit={handleSubmit}
                className="space-y-4"
                autoComplete="off"
                variants={itemVariants}
            >
                <motion.div variants={itemVariants}>
                    <label htmlFor="taskName" className="block text-sm font-medium text-blue-100 mb-1">
                        Task Name
                    </label>
                    <motion.input
                        id="taskName"
                        type="text"
                        value={taskName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaskName(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400"
                        whileFocus={{ scale: 1.01, borderColor: '#3b82f6' }}
                        transition={{ duration: 0.2 }}
                        list="predefined-tasks-list"
                        autoComplete="off"
                    />
                    {/* 3. UPDATED: Use the dynamic suggestedTasks state */}
                    <datalist id="predefined-tasks-list">
                        {suggestedTasks.map((task, index) => (
                            <option key={index} value={task} />
                        ))}
                    </datalist>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <label htmlFor="startTime" className="block text-sm font-medium text-blue-100 mb-1">Start Time</label>
                    <motion.input
                        id="startTime"
                        type="datetime-local"
                        value={startTime}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                        whileFocus={{ scale: 1.01, borderColor: '#3b82f6' }}
                        transition={{ duration: 0.2 }}
                    />
                </motion.div>

                <motion.div variants={itemVariants}>
                    <label htmlFor="endTime" className="block text-sm font-medium text-blue-100 mb-1">End Time</label>
                    <motion.input
                        id="endTime"
                        type="datetime-local"
                        value={endTime}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                        whileFocus={{ scale: 1.01, borderColor: '#3b82f6' }}
                        transition={{ duration: 0.2 }}
                    />
                </motion.div>

                <motion.div variants={itemVariants}>
                    <label htmlFor="notes" className="block text-sm font-medium text-blue-100 mb-1">Notes</label>
                    <motion.textarea
                        id="notes"
                        value={notes}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                        whileFocus={{ scale: 1.01, borderColor: '#3b82f6' }}
                        transition={{ duration: 0.2 }}
                    />
                </motion.div>

                <motion.button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-lg shadow-blue-900/20"
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, backgroundColor: '#2563eb' }}
                    whileTap={{ scale: 0.98 }}
                >
                    Save Log
                </motion.button>
            </motion.form>

            <motion.div
                className="mt-6 text-center"
                variants={itemVariants}
            >
            </motion.div>
        </motion.div>
    );
}