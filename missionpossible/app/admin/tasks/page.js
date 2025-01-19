"use client";

import { useTasks } from "../../context/TaskContext";
import { useUser } from "../../context/UserContext";
import { useState, useEffect } from "react";
import { useProjects } from "../../context/ProjectContext";

export default function AdminTasksPage() {
  const { getAllTasks } = useTasks(); 
  const { user } = useUser();
  const { projects } = useProjects();
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");

  useEffect(() => {
    if (!user?.isAdmin) return;
    
    const allTasks = getAllTasks(); 
    const filtered = allTasks.filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "createdAt":
          return sortDirection === "asc" 
            ? new Date(a.createdAt) - new Date(b.createdAt)
            : new Date(b.createdAt) - new Date(a.createdAt);
        case "importance":
          return sortDirection === "asc"
            ? a.importance - b.importance
            : b.importance - a.importance;
        case "progress":
          return sortDirection === "asc"
            ? a.executionProgress - b.executionProgress
            : b.executionProgress - a.executionProgress;
        default:
          return 0;
      }
    });

    setFilteredTasks(sorted);
  }, [getAllTasks(), searchTerm, user, sortBy, sortDirection]);

  if (!user?.isAdmin) {
    return <p>Odmowa dostępu. Wymagane uprawnienia administratora.</p>;
  }

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : "Brak projektu";
  };

  return (
    <div>
      <h2>Zarządzanie Zadaniami</h2>
      
      <div>
        <input
          type="text"
          placeholder="Wyszukaj zadania..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="createdAt">Data utworzenia</option>
          <option value="importance">Priorytet</option>
          <option value="progress">Postęp</option>
        </select>

        <button onClick={() => setSortDirection(prev => prev === "asc" ? "desc" : "asc")}>
          {sortDirection === "asc" ? "↑" : "↓"}
        </button>
      </div>

      <div>
        <table>
          <thead>
            <tr>
              <th>Tytuł</th>
              <th>Właściciel</th>
              <th>Status</th>
              <th>Priorytet</th>
              <th>Postęp</th>
              <th>Projekt</th>
              <th>Termin</th>
              <th>Data utworzenia</th>
              <th>Ostatnia aktualizacja</th>
              <th>Udostępniono dla</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map(task => (
              <tr key={task.id}>
                <td>{task.title}</td>
                <td>{task.userId}</td>
                <td>
                  {task.completed ? (
                    <span>Wykonane</span>
                  ) : (
                    <span>W toku</span>
                  )}
                </td>
                <td>{task.importance}/5</td>
                <td>{task.executionProgress}%</td>
                <td>{getProjectName(task.projectId)}</td>
                <td>{task.deadline || "Brak"}</td>
                <td>
                  {new Date(task.createdAt).toLocaleString()}
                </td>
                <td>
                  {task.updatedAt ? new Date(task.updatedAt).toLocaleString() : "-"}
                </td>
                <td>
                  {task.sharedWith?.length || 0} użytkowników
                </td>
                <td>
                  <button onClick={() => window.location.href = `/tasks/${task.id}`}>Szczegóły</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}