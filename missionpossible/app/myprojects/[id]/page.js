"use client";

import { useParams, useRouter } from 'next/navigation';
import { useProjects } from '../../context/ProjectContext';
import { useUser } from '../../context/UserContext';
import { useTasks } from '../../context/TaskContext';
import { useState, useEffect } from 'react';
import { NoteProvider } from '../../context/NoteContext';
import PersonalNotes from '../../components/PersonalNotes';

export default function ProjectDetailPage() {
  const { projects } = useProjects();
  const { getAllTasks } = useTasks();
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const [project, setProject] = useState(null);
  const [projectTasks, setProjectTasks] = useState([]);

  useEffect(() => {
    if (!user) {
      router.push('/login'); 
      return;
    }

    if (!params.id) return;

    const foundProject = projects.find(p => p.id === params.id);
    if (!foundProject) {
      router.push('/myprojects');
      return;
    }

    if (foundProject.createdBy !== user.uid && 
        !foundProject.members?.includes(user.email) && 
        !user.isAdmin) {
      router.push('/myprojects');
      return;
    }

    setProject(foundProject);
    const tasks = getAllTasks().filter(task => task.projectId === params.id);
    setProjectTasks(tasks);
  }, [params.id, projects, user, getAllTasks, router]);

  if (!user) {
    return <div>Przekierowanie do strony logowania...</div>;
  }

  if (!project) {
    return <div>Ładowanie projektu...</div>;
  }

  const completedTasks = projectTasks.filter(task => task.completed);
  const completionRate = projectTasks.length > 0 
    ? Math.round((completedTasks.length / projectTasks.length) * 100) 
    : 0;

  const isOwner = project.members?.find(m => m === user?.email) === user?.email;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
        {project.name}
      </h1>
      
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Informacje o projekcie</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Data utworzenia</p>
            <p className="text-lg font-medium">{new Date(project.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Właściciel</p>
            <p className="text-lg font-medium">{isOwner ? 'Ty' : project.createdBy}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Postęp projektu</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300" style={{ width: `${completionRate}%` }}/>
              </div>
              <span className="text-lg font-medium">{completionRate}%</span>
            </div>
          </div>
        </div>

        {(project.createdBy === user.uid || user.isAdmin) && (
          <button onClick={() => router.push(`/myprojects/${project.id}/edit`)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"> Edytuj projekt</button>
        )}
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Członkowie ({project.members.length})</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {project.members.map((member, index) => (
            <li key={index} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <span className="flex-1 text-gray-700 dark:text-gray-300">{member}</span>
              {member === user.email && (
                <span className="px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full">Ty</span>
              )}
              {project.createdBy === member && (
                <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">Właściciel</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Zadania ({projectTasks.length})</h2>
          <div className="flex gap-4 text-sm">
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">Ukończone: {completedTasks.length}</span>
            <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-full">W toku: {projectTasks.length - completedTasks.length}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectTasks.map(task => (
            <div key={task.id} onClick={() => router.push(`/tasks/${task.id}`)} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg cursor-pointer hover:shadow-md transition-all duration-200" >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{task.title} </h3>
              <div className="space-y-2">
                <p className="text-sm">
                  Status: 
                  <span className={`ml-2 px-2 py-1 rounded-full ${
                    task.completed 
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                  }`}>
                    {task.completed ? 'Ukończone' : 'W toku'}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 dark:bg-indigo-500" style={{ width: `${task.executionProgress}%` }}/>
                  </div>
                  <span className="text-sm font-medium">{task.executionProgress}%</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Termin: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Brak'}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
        <NoteProvider>
          <PersonalNotes entityId={project.id} entityType="project" />
        </NoteProvider>
      </section>
    </div>
  );
}