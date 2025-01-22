'use client';

import { useState, useEffect, useReducer } from 'react';
import { useTasks } from './../context/TaskContext';
import { useUser } from './../context/UserContext';
import { useRouter } from 'next/navigation';
import { taskReducer } from '../reducers/taskReducer';
import { useIsTaskRecurring } from '../hooks/isTaskRecurring';

const initialState = {
  tasks: [],
  loading: true
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [state, dispatch] = useReducer(taskReducer, initialState);
  const isTaskRecurring = useIsTaskRecurring();
  const { tasks } = useTasks();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    if (tasks) {
      const userTasks = tasks.filter(task => 
        task.userId === user.uid || 
        (task.sharedWith && task.sharedWith.includes(user.email))
      );
      dispatch({ type: 'SET_TASKS', payload: userTasks });
    }
  }, [user, tasks, router]);

  const getCalendarDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    for (let i = startDay; i > 0; i--) {
      days.push({ date: new Date(year, month, 1 - i), isCurrentMonth: false });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }
    return days;
  };

  const getTasksForDate = (date) => {
    if (!user || !state.tasks) return [];
    
    return state.tasks.filter(task => {
      if (!task.deadline) return false;

      const taskDate = new Date(task.deadline);
      const checkDate = new Date(date);
      const hasAccess = task.userId === user.uid || 
            (task.sharedWith && task.sharedWith.includes(user.email));
                       
      if (!task.repeat) {
        return taskDate.toDateString() === checkDate.toDateString() && hasAccess;
      }
      return isTaskRecurring(task, date) && hasAccess;
    });
  };

  if (!user) {
    return <div className="flex justify-center items-center h-64">Wczytywanie...</div>;
  }

  if (state.loading) {
    return <div className="flex justify-center items-center h-64">Wczytywanie zadań...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-2">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        > Poprzedni miesiąc</button>

        <h2 className="text-2xl font-semibold capitalize">{currentDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}</h2>
        
        <button 
          onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        > Następny miesiąc</button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Niedz'].map(day => (
          <div key={day} className="text-center font-semibold p-2">{day}</div>
        ))}
        
        {getCalendarDays(currentDate).map((day, idx) => {
          const dayTasks = getTasksForDate(day.date);
          return (
            <div key={idx} className={`min-h-[100px] border p-2 ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'} dark:bg-gray-800 rounded-lg`}>
              <div className={`text-right ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'} dark:text-gray-200`}>
                {day.date.getDate()}
              </div>
              <div className="mt-1 space-y-1">
                {dayTasks.map((task, taskIdx) => (
                  <div key={taskIdx} onClick={() => router.push(`/tasks/${task.id}`)} className="p-1 text-sm bg-indigo-100 dark:bg-indigo-900 rounded cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors truncate">
                    <span>{task.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}