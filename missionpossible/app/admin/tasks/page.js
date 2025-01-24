"use client";

import { useTasks } from "../../context/TaskContext";
import { useUser } from "../../context/UserContext";
import { useState, useEffect } from "react";
import { useProjects } from "../../context/ProjectContext";
import { useRouter } from "next/navigation";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

export default function AdminTasksPage() {
  const { getAllTasksAdmin } = useTasks(); 
  const { user } = useUser();
  const { projects } = useProjects();
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const router = useRouter();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = usersSnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
      } catch (error) {
        console.error("Błąd pobierając użytkowników:", error);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchAndFilterTasks = async () => {
      if (!user?.isAdmin) return;
      
      try {
        const allTasks = await getAllTasksAdmin();
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
      } catch (error) {
        console.error("Błąd pobierając zadań:", error);
      }
    };

    fetchAndFilterTasks();
  }, [user, getAllTasksAdmin, searchTerm, sortBy, sortDirection]);

  if (!user?.isAdmin) {
    return <p>Odmowa dostępu. Wymagane uprawnienia administratora.</p>;
  }

  const getUserEmail = (userId) => {
    const user = users.find(u => u.uid === userId);
    return user ? user.email : "Nieznany";
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : "Brak projektu";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Zarządzanie Zadaniami</h2>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="text"
            placeholder="Wyszukaj zadania..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
          />
          
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-40 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
            <option value="createdAt">Utworzenie</option>
            <option value="importance">Priorytet</option>
            <option value="progress">Postęp</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="w-1/6 px-3 py-2 text-left text-xs font-medium text-gray-500">Tytuł</th>
                <th className="w-1/12 px-3 py-2 text-left text-xs font-medium text-gray-500">Właściciel</th>
                <th className="w-1/12 px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                <th className="w-1/12 px-3 py-2 text-left text-xs font-medium text-gray-500">Priorytet</th>
                <th className="w-1/12 px-3 py-2 text-left text-xs font-medium text-gray-500">Postęp</th>
                <th className="w-1/6 px-3 py-2 text-left text-xs font-medium text-gray-500">Projekt</th>
                <th className="w-1/12 px-3 py-2 text-left text-xs font-medium text-gray-500">Termin</th>
                <th className="w-1/12 px-3 py-2 text-left text-xs font-medium text-gray-500">Utworzono</th>
                <th className="w-1/12 px-10 py-2 text-right text-xs font-medium text-gray-500">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTasks.map(task => (
                <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 py-2 text-sm truncate">{task.title}</td>
                  <td className="px-3 py-2 text-sm truncate">{getUserEmail(task.userId)}</td>
                  <td className="px-3 py-2 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.completed 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {task.completed ? 'Wykonane' : 'W toku'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm">{task.importance}/5</td>
                  <td className="px-3 py-2 text-sm">{task.executionProgress}%</td>
                  <td className="px-3 py-2 text-sm truncate">{getProjectName(task.projectId)}</td>
                  <td className="px-2 py-2 text-sm truncate">{task.deadline || "Brak"}</td>
                  <td className="px-3 py-2 text-sm truncate">{new Date(task.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-sm text-right">
                    <button onClick={() => router.push(`/tasks/${task.id}`)} className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700">Szczegóły</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}