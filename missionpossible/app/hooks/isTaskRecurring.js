export const useIsTaskRecurring = () => {
  return (task, date) => {
    if (!task.repeat || !task.deadline) return false;
    
    const taskStart = new Date(task.deadline);
    const checkDate = new Date(date);
    const today = new Date();
    const deadlineDate = task.endDate ? new Date(task.endDate) : null;

    taskStart.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (deadlineDate) deadlineDate.setHours(0, 0, 0, 0);
    if (task.completed) return false;
    if (checkDate < taskStart) return false;
    if (deadlineDate && checkDate > deadlineDate) return false;
    if (task.deadline) {
      const deadline = new Date(task.deadline);
      deadline.setHours(0, 0, 0, 0);
      if (checkDate < deadline) return false;
    }

    switch (task.repeat) {
      case 'daily':
        return true;
      case 'weekly': {
        const weekDiff = Math.floor((checkDate - taskStart) / (7 * 24 * 60 * 60 * 1000));
        return weekDiff >= 0 && checkDate.getDay() === taskStart.getDay();
      }
      case 'biweekly': {
        const twoWeekDiff = Math.floor((checkDate - taskStart) / (14 * 24 * 60 * 60 * 1000));
        return twoWeekDiff >= 0 && checkDate.getDay() === taskStart.getDay() && twoWeekDiff % 1 === 0;
      }
      case 'monthly': {
        const monthDiff = (checkDate.getFullYear() - taskStart.getFullYear()) * 12 + (checkDate.getMonth() - taskStart.getMonth());
        return checkDate.getDate() === taskStart.getDate() && monthDiff >= 0;
      }
      case 'quarterly': {
        const monthDiff = (checkDate.getFullYear() - taskStart.getFullYear()) * 12 + (checkDate.getMonth() - taskStart.getMonth());
        return monthDiff >= 0 && monthDiff % 3 === 0 && checkDate.getDate() === taskStart.getDate();
      }
      case 'yearly': {
        const yearDiff = checkDate.getFullYear() - taskStart.getFullYear();
        return yearDiff >= 0 && checkDate.getDate() === taskStart.getDate() && checkDate.getMonth() === taskStart.getMonth();
      }
      default:
        return checkDate.getTime() === taskStart.getTime();
    }
  };
};