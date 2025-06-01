import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient.ts';
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
  // Add more common tasks here
];

function getNowLocal() {
  const now = new Date();
  now.setSeconds(0, 0);
  return now.toISOString().slice(0, 16);
}

export default function TimeLogForm() {
  const [taskName, setTaskName] = useState('');
  const [notes, setNotes] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerStart, setTimerStart] = useState<Date | null>(null);
  const [timerElapsed, setTimerElapsed] = useState(0);

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
      setStartTime(now.toISOString().slice(0, 16));
      setEndTime('');
      setTimerRunning(true);
    } else {
      const now = new Date();
      setEndTime(now.toISOString().slice(0, 16));
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

        setTaskName('');
        setNotes('');
        setStartTime('');
        setEndTime('');
        setTimerRunning(false);
        setTimerStart(null);
        setTimerElapsed(0);
      }
    } catch (error) {
      toast.error('An unexpected error occurred', {
        id: toastId,
        duration: 4000,
      });
    }
  };

  function formatElapsed(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
      <motion.div
          layout
          className="bg-purple-900 shadow-xl text-white rounded-xl p-8 w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.h1
            className="text-2xl font-bold mb-6 text-center text-gray-100"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
        >
          Projektarbeit Time Logger
        </motion.h1>

        <motion.div className={"flex flex-row justify-between gap-3"} layout>
          <motion.div
              className="flex flex-col items-center mb-6"
              layout
          >
            <motion.button
                type="button"
                className={`btn btn-lg ${timerRunning ? 'btn-error' : 'btn-success'} mb-2`}
                onClick={handleTimerClick}
                initial={{opacity: 0, scale: 0.8}}
                animate={{
                  opacity: 1,
                  scale: 1,
                  backgroundColor: timerRunning ? '#ef4444' : '#22c55e'
                }}
                whileHover={{scale: 1.05}}
                whileTap={{scale: 0.95}}
                transition={{
                  duration: 0.3,
                  backgroundColor: {duration: 0.4, ease: "easeInOut"}
                }}
            >
              <motion.span
                  key={timerRunning ? 'stop' : 'start'}
                  initial={{opacity: 0, y: 5}}
                  animate={{opacity: 1, y: 0}}
                  exit={{opacity: 0, y: -5}}
                  transition={{duration: 0.2}}
              >
                {timerRunning ? 'Stop Timer' : 'Start Timer'}
              </motion.span>
            </motion.button>

            <AnimatePresence mode="wait">
              {timerRunning && (
                  <motion.div
                      key="timer-display"
                      initial={{opacity: 0, y: -20, scale: 0.8}}
                      animate={{opacity: 1, y: 0, scale: 1}}
                      exit={{
                        opacity: 0,
                        y: 20,
                        scale: 0.8,
                        transition: {duration: 0.3, ease: "easeIn"}
                      }}
                      transition={{duration: 0.4, ease: "easeOut"}}
                      className="flex flex-col items-center"
                  >
                    <motion.span
                        className="text-lg font-mono bg-purple-800 px-3 py-1 rounded-lg"
                        animate={{
                          scale: [1, 1.02, 1],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                    >
                      {formatElapsed(timerElapsed)}
                    </motion.span>
                    <motion.div
                        className="text-xs text-purple-300 mt-1"
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        transition={{delay: 0.2}}
                    >
                      Timer running...
                    </motion.div>
                  </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <InteractiveHoverButton className={"max-h-fit"}>
            <a
                href="/dashboard"
                className="text-purple-300 hover:text-white text-sm inline-flex items-center"
            >
              <span>View All Time Logs</span>
            </a>
          </InteractiveHoverButton>
        </motion.div>
        <motion.form
            onSubmit={handleSubmit}
            className="space-y-4"
            autoComplete="off"
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{delay: 0.3, duration: 0.5}}
        >
          <motion.div
              initial={{opacity: 0, x: -20}}
              animate={{opacity: 1, x: 0}}
              transition={{delay: 0.4, duration: 0.4}} // Example delay
          >
            <label htmlFor="taskName" className="block text-sm font-medium text-gray-100 mb-1">
              Task Name
            </label>
            <motion.input
                id="taskName" // Make sure this ID matches the label's htmlFor
                type="text"
                value={taskName} // From your TimeLogForm state
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaskName(e.target.value)} // From your TimeLogForm state
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                whileFocus={{scale: 1.02}}
                transition={{duration: 0.2}}
                list="predefined-tasks-list" // This links the input to the datalist below
                autoComplete="off" // Good practice when using datalist to avoid browser's own autocomplete conflicting
            />
            {/* The datalist itself is not visible but provides options to the input */}
            <datalist id="predefined-tasks-list">
              {PREDEFINED_TASKS.map((task, index) => (
                  <option key={index} value={task}/>
              ))}
            </datalist>
          </motion.div>

          <motion.div
              initial={{opacity: 0, x: -20}}
              animate={{opacity: 1, x: 0}}
              transition={{delay: 0.5, duration: 0.4}}
          >
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-100 mb-1">Start Time</label>
            <motion.input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400" // Added bg-white and text-gray-900
                whileFocus={{scale: 1.02}}
                transition={{duration: 0.2}}
            />
          </motion.div>

          <motion.div
              initial={{opacity: 0, x: -20}}
              animate={{opacity: 1, x: 0}}
              transition={{delay: 0.6, duration: 0.4}}
          >
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-100 mb-1">End Time</label>
            <motion.input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400" // Added bg-white and text-gray-900
                whileFocus={{scale: 1.02}}
                transition={{duration: 0.2}}
            />
          </motion.div>

          <motion.div
              initial={{opacity: 0, x: -20}}
              animate={{opacity: 1, x: 0}}
              transition={{delay: 0.7, duration: 0.4}}
          >
            <label htmlFor="notes" className="block text-sm font-medium text-gray-100 mb-1">Notes</label>
            <motion.textarea
                id="notes"
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400" // Added bg-white and text-gray-900
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
            />
          </motion.div>

          <motion.button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.1 }} // Reduced delay to match form field reveal
              whileHover={{ scale: 1.02, backgroundColor: '#7c3aed' }}
              whileTap={{ scale: 0.98 }}
          >
            Save Log
          </motion.button>
        </motion.form>

        {/* The empty motion.div for potential future content can remain as is */}
        <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
        >
        </motion.div>
      </motion.div>
  );
}