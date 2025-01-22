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
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center text-indigo-600 dark:text-indigo-400">Edycja projektu</h1>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 p-4 rounded-lg">{error}</div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="space-y-2">
            <label className="text-gray-700 dark:text-gray-300 font-medium"> Nazwa projektu: </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nazwa projektu"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-4">
            <button type="submit" className="flex-1 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200">Zapisz zmiany </button>
            <button type="button" onClick={() => router.push(`/myprojects/${project.id}`)} className="px-6 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"> Anuluj</button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Zarządzanie członkami</h2>
        
        <div className="flex gap-4">
          <input
            type="email"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            placeholder="Email nowego członka"
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500"
          />
          <button type="button" onClick={handleAddMember} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"> Dodaj członka </button>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Obecni członkowie:</h3>
          <ul className="space-y-2">
            {project.members.map((member, index) => (
              <li key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 dark:text-gray-300">{member}</span>
                  {member === project.createdBy && (
                    <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full"> Właściciel</span>
                  )}
                  {member === user.email && (
                    <span className="px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full">Ty</span>
                  )}
                </div>
                {member !== project.createdBy && member !== user.email && (
                  <button onClick={() => handleRemoveMember(member)} className="px-3 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200">Usuń</button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}