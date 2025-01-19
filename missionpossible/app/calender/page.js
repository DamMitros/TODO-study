'use client';

import { useState } from 'react';
import { useTasks } from './../context/TaskContext';
import { useUser } from './../context/UserContext';
import { useRouter } from 'next/navigation';

const isTaskRecurring = (task, date) => {
  if (!task.repeat || !task.deadline) return false;
  
  const taskStart = new Date(task.deadline);
  const checkDate = new Date(date);

  taskStart.setHours(0, 0, 0, 0);
  checkDate.setHours(0, 0, 0, 0);

  if (checkDate < taskStart) return false;

  switch (task.repeat) {
    case 'daily':
      return true;
    case 'weekly':
      const weekDiff = Math.floor((checkDate - taskStart) / (7 * 24 * 60 * 60 * 1000));
      return weekDiff >= 0 && checkDate.getDay() === taskStart.getDay();
    case 'biweekly':
      const twoWeekDiff = Math.floor((checkDate - taskStart) / (14 * 24 * 60 * 60 * 1000));
      return twoWeekDiff >= 0 && checkDate.getDay() === taskStart.getDay() && twoWeekDiff % 1 === 0;
    case 'monthly':
      return checkDate.getDate() === taskStart.getDate();
    case 'quarterly':
      const monthDiff = (checkDate.getFullYear() - taskStart.getFullYear()) * 12 + 
                       (checkDate.getMonth() - taskStart.getMonth());
      return monthDiff % 3 === 0 && checkDate.getDate() === taskStart.getDate();
    case 'yearly':
      return checkDate.getDate() === taskStart.getDate() && 
             checkDate.getMonth() === taskStart.getMonth();
    default: // 'jednorazowe'
      return checkDate.getTime() === taskStart.getTime();
  }
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { tasks } = useTasks();
  const { user } = useUser();
  const router = useRouter();

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
    return tasks.filter(task => {
      return task.userId === user.uid && 
             (isTaskRecurring(task, date) || 
              (task.deadline && new Date(task.deadline).toDateString() === date.toDateString()));
    });
  };

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
                    <span>
                      {new Date(task.deadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
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