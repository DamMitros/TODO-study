"use client";

import { useState } from 'react';
import { useProjects } from '../context/ProjectContext';
import { useUser } from '../context/UserContext';

export default function ProjectForm({ onProjectCreated }) {
  const { addProject } = useProjects();
  const { user } = useUser();
  const [projectName, setProjectName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const handleCreateProject = async (e) => {
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
  };

  const handleAddMember = () => {
    if (memberEmail && !members.includes(memberEmail)) {
      setMembers([...members, memberEmail]);
      setMemberEmail('');
    }
  };

  const handleRemoveMember = (emailToRemove) => {
    setMembers(members.filter(email => email !== emailToRemove));
  };

  return (
    <div>
      <h2>Nowy Projekt</h2>
      {error && <p>{error}</p>}
      
      <form onSubmit={handleCreateProject}>
        <div>
          <input
            type="text"
            placeholder="Nazwa projektu"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </div>
        
        <div>
          <input
            type="email"
            placeholder="Email członka zespołu"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
          />
          <button type="button" onClick={handleAddMember}>Dodaj członka</button>
        </div>

        {members.length > 0 && (
          <div>
            <h3>Członkowie projektu:</h3>
            <div>
              {members.map((email, index) => (
                <div key={index}>
                  <span>{email}</span>
                  <button type="button" onClick={() => handleRemoveMember(email)}>Usuń</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button type="submit">Utwórz projekt</button>
      </form>
    </div>
  );
}