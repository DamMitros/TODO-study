"use client";

import { useParams } from 'next/navigation';
import { useProjects } from '../../../../context/ProjectContext';
import { useUser } from '../../../../context/UserContext';

export default function UserProjectsPage() {
  const { projects } = useProjects();
  const { user } = useUser();
  const params = useParams();
  const userId = params.id;

  if (!user?.isAdmin) {
    return <p>Odmowa dostępu. Wymagane uprawnienia administratora.</p>;
  }

  const userProjects = projects.filter(project => project.createdBy === userId);

  return (
    <div>
      <h2>Projekty użytkownika</h2>
      <div>
        {userProjects.map(project => (
          <div key={project.id}>
            <h3>{project.name}</h3>
            <p>Data utworzenia: {new Date(project.createdAt).toLocaleDateString()}</p>
            <p>Liczba członków: {project.members?.length || 0}</p>
            <a href={`/myprojects#${project.id}`}>Zobacz szczegóły</a>
          </div>
        ))}
      </div>
    </div>
  );
}