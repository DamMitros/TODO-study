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
    <div>
      <h1>{project.name}</h1>
      
      <section>
        <h2>Informacje o projekcie</h2>
        <p>Data utworzenia: {new Date(project.createdAt).toLocaleDateString()}</p>
        <p>Właściciel: {isOwner ? 'Ty' : project.createdBy}</p>
        <p>Postęp: {completionRate}% ukończonych zadań</p>
        
        {(project.createdBy === user.uid || user.isAdmin) && (
          <button onClick={() => router.push(`/myprojects/${project.id}/edit`)}>Edytuj projekt</button>
        )}
      </section>

      <section>
        <h2>Członkowie ({project.members.length})</h2>
        <ul>
          {project.members.map((member, index) => (
            <li key={index}>
              {member}
              {member === user.email && " (Ty)"}
              {project.createdBy === member && " (Właściciel)"}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Zadania ({projectTasks.length})</h2>
        <div>
          <p>Ukończone: {completedTasks.length}</p>
          <p>W toku: {projectTasks.length - completedTasks.length}</p>
        </div>
        
        <div>
          {projectTasks.map(task => (
            <div key={task.id} onClick={() => router.push(`/tasks/${task.id}`)}>
              <h3>{task.title}</h3>
              <p>Status: {task.completed ? 'Ukończone' : 'W toku'}</p>
              <p>Postęp: {task.executionProgress}%</p>
              <p>Termin: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Brak'}</p>
            </div>
          ))}
        </div>
      </section>

      <NoteProvider>
        <PersonalNotes entityId={project.id} entityType="project" />
      </NoteProvider>
    </div>
  );
}