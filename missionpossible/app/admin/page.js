"use client";
import { useState, useEffect } from 'react';
import { useUser } from "../context/UserContext";
import { collection, query, getDocs, doc, updateDoc, deleteDoc, addDoc, where } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useRouter } from "next/navigation";

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
    if (window.confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
      try {
        await deleteDoc(doc(db, "users", userId));
        setUsers(users.filter(u => u.id !== userId));
      } catch (error) {
        console.error("Błąd podczas usuwania użytkownika:", error);
      }
    }
  };

  if (!user?.isAdmin) {
    return <p>Odmowa dostępu. Wymagane uprawnienia administratora.</p>;
  }

  return (
    <div>
      <h2>Panel Administratora</h2>
      
      <div>
        <h3>Statystyki Systemu</h3>
        <div>Łączna liczba użytkowników: {stats.totalUsers}</div>
        <div>Łączna liczba zadań: {stats.totalTasks}</div>
        <div>Łączna liczba projektów: {stats.totalProjects}</div>
      </div>

      <div>
        <h3>Zarządzanie Użytkownikami</h3>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Status</th>
              <th>Zadania</th>
              <th>Projekty</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.isAdmin ? 'Administrator' : 'Użytkownik'}</td>
                <td>{u.tasksCount || 0}</td>
                <td>{u.projectsCount || 0}</td>
                <td>
                  <button onClick={() => toggleAdminStatus(u.email, u.isAdmin)}>
                    {u.isAdmin ? 'Usuń Administratora' : 'Nadaj Administratora'}
                  </button>
                  <button onClick={() => deleteUser(u.id)}>Usuń Użytkownika</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}