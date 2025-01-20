"use client";

import { useParams, useRouter } from 'next/navigation';
import { useProjects } from '../../../context/ProjectContext';
import { useUser } from '../../../context/UserContext';
import { useState, useEffect } from 'react';

export default function EditProjectPage() {
  const { projects, updateProject } = useProjects();
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const [project, setProject] = useState(null);
  const [name, setName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !params.id) return;

    const foundProject = projects.find(p => p.id === params.id);
    if (!foundProject) {
      router.push('/myprojects');
      return;
    }

    if (foundProject.createdBy !== user.uid && !user.isAdmin) {
      router.push('/myprojects');
      return;
    }

    setProject(foundProject);
    setName(foundProject.name);
  }, [params.id, projects, user, router]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nazwa projektu jest wymagana');
      return;
    }

    try {
      await updateProject(project.id, {
        ...project,
        name: name.trim(),
        updatedAt: new Date().toISOString()
      });
      router.push(`/myprojects/${project.id}`);
    } catch (error) {
      setError('Wystąpił błąd podczas aktualizacji projektu');
      console.error('Error aktualizując projekt:', error);
    }
  };

  const handleAddMember = async () => {
    if (!memberEmail.trim() || project.members.includes(memberEmail)) {
      return;
    }

    try {
      await updateProject(project.id, {
        ...project,
        members: [...project.members, memberEmail],
        updatedAt: new Date().toISOString()
      });
      setMemberEmail('');
      setProject({
        ...project,
        members: [...project.members, memberEmail]
      });
    } catch (error) {
      setError('Błąd podczas dodawania członka');
      console.error('Error dodając członka:', error);
    }
  };

  const handleRemoveMember = async (emailToRemove) => {
    if (emailToRemove === project.createdBy || emailToRemove === user.email) {
      setError('Nie można usunąć właściciela projektu ani siebie');
      return;
    }

    try {
      await updateProject(project.id, {
        ...project,
        members: project.members.filter(email => email !== emailToRemove),
        updatedAt: new Date().toISOString()
      });
      setProject({
        ...project,
        members: project.members.filter(email => email !== emailToRemove)
      });
    } catch (error) {
      setError('Błąd podczas usuwania członka');
      console.error('Error usuwając członka:', error);
    }
  };

  if (!project) {
    return <div>Ładowanie projektu...</div>;
  }

  return (
    <div>
      <h1>Edycja projektu</h1>
      {error && <p>{error}</p>}

      <form onSubmit={handleUpdate}>
        <div>
          <label>Nazwa projektu:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nazwa projektu"
          />
        </div>

        <button type="submit">Zapisz zmiany</button>
        <button type="button" onClick={() => router.push(`/myprojects/${project.id}`)}>
          Anuluj
        </button>
      </form>

      <div>
        <h2>Zarządzanie członkami</h2>
        <div>
          <input
            type="email"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            placeholder="Email nowego członka"
          />
          <button type="button" onClick={handleAddMember}>Dodaj członka</button>
        </div>

        <h3>Obecni członkowie:</h3>
        <ul>
          {project.members.map((member, index) => (
            <li key={index}>
              {member}
              {member === project.createdBy && " (Właściciel)"}
              {member === user.email && " (Ty)"}
              {member !== project.createdBy && member !== user.email && (
                <button onClick={() => handleRemoveMember(member)}>Usuń</button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}