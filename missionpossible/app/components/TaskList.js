"use client";

import { useRouter } from "next/navigation";
import { useTasks } from "../context/TaskContext";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useUser } from "../context/UserContext";
import { useProjects } from "../context/ProjectContext"; 

export default function TaskList() {
  const { tasks } = useTasks();
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
  const [layoutType, setLayoutType] = useState('grid'); 

  useEffect(() => {
    setIsClient(true);
    const savedLayout = localStorage.getItem('taskLayoutPreference');
    if (savedLayout) {
      setLayoutType(savedLayout);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('taskLayoutPreference', layoutType);
    }
  }, [layoutType, isClient]);

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

  const handleTaskClick = useCallback((taskId) => {
    router.push(`/tasks/${taskId}`);
  }, [router]);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleSortDirectionToggle = useCallback(() => {
    setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
  }, []);

  const handleShowCompletedToggle = useCallback(() => {
    setShowCompleted(prev => !prev);
  }, []);

  if (!isClient) return null;

  if (!user) {
    return (
      <div>
        <p className="text-3xl">Musisz się zalogować, aby zobaczyć listę zadań.</p>
        <button onClick={() => router.push("/login")} className="mt-6 px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200">Przejdź do logowania</button>
      </div>
    );
  }

  const userProjects = projects.filter(project => 
    project.createdBy === user.uid || 
    (project.members && project.members.includes(user.email))
  );

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setLayoutType('list')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                layoutType === 'list'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
              </svg>
            </button>
            <button
              onClick={() => setLayoutType('grid')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                layoutType === 'grid'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"/>
              </svg>
            </button>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <button onClick={handleSortDirectionToggle} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200">
              {sortDirection === 'desc' ? '⭡' : '⭣'}
            </button>
              
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-0">
              <option value="deadline">Termin</option>
              <option value="importance">Priorytet</option>
              <option value="title">Nazwa</option>
            </select>

            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-0">
              <option value="all">Wszystkie priorytety</option>
              <option value="5">Krytyczny</option>
              <option value="4">Wysoki</option>
              <option value="3">Średni</option>
              <option value="2">Niski</option>
              <option value="1">Najniższy</option>
            </select>

            <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-0">
              <option value="all">Wszystkie projekty</option>
              {userProjects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>

            <button onClick={handleShowCompletedToggle} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200">
              {showCompleted ? 'Pokaż aktywne' : 'Pokaż wykonane'}
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Szukaj zadań..."
            className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-0"
          />
          <select value={searchCategory} onChange={(e) => setSearchCategory(e.target.value)} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-0">
            <option value="all">Wszystkie kategorie</option>
            <option value="title">Tytuł</option>
            <option value="description">Opis</option>
            <option value="location">Lokalizacja</option>
          </select>
        </div>
      </div>

      <div className={`
        ${layoutType === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
        }
      `}>
        {filteredAndSortedTasks.map(task => (
          <div
            key={task.id}
            onClick={() => handleTaskClick(task.id)}
            className={`
              bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg 
              transition-all duration-200 cursor-pointer
              ${layoutType === 'grid' ? 'p-6' : 'p-4 flex items-center justify-between'}
            `}
          >
            <div className={layoutType === 'list' ? 'flex items-center space-x-4 flex-1' : ''}>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{task.title}</h3>
                {layoutType === 'grid' && (
                  <p className="text-gray-600 dark:text-gray-400 mt-2">{task.description?.slice(0, 100)}...</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    task.importance === 5 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : task.importance === 4
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : task.importance === 3
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : task.importance === 2
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {task.importance}
                  </span>
                  {task.deadline && (
                    <span className="px-2 py-1 rounded-full text-sm bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">{new Date(task.deadline).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              
              <div className="mt-4 flex items-center space-x-4">
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full"style={{ width: `${task.executionProgress}%` }}/>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{task.executionProgress}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
