"use client";

import { useRouter } from "next/navigation";
import { useTasks } from "../context/TaskContext";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useUser } from "../context/UserContext";
import { useProjects } from "../context/ProjectContext"; 

export default function TaskList() {
  const { tasks, toggleTaskCompletion } = useTasks();
  const { user } = useUser();
  const { projects } = useProjects(); 
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [sortBy, setSortBy] = useState('deadline'); 
  const [sortDirection, setSortDirection] = useState('asc'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');

  const filteredAndSortedTasks = useMemo(() => {
    if (!user) return [];

    const userTasks = tasks.filter(task => 
      task.userId === user.uid || 
      (task.sharedWith && task.sharedWith.includes(user.email))
    ).filter(task => task.completed === showCompleted);
  
    const filtered = userTasks.filter(task => {
      const matchesSearch = searchTerm ? (() => {
        switch (searchCategory) {
          case 'title':
            return task.title.toLowerCase().includes(searchTerm.toLowerCase());
          case 'description':
            return task.description?.toLowerCase().includes(searchTerm.toLowerCase());
          case 'location':
            return task.location?.toLowerCase().includes(searchTerm.toLowerCase());
          case 'all':
          default:
            return (
              task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              task.location?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
      })() : true;

      const matchesCategory = searchCategory === 'all' || !searchCategory;
      const matchesPriority = priorityFilter === 'all' || task.importance === Number(priorityFilter);
      const matchesProject = projectFilter === 'all' || task.projectId === projectFilter;

      return matchesSearch && matchesCategory && matchesPriority && matchesProject;
    });

    return filtered.sort((a, b) => {
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
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [
    tasks,
    user,
    showCompleted,
    searchTerm,
    searchCategory,
    priorityFilter,
    projectFilter,
    sortBy,
    sortDirection
  ]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleTaskClick = useCallback((taskId) => {
    router.push(`/tasks/${taskId}`);
  }, [router]);

  const handleToggleComplete = useCallback((e, taskId) => {
    e.stopPropagation(); 
    toggleTaskCompletion(taskId);
  }, [toggleTaskCompletion]);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleSortDirectionToggle = useCallback(() => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  const handleShowCompletedToggle = useCallback(() => {
    setShowCompleted(prev => !prev);
  }, []);

  if (!isClient) return null;

  if (!user) {
    return (
      <div>
        <p>Musisz się zalogować, aby zobaczyć listę zadań.</p>
        <a href="/login">Przejdź do logowania</a>
      </div>
    );
  }

  const userProjects = projects.filter(project => 
    project.createdBy === user.uid || 
    (project.members && project.members.includes(user.email))
  );

  return (
    <div>
      <h2>Lista zadań</h2>
      
      <div>
        <input
          type="text"
          placeholder="Wyszukaj zadania..."
          value={searchTerm}
          onChange={handleSearchChange}
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

        <button onClick={handleSortDirectionToggle}>
          {sortDirection === 'asc' ? '↑' : '↓'}
        </button>

        <button onClick={handleShowCompletedToggle}>
          {showCompleted ? 'Pokaż aktywne zadania' : 'Pokaż wykonane zadania'}
        </button>
      </div>

      <div>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="all">Wszystkie priorytety</option>
          <option value="5">Krytyczny</option>
          <option value="4">Wysoki</option>
          <option value="3">Średni</option>
          <option value="2">Niski</option>
          <option value="1">Najniższy</option>
        </select>
      </div>

      <div>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
        >
          <option value="all">Wszystkie projekty</option>
          {userProjects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {filteredAndSortedTasks.length === 0 ? (
        <p>
          {showCompleted ? 'Brak wykonanych zadań!' : 'Nie masz jeszcze zapisanych zadań!'}
        </p>
      ) : (
        <ul>
          {filteredAndSortedTasks.map((task) => (
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
