"use client";

import { useState, useCallback } from 'react';
import { useProjects } from '../context/ProjectContext';
import { useUser } from '../context/UserContext';

export default function ProjectForm({ onProjectCreated }) {
  const { addProject } = useProjects();
  const { user } = useUser();
  const [projectName, setProjectName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');

  const handleCreateProject = useCallback(async (e) => {
    e.preventDefault();
    if (!projectName) {
      setError('Nazwa projektu jest wymagana');
      return;
    }

    try {
      const newProject = {
        name: projectName,
        createdBy: user.uid,
        members: [...members, user.email],
        createdAt: new Date().toISOString()
      };

      await addProject(newProject);
      setProjectName('');
      setMembers([]);
      setError('');
      if (onProjectCreated) {
        onProjectCreated();
      }
    } catch (error) {
      setError('Błąd podczas tworzenia projektu: ' + error.message);
    }
  }, [projectName, members, user, addProject, onProjectCreated]);

  const handleAddMember = useCallback(() => {
    if (memberEmail && !members.includes(memberEmail)) {
      setMembers([...members, memberEmail]);
      setMemberEmail('');
    }
  }, [memberEmail, members]);

  const handleRemoveMember = useCallback((emailToRemove) => {
    setMembers(members.filter(email => email !== emailToRemove));
  }, [members]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6"> Nowy Projekt</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-lg">{error}</div>
      )}
      
      <form onSubmit={handleCreateProject} className="space-y-6">
        <div>
          <input
            type="text"
            placeholder="Nazwa projektu"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all duration-200"
          />
        </div>
        
        <div className="flex gap-4">
          <input
            type="email"
            placeholder="Email członka zespołu"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            className="flex-1 px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all duration-200"
          />
          <button type="button"  onClick={handleAddMember} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200"> Dodaj członka</button>
        </div>

        {members.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Członkowie projektu:</h3>
            <div className="flex flex-wrap gap-2">
              {members.map((email, index) => (
                <div key={index} className="flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900 rounded-full">
                  <span className="text-sm text-indigo-800 dark:text-indigo-200">{email}</span>
                  <button type="button" onClick={() => handleRemoveMember(email)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200">×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4">
          <button type="submit" className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl">Utwórz projekt</button>
        </div>
      </form>
    </div>
  );
}