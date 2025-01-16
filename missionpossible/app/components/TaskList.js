"use client";

import { useRouter } from "next/navigation";
import { useTasks } from "../context/TaskContext";
import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";

export default function TaskList() {
  const { tasks, toggleTaskCompletion } = useTasks();
  const { user } = useUser();
  const router = useRouter();
  const [showCompleted, setShowCompleted] = useState(false);
  const [sortBy, setSortBy] = useState('deadline'); 
  const [sortDirection, setSortDirection] = useState('asc'); 
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleTaskClick = (taskId) => {
    router.push(`/tasks/${taskId}`);
  };

  const handleToggleComplete = (e, taskId) => {
    e.stopPropagation(); 
    toggleTaskCompletion(taskId);
  };

  if (!isClient) return null;

  if (!user) {
    return (
      <div>
        <p>Musisz się zalogować, aby zobaczyć listę zadań.</p>
        <a href="/login">Przejdź do logowania</a>
      </div>
    );
  }

  const sortTasks = (tasksToSort) => {
    return tasksToSort.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'deadline':
          comparison = (a.deadline || '') > (b.deadline || '') ? 1 : -1;
          break;
        case 'importance':
          comparison = a.importance - b.importance;
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case 'progress':
          comparison = (a.executionProgress || 0) - (b.executionProgress || 0);
          break;
        default:
          return 0;
      }
      
      return sortDirection === 'desc' ? comparison * -1 : comparison;
    });
  };

  const filterTasks = (tasksToFilter) => {
    return tasksToFilter.filter(task => {
      const matchesSearch = searchTerm.toLowerCase().trim() === '' || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (task.location && task.location.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = searchCategory === 'all' || 
        (searchCategory === 'title' && task.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (searchCategory === 'description' && task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (searchCategory === 'location' && task.location && task.location.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSearch && matchesCategory;
    });
  };

  const userTasks = sortTasks(
    filterTasks(
      tasks
        .filter(task => task.userId === user.uid)
        .filter(task => task.completed === showCompleted)
    )
  );

  return (
    <div>
      <h2>Lista zadań</h2>
      
      <div>
        <input
          type="text"
          placeholder="Wyszukaj zadania..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <select
          value={searchCategory}
          onChange={(e) => setSearchCategory(e.target.value)}
        >
          <option value="all">Wszystkie pola</option>
          <option value="title">Tytuł</option>
          <option value="description">Opis</option>
          <option value="location">Lokalizacja</option>
        </select>
      </div>

      <div>
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="deadline">Termin</option>
          <option value="importance">Istotność</option>
          <option value="createdAt">Data utworzenia</option>
          <option value="progress">Postęp wykonania</option>
        </select>

        <button onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}>
          {sortDirection === 'asc' ? '↑' : '↓'}
        </button>

        <button onClick={() => setShowCompleted(!showCompleted)}>
          {showCompleted ? 'Pokaż aktywne zadania' : 'Pokaż wykonane zadania'}
        </button>
      </div>

      {userTasks.length === 0 ? (
        <p>
          {showCompleted ? 'Brak wykonanych zadań!' : 'Nie masz jeszcze zapisanych zadań!'}
        </p>
      ) : (
        <ul>
          {userTasks.map((task) => (
            <li key={task.id}>
              <div onClick={() => handleTaskClick(task.id)}>
                <h3>{task.title}</h3>
                <p>Termin: {task.deadline || "Brak terminu"}</p>
                <p>Istotność: {task.importance}</p>
                <p>Status: {task.completed ? "Wykonane" : "Do zrobienia"}</p>
                {task.completedAt && (
                  <p>Wykonano: {new Date(task.completedAt).toLocaleDateString()}</p>
                )}
                <p>Postęp: {task.executionProgress}%</p>
              </div>
              <button 
                onClick={(e) => handleToggleComplete(e, task.id)}
              >
                {task.completed ? '✓ Wykonane' : '◯ Do zrobienia'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
