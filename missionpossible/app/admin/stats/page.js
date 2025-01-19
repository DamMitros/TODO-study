"use client";

import { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

export default function AdminStatsPage() {
  const { user } = useUser();
  const [stats, setStats] = useState({
    recentLogins: [],
    taskActivity: [],
    projectActivity: [],
    userActivity: {
      totalActive: 0,
      lastWeekActive: 0
    }
  });

  useEffect(() => {
    if (!user?.isAdmin) return;

    const fetchStats = async () => {
      try {
        const usersQuery = query(
          collection(db, "users"),
          orderBy("lastLoginAt", "desc"),
          limit(10)
        );
        const usersSnapshot = await getDocs(usersQuery);
        const recentLogins = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          email: doc.data().email,
          lastLoginAt: doc.data().lastLoginAt?.toDate()
        }));

        const tasksQuery = query(
          collection(db, "tasks"),
          orderBy("updatedAt", "desc"),
          limit(10)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const taskActivity = tasksSnapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title,
          action: doc.data().completed ? "ukończone" : "zaktualizowane",
          timestamp: doc.data().updatedAt,
          userId: doc.data().userId
        }));

        const projectsQuery = query(
          collection(db, "projects"),
          orderBy("updatedAt", "desc"),
          limit(10)
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectActivity = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          action: "zaktualizowany",
          timestamp: doc.data().updatedAt,
          userId: doc.data().createdBy
        }));

        const lastWeekDate = new Date();
        lastWeekDate.setDate(lastWeekDate.getDate() - 7);
        
        const activeUsersQuery = query(
          collection(db, "users"),
          where("lastLoginAt", ">=", lastWeekDate.toISOString())
        );
        const activeUsersSnapshot = await getDocs(activeUsersQuery);

        setStats({
          recentLogins,
          taskActivity,
          projectActivity,
          userActivity: {
            totalActive: usersSnapshot.size,
            lastWeekActive: activeUsersSnapshot.size
          }
        });
      } catch (error) {
        console.error("Błąd podczas pobierania statystyk:", error);
      }
    };

    fetchStats();
  }, [user]);

  if (!user?.isAdmin) {
    return <p>Odmowa dostępu. Wymagane uprawnienia administratora.</p>;
  }

  return (
    <div>
      <h2>Statystyki Aktywności</h2>

      <div>
        <div>
          <h3>Aktywność Użytkowników</h3>
          <p>Aktywni użytkownicy (ogółem): {stats.userActivity.totalActive}</p>
          <p>Aktywni w ostatnim tygodniu: {stats.userActivity.lastWeekActive}</p>
          
          <h4>Ostatnie logowania:</h4>
          <ul>
            {stats.recentLogins.map(login => (
              <li key={login.id}>
                {login.email} - {login.lastLoginAt ? new Date(login.lastLoginAt).toLocaleString() : 'Nigdy'}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3>Aktywność Zadań</h3>
          <ul>
            {stats.taskActivity.map(activity => (
              <li key={activity.id}>
                {activity.title} - {activity.action} ({new Date(activity.timestamp).toLocaleString()})
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3>Aktywność Projektów</h3>
          <ul>
            {stats.projectActivity.map(activity => (
              <li key={activity.id}>
                {activity.name} - {activity.action} ({new Date(activity.timestamp).toLocaleString()})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}