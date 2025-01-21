"use client";

import { useState } from 'react';
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
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: '',
    onConfirm: null
  });

  if (!user) {
    return <div>Musisz się zalogować, aby zobaczyć projekty.</div>;
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
      message: "Czy na pewno chcesz usunąć ten projekt?",
      onConfirm: async () => {
        try {
          await deleteProject(projectId);
        } catch (error) {
          console.error("Błąd podczas usuwania projektu:", error);
        }
        setConfirmDialog({ isOpen: false, message: '', onConfirm: null });
      }
    });
  };

  const handleLeaveProject = (projectId) => {
    setConfirmDialog({
      isOpen: true,
      message: "Czy na pewno chcesz opuścić ten projekt?",
      onConfirm: async () => {
        try {
          await leaveProject(projectId);
        } catch (error) {
          console.error("Błąd podczas opuszczania projektu:", error);
        }
        setConfirmDialog({ isOpen: false, message: '', onConfirm: null });
      }
    });
  };

  return (
    <div>
      <div>
        <div>
          <input
            type="text"
            placeholder="Wyszukaj projekty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Zamknij formularz' : 'Nowy Projekt'}
        </button>
      </div>

      {showCreateForm && (
        <div>
          <ProjectForm onProjectCreated={() => setShowCreateForm(false)} />
        </div>
      )}

      <div>
        {filteredProjects.length === 0 ? (
          <p>Nie znaleziono projektów</p>
        ) : (
          filteredProjects.map(project => (
            <div key={project.id}>
              <h3 onClick={() => router.push(`/myprojects/${project.id}`)}>
                {project.name}
              </h3>
              <p>Data utworzenia: {new Date(project.createdAt).toLocaleDateString()}</p>
              <div>
                <h4>Członkowie:</h4>
                <ul>
                  {project.members.map((member, index) => (
                    <li key={index}>
                      {member}
                      {member === user.email && " (Ty)"}
                      {project.createdBy === user.uid && member === user.email && " (Właściciel)"}
                    </li>
                  ))}
                </ul>
              </div>
              {project.createdBy === user.uid ? (
                <button onClick={() => handleDeleteProject(project.id)}>Usuń projekt</button>
              ) : (
                <button onClick={() => handleLeaveProject(project.id)}>Opuść projekt</button>
              )}
            </div>
          ))
        )}
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