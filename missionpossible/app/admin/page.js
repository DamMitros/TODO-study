"use client";
import { useState, useEffect } from 'react';
import { useUser } from "../context/UserContext";
import { collection, query, getDocs, doc, deleteDoc, addDoc, where } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useRouter } from "next/navigation";
import ConfirmDialog from "../components/ConfirmDialogs";

export default function AdminPanel() {
  const { user } = useUser();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTasks: 0,
    totalProjects: 0,
  });

  useEffect(() => {
    if (!user?.isAdmin) {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        const usersQuery = query(collection(db, "users"));
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const adminSnapshot = await getDocs(collection(db, "admin"));
        const adminEmails = new Set(adminSnapshot.docs.map(doc => doc.data().email));

        const usersWithAdmin = usersData.map(user => ({
          ...user,
          isAdmin: adminEmails.has(user.email)
        }));

        setUsers(usersWithAdmin);
        
        const tasksSnapshot = await getDocs(collection(db, "tasks"));
        const projectsSnapshot = await getDocs(collection(db, "projects"));

        setStats({
          totalUsers: usersData.length,
          totalTasks: tasksSnapshot.size,
          totalProjects: projectsSnapshot.size,
        });
      } catch (error) {
        console.error("Błąd podczas pobierania danych:", error);
      }
    };

    fetchData();
  }, [user, router]);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: '',
    onConfirm: null
  });

  const toggleAdminStatus = async (userEmail, currentStatus) => {
    try {
      if (currentStatus) {
        const adminQuery = query(collection(db, "admin"), where("email", "==", userEmail));
        const adminSnapshot = await getDocs(adminQuery);
        if (!adminSnapshot.empty) {
          await deleteDoc(adminSnapshot.docs[0].ref);
        }
      } else {
        await addDoc(collection(db, "admin"), { email: userEmail });
      }
      
      setUsers(users.map(u => 
        u.email === userEmail ? {...u, isAdmin: !currentStatus} : u
      ));
    } catch (error) {
      console.error("Błąd podczas aktualizacji statusu administratora:", error);
    }
  };

  const deleteUser = async (userId) => {
    setConfirmDialog({
      isOpen: true,
      message: 'Czy na pewno chcesz usunąć tego użytkownika?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "users", userId));
          setUsers(prevUsers => {
            const updatedUsers = prevUsers.filter(u => u.id !== userId);
            setStats(prevStats => ({
              ...prevStats,
              totalUsers: updatedUsers.length
            }));
            return updatedUsers;
          });
          
        } catch (error) {
          console.error("Błąd podczas usuwania użytkownika:", error);
        }
        setConfirmDialog({ isOpen: false, message: '', onConfirm: null });
      }
    });
  };

  if (!user?.isAdmin) {
    return <p>Odmowa dostępu. Wymagane uprawnienia administratora.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div onClick={()=> router.push("/admin/users")} className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-white mb-2">Użytkownicy</h3>
          <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
        </div>
        <div onClick={()=> router.push("/admin/tasks")} className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-white mb-2">Zadania</h3>
          <p className="text-3xl font-bold text-white">{stats.totalTasks}</p>
        </div>
        <div onClick={()=> router.push("/admin/projects")} className="bg-gradient-to-br from-pink-500 to-pink-600 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-white mb-2">Projekty</h3>
          <p className="text-3xl font-bold text-white">{stats.totalProjects}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Zarządzanie Statusem Użytkowników</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-20 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Akcje</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-900 dark:text-gray-100">{u.email}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      u.isAdmin 
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {u.isAdmin ? 'Administrator' : 'Użytkownik'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => toggleAdminStatus(u.email, u.isAdmin)}
                        className="px-3 py-1 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 transition-colors"
                      >
                        {u.isAdmin ? 'Usuń Administratora' : 'Nadaj Administratora'}
                      </button>
                      <button onClick={() => deleteUser(u.id)} className="px-3 py-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 transition-colors">Usuń</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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