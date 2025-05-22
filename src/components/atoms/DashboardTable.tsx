import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.ts';
import { motion, AnimatePresence } from 'framer-motion';
import {InteractiveHoverButton} from "@/components/magicui/interactive-hover-button.tsx";

interface TimeLog {
  id: number;
  task_name: string;
  start_time: string;
  end_time: string;
  notes: string;
}

const tableVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const headerVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
};

function formatDateTime(dt: string) {
  if (!dt) return '';
  const d = new Date(dt);
  return d.toLocaleString();
}

function calculateHoursWorked(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  
  const diffMs = end.getTime() - start.getTime();
  
  // If end is before start, return 0
  if (diffMs < 0) return 0;
  
  // Convert to hours and round to 1 decimal place
  return Math.round(diffMs / 1000 / 60 / 60 * 10) / 10;
}

function formatHours(hours: number): string {
  return hours.toFixed();
}

export const DashboardTable: React.FC = () => {
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalHours, setTotalHours] = useState(0);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('time_logs').select('*').order('start_time', { ascending: false });
      if (error) {
        setError(error.message);
      } else {
        setLogs(data || []);
        
        // Calculate total hours
        let total = 0;
        (data || []).forEach(log => {
          total += calculateHoursWorked(log.start_time, log.end_time);
        });
        setTotalHours(total);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col max-h-[80vh]"
    >
      <motion.div 
        className="flex justify-between items-center mb-6 sticky top-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.h1
          className="text-2xl font-bold text-gray-100"
          initial="hidden"
          animate="visible"
          variants={headerVariants}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          Dashboard
        </motion.h1>

        <InteractiveHoverButton className={"max-h-fit"}>
          <motion.a
              href="/"
              className="text-purple-300 hover:text-white text-sm inline-flex items-center"
          >
            <motion.span>Go Back to Logger</motion.span>
          </motion.a>
        </InteractiveHoverButton>
      </motion.div>

      {error && (
        <motion.p className="text-red-400 text-center mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {error}
        </motion.p>
      )}
      <div className="overflow-auto">
        <AnimatePresence>
          {loading ? (
            <motion.div key="loading" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}
                          className="text-center py-8 text-purple-200">
                <motion.span className="loading loading-spinner loading-xl"></motion.span>
            </motion.div>
          ) : (
            <motion.table
              className="min-w-full table-auto border-separate border-spacing-y-2"
              variants={tableVariants}
              initial="hidden"
              animate="visible"
            >
              <thead className="sticky top-0 bg-purple-900">
                <motion.tr>
                  <motion.th className="px-4 py-2 text-left text-purple-200" variants={headerVariants}>Task</motion.th>
                  <motion.th className="px-4 py-2 text-left text-purple-200" variants={headerVariants}>Start</motion.th>
                  <motion.th className="px-4 py-2 text-left text-purple-200" variants={headerVariants}>End</motion.th>
                  <motion.th className="px-4 py-2 text-center text-purple-200" variants={headerVariants}>Hours</motion.th>
                  <motion.th className="px-4 py-2 text-left text-purple-200" variants={headerVariants}>Notes</motion.th>
                </motion.tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {logs.map((log) => (
                    <motion.tr
                      key={log.id}
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, y: 20 }}
                      className="bg-purple-800/80 hover:bg-purple-700/90 transition-colors rounded-lg shadow-md"
                    >
                      <td className="px-4 py-2 rounded-l-lg font-semibold">{log.task_name}</td>
                      <td className="px-4 py-2">{formatDateTime(log.start_time)}</td>
                      <td className="px-4 py-2">{formatDateTime(log.end_time)}</td>
                      <td className="px-4 py-2 text-center font-mono bg-purple-700/40 rounded">
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3, duration: 0.2 }}
                        >
                          {formatHours(calculateHoursWorked(log.start_time, log.end_time))}
                        </motion.span>
                      </td>
                      <td className="px-4 py-2 rounded-r-lg max-w-xs break-words">{log.notes}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </motion.table>
          )}
        </AnimatePresence>
        {!loading && logs.length === 0 && !error && (
          <motion.p className="text-center text-purple-200 mt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            No time logs found.
          </motion.p>
        )}
      </div>
      
      {!loading && logs.length > 0 && (
        <motion.div 
          className="mt-8 p-4 bg-purple-800/90 rounded-xl shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <div className="flex justify-between items-center">
            <motion.h2 
              className="text-xl font-bold text-purple-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.3 }}
            >
              Summary
            </motion.h2>
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.3 }}
            >
              <span className="text-sm text-purple-300">Total Hours:</span>
              <motion.div 
                className="text-2xl font-bold font-mono bg-purple-700/60 px-4 py-2 rounded-lg text-white"
                initial={{ scale: 0.8 }}
                animate={{ 
                  scale: 1,
                  transition: { 
                    type: "spring",
                    stiffness: 200, 
                    damping: 10,
                    delay: 0.8
                  }
                }}
              >
                {formatHours(totalHours)}
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};