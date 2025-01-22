"use client";

import { useState, useCallback, useEffect } from 'react';
import { useProjects } from '../context/ProjectContext';
import { useUser } from '../context/UserContext';
import ProjectForm from '../components/ProjectForm';
import { useRouter } from 'next/navigation';
import ConfirmDialog from "../components/ConfirmDialogs";

export default function ProjectsPage() {
  const { projects, deleteProject, leaveProject } = useProjects();
  const { user } = useUser();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [layoutType, setLayoutType] = useState(() => 
    localStorage.getItem('projectLayoutPreference') || 'grid'
  );
  const [isClient, setIsClient] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: '',
    onConfirm: null
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('projectLayoutPreference', layoutType);
  }, [layoutType]);

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-4"> Musisz się zalogować, aby zobaczyć projekty.</p>
        <button onClick={() => router.push("/login")} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"> Przejdź do logowania </button>
      </div>
    );
  }

  const userProjects = projects.filter(project => 
    project.createdBy === user.uid || 
    (project.members && project.members.includes(user.email))
  );

  const filteredProjects = userProjects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.members && project.members.some(member => 
      member.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  const handleDeleteProject = (projectId) => {
    setConfirmDialog({
      isOpen: true,
      message: 'Czy na pewno chcesz usunąć ten projekt?',
      onConfirm: () => {
        deleteProject(projectId);
        setConfirmDialog({ isOpen: false, message: '', onConfirm: null });
      }
    });
  };

  const handleLeaveProject = (projectId) => {
    setConfirmDialog({
      isOpen: true,
      message: 'Czy na pewno chcesz opuścić ten projekt?',
      onConfirm: () => {
        leaveProject(projectId);
        setConfirmDialog({ isOpen: false, message: '', onConfirm: null });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
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
            <input
              type="text"
              className="w-full sm:w-64 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500"
              placeholder="Wyszukaj projekty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button onClick={() => setShowCreateForm(!showCreateForm)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200">{showCreateForm ? 'Zamknij formularz' : 'Nowy Projekt'}</button>
          </div>
        </div>

        {showCreateForm && (
          <div className="mb-6">
            <ProjectForm onProjectCreated={() => setShowCreateForm(false)} />
          </div>
        )}

        <div className={`
          ${layoutType === 'grid' 
            ? 'grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'space-y-4'
          }
        `}>
          {filteredProjects.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 col-span-full text-center py-4"> Nie znaleziono projektów </p>
          ) : (
            filteredProjects.map(project => (
              <div 
                key={project.id} 
                className={`
                  bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200
                  ${layoutType === 'grid' ? 'p-6' : 'p-4 flex items-center justify-between'}
                `}
              >
                <div className={`${layoutType === 'list' ? 'flex-1 flex items-center gap-4' : ''}`}>
                  <div className={`${layoutType === 'list' ? 'flex-1' : ''}`}>
                    <h3 onClick={() => router.push(`/myprojects/${project.id}`)}className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 mb-2 cursor-pointer hover:text-indigo-700">{project.name}</h3>
                    <div className={`${layoutType === 'list' ? 'flex gap-4 items-center' : ''}`}>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Data utworzenia: {new Date(project.createdAt).toLocaleDateString()}</p>
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Członkowie:</h4>
                        <ul className="space-y-1">
                          {project.members.map((member, index) => (
                            <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                              {member}
                              {member === user.email && " (Ty)"}
                              {project.createdBy === user.uid && member === user.email && " (Właściciel)"}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className={`${layoutType === 'list' ? 'flex gap-2' : 'mt-4'}`}>
                    {project.createdBy === user.uid ? (
                      <button onClick={() => handleDeleteProject(project.id)} className="w-full px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200">Usuń projekt</button>
                    ) : (
                      <button onClick={() => handleLeaveProject(project.id)} className="w-full px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200">Opuść projekt</button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, message: '', onConfirm: null })}
      />
    </div>
  );
}