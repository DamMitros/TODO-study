"use client";

import { useProjects } from "../../context/ProjectContext";
import { useUser } from "../../context/UserContext";
import { useState, useEffect } from "react";

export default function AdminProjectsPage() {
  const { projects, deleteProject } = useProjects();
  const { user } = useUser();
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user?.isAdmin) return;
    
    const filtered = projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProjects(filtered);
  }, [projects, searchTerm, user]);

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Czy na pewno chcesz usunąć ten projekt?")) return;
    
    try {
      await deleteProject(projectId);
    } catch (error) {
      console.error("Błąd podczas usuwania projektu:", error);
    }
  };

  if (!user?.isAdmin) {
    return <p>Odmowa dostępu. Wymagane uprawnienia administratora.</p>;
  }

  return (
    <div>
      <h2>Zarządzanie Projektami</h2>
      <input
        type="text"
        placeholder="Wyszukaj projekty..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <table>
        <thead>
          <tr>
            <th>Nazwa</th>
            <th>Właściciel</th>
            <th>Liczba członków</th>
            <th>Data utworzenia</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          {filteredProjects.map(project => (
            <tr key={project.id}>
              <td>{project.name}</td>
              <td>{project.createdBy}</td>
              <td>{project.members?.length || 0}</td>
              <td>{new Date(project.createdAt).toLocaleDateString()}</td>
              <td>
                <button onClick={() => handleDeleteProject(project.id)}> Usuń</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}