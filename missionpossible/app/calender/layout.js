"use client";

export default function CalendarLayout({ children }) {
  return (
    <div className="py-2">
      <h1 className="text-3xl font-bold text-center mb-8 text-indigo-600 dark:text-indigo-400">Widok Kalendarza</h1>
      {children}
    </div>
  );
}