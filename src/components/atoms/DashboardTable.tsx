import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient.ts';
import { motion, AnimatePresence } from 'framer-motion';
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button.tsx";
import { Download } from 'lucide-react'; // Import an icon for the button

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

function calculateHoursWorked(startTime: string, endTime: string): number[] {
  if (!startTime || !endTime) return [0,0];

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return [0,0];

  const diffMs = end.getTime() - start.getTime();

  if (diffMs < 0) return [0,0];

  const minutes = diffMs / 1000 / 60 % 60;

  const hours = Math.floor(diffMs / 1000 / 60 / 60);

  return [hours, minutes];
}

function formatHours(hours: number): string {
  return hours.toFixed();
}

export const DashboardTable: React.FC = () => {
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalHours, setTotalHours] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      const { data, error: fetchError } = await supabase
          .from('time_logs')
          .select('*')
          .order('start_time', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setLogs(data || []);
        let totalHours = 0;
        let totalMinutes = 0;
        (data || []).forEach(log => {
          let [hours, minutes] = calculateHoursWorked(log.start_time, log.end_time);
          totalHours += hours;
          if (totalMinutes + minutes >= 60) {
            totalHours += Math.floor((totalMinutes + minutes) / 60);
            totalMinutes = (totalMinutes + minutes) % 60;
          } else {
            totalMinutes += minutes;
          }
        });
        setTotalHours(totalHours);
        setTotalMinutes(totalMinutes);
      }
      setLoading(false);
    })();
  }, []);

  const handleExportCSV = useCallback((logsToExport: TimeLog[]) => {
    if (logsToExport.length === 0) {
      alert("No data to export.");
      return;
    }

    const headers = ["Task", "Start Time", "End Time", "Hours Worked", "Notes"];

    const escapeCsvField = (field: any): string => {
      if (field === null || field === undefined) {
        return '';
      }
      const strField = String(field);
      if (strField.includes(',') || strField.includes('"') || strField.includes('\n') || strField.includes('\r')) {
        return `"${strField.replace(/"/g, '""')}"`;
      }
      return strField;
    };

    const csvRows = logsToExport.map(log => [
      escapeCsvField(log.task_name),
      escapeCsvField(formatDateTime(log.start_time)),
      escapeCsvField(formatDateTime(log.end_time)),
      escapeCsvField(calculateHoursWorked(log.start_time, log.end_time)[0].toFixed(1)),
      escapeCsvField(log.notes)
    ].join(','));

    const csvString = [headers.join(','), ...csvRows].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'time_logs.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, []); // formatDateTime and calculateHoursWorked are stable top-level functions

  return (
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col max-h-[80vh]"
      >
        <motion.div
            className="flex justify-between items-center mb-6 sticky top-0 bg-purple-900 z-10 py-4 px-1" // Added bg, z-index, padding
            initial={{ opacity: 0, y: -20 }} // Adjusted initial animation
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay:0.1 }}
        >
          <motion.h1
              className="text-2xl font-bold text-gray-100 ml-3" // Added ml-3 for padding consistency
              initial="hidden"
              animate="visible"
              variants={headerVariants}
              transition={{ delay: 0.2, duration: 0.4 }} // Adjusted delay
          >
            Dashboard
          </motion.h1>

          <div className="flex items-center space-x-3 mr-3"> {/* Wrapper for buttons, adjusted spacing & margin */}
            <InteractiveHoverButton className={"max-h-fit"}>
              <motion.button
                  onClick={() => handleExportCSV(logs)}
                  disabled={loading || logs.length === 0 || !!error}
                  className="text-purple-300 hover:text-white text-sm inline-flex items-center px-3 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }} // Adjusted delay
              >
                <Download size={16} className="mr-2" />
                Export to CSV
              </motion.button>
            </InteractiveHoverButton>

            <InteractiveHoverButton className={"max-h-fit"}>
              <motion.a
                  href="/"
                  className="text-purple-300 hover:text-white text-sm inline-flex items-center px-3 py-2 rounded-md" // Added padding & rounded for consistency
                  // Added motion for consistency if desired
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35, duration: 0.3 }} // Staggered delay
              >
                {/* <motion.span> is fine if InteractiveHoverButton is designed for it */}
                Go Back to Logger
              </motion.a>
            </InteractiveHoverButton>
          </div>
        </motion.div>

        {error && (
            <motion.p className="text-red-400 text-center mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Error: {error}
            </motion.p>
        )}
        <div className="overflow-auto px-1"> {/* Added px-1 to prevent scrollbar overlap with rounded corners potentially */}
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
                            // initial="hidden" // Already handled by tableVariants staggerChildren
                            // animate="visible"
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
                              {formatHours(calculateHoursWorked(log.start_time, log.end_time)[0])}
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
                className="mt-8 p-4 bg-purple-800/90 rounded-xl shadow-lg mx-1" // Added mx-1 for consistency if px-1 on scroll area
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
                  <span className="text-sm text-purple-300">Total Time:</span>
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
                    {formatHours(totalHours)} Hours and {formatHours(totalMinutes)} minutes
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
        )}
      </motion.div>
  );
};