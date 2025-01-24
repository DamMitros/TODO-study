"use client";

import { useUser } from "../../context/UserContext";
import { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc, query, where, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import ConfirmDialog from "../../components/ConfirmDialogs";
import { useRouter} from 'next/navigation';

export default function AdminUsersPage() {
  const { user } = useUser();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: '',
    onConfirm: null
  });

  useEffect(() => {
    if (!user?.isAdmin) return;
    
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        const usersQuery = query(
          collection(db, "users"), 
          orderBy("createdAt", "desc")
        );
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate()?.toISOString(),
            lastLoginAt: data.lastLoginAt?.toDate()?.toISOString()
          };
        });

        const adminSnapshot = await getDocs(collection(db, "admin"));
        const adminEmails = new Set(adminSnapshot.docs.map(doc => doc.data().email));
        const updatedUsers = await Promise.all(usersData.map(async (userData) => {
          const [tasksSnapshot, projectsSnapshot] = await Promise.all([
            getDocs(query(collection(db, "tasks"), where("userId", "==", userData.uid))),
            getDocs(query(collection(db, "projects"), where("createdBy", "==", userData.uid)))
          ]);

          return {
            ...userData,
            isAdmin: adminEmails.has(userData.email),
            tasksCount: tasksSnapshot.size,
            projectsCount: projectsSnapshot.size
          };
        }));

        setUsers(updatedUsers);
      } catch (error) {
        setError("Nie udało się załadować danych użytkowników");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  useEffect(() => {
    if (!users) return;
    
    const filtered = users.filter(user => {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.email?.toLowerCase().includes(searchLower) ||
        user.displayName?.toLowerCase().includes(searchLower) ||
        user.uid?.toLowerCase().includes(searchLower)
      );
    });
    
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const deleteUser = async (userId) => {
    setConfirmDialog({
      isOpen: true,
      message: "Czy na pewno chcesz usunąć tego użytkownika?",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "users", userId));
          setUsers(users.filter(u => u.id !== userId));
        } catch (error) {
          console.error("Błąd podczas usuwania użytkownika:", error);
        }
        setConfirmDialog({ isOpen: false, message: '', onConfirm: null });
      }
    });
  };

  const toggleUserBan = async (userId, isBanned) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        isBanned: !isBanned
      });
      setUsers(users.map(u => 
        u.id === userId ? {...u, isBanned: !isBanned} : u
      ));
    } catch (error) {
      console.error("Błąd podczas zmiany statusu blokady użytkownika:", error);
    }
  };

  if (!user?.isAdmin) {
    return <p>Odmowa dostępu. Wymagane uprawnienia administratora.</p>;
  }

  if (loading) {
    return <p>Ładowanie użytkowników...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Zarządzanie Użytkownikami</h1>
        
        <input
          type="text"
          placeholder="Wyszukaj użytkowników..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-64 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : error ? (
          <div className="text-red-600 dark:text-red-400 text-center py-4">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Zadania</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Projekty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ostatnie logowanie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data utworzenia</th>
                  <th className="px-12 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Akcje</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        u.isAdmin 
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {u.isAdmin ? "Administrator" : "Użytkownik"}
                        {u.isBanned && " (Zablokowany)"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400" onClick={() => router.push(`/admin/users/${u.id}/tasks`)}>{u.tasksCount || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400" onClick={() => router.push(`/admin/users/${u.id}/projects`)}>{u.projectsCount || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Nigdy"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{u.createdAt ? new Date(u.createdAt).toLocaleString() : "N/A"}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm space-x-3">
                      <button onClick={() => toggleUserBan(u.id, u.isBanned)} className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-200">
                        {u.isBanned ? "Odblokuj" : "Zablokuj"}
                      </button>
                      <button onClick={() => deleteUser(u.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200">Usuń</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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