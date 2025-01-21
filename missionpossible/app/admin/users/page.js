"use client";

import { useUser } from "../../context/UserContext";
import { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc, addDoc, query, where, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import ConfirmDialog from "../../components/ConfirmDialogs";

export default function AdminUsersPage() {
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
        console.error("Błąd podczas pobierania użytkowników:", error);
        setError("Nie udało się załadować danych użytkowników");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

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
      console.error("Błąd podczas zmiany statusu administratora:", error);
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

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <h2>Zarządzanie użytkownikami</h2>
      
      <div>
        <input
          type="text"
          placeholder="Szukaj użytkowników..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Status</th>
              <th>Zadania</th>
              <th>Projekty</th>
              <th>Ostatnie logowanie</th>
              <th>Utworzono</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>
                  <span>{u.isAdmin ? "Administrator" : "Użytkownik"}</span>
                  {u.isBanned && <span>(Zablokowany)</span>}
                </td>
                <td>
                  <a href={`/admin/users/${u.id}/tasks`}>{u.tasksCount || 0}</a>
                </td>
                <td>
                  <a href={`/admin/users/${u.id}/projects`}>{u.projectsCount || 0}</a>
                </td>
                <td>
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Nigdy"}
                </td>
                <td>
                  {u.createdAt ? new Date(u.createdAt).toLocaleString() : "N/A"}
                </td>
                <td>
                  <button onClick={() => toggleAdminStatus(u.email, u.isAdmin)}>
                    {u.isAdmin ? "Usuń Admina" : "Nadaj Admina"}
                  </button>
                  <button onClick={() => toggleUserBan(u.id, u.isBanned)}>
                    {u.isBanned ? "Odblokuj" : "Zablokuj"}
                  </button>
                  <button onClick={() => deleteUser(u.id)}>Usuń Użytkownika</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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