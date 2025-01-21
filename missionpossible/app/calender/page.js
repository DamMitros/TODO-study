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
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push({ date: new Date(year, month, -i), isCurrentMonth: false });
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
    return <div>Wczytywanie </div>;
  }

  if (state.loading) {
    return <div>Wczytywanie zadań...</div>;
  }

  return (
    <div>
      <div>
        <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
          Poprzedni miesiąc
        </button>
        <h2>{currentDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}</h2>
        <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
          Następny miesiąc
        </button>
      </div>

      <div>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day}>{day}</div>
        ))}
        
        {getCalendarDays(currentDate).map((day, idx) => {
          const dayTasks = getTasksForDate(day.date);
          return (
            <div key={idx}>
              <div>{day.date.getDate()}</div>
              <div>
                {dayTasks.map((task, taskIdx) => (
                  <div key={taskIdx} onClick={() => router.push(`/tasks/${task.id}`)}>
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