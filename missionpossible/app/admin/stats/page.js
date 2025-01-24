"use client";

import { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
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
        const notificationsQuery = query(
          collection(db, "notifications"),
          orderBy("timestamp", "desc"),
          // limit(100)
        );
        
        const notificationsSnapshot = await getDocs(notificationsQuery);
        const notifications = notificationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const uniqueNotifications = notifications.reduce((acc, notification) => {
          const key = `${notification.type}-${notification.title}-${notification.timestamp}`;
          if (!acc[key]) {
            acc[key] = notification;
          }
          return acc;
        }, {});

        const uniqueNotificationsArray = Object.values(uniqueNotifications);
        const taskActivity = uniqueNotificationsArray
          .filter(notif => notif.type === 'task')
          .map(notif => ({
            id: notif.taskId,
            notificationId: notif.id, 
            title: notif.title,
            action: notif.message,
            timestamp: notif.timestamp,
            userId: notif.userId,
            type: notif.priority
          }))
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const projectActivity = uniqueNotificationsArray
          .filter(notif => notif.type === 'project')
          .map(notif => ({
            id: notif.projectId,
            notificationId: notif.id, 
            name: notif.title,
            action: notif.message,
            timestamp: notif.timestamp,
            userId: notif.userId,
            type: notif.priority
          }))
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const usersQuery = query(
          collection(db, "users"),
          orderBy("lastLoginAt", "desc"),
          limit(10)
        );
        const usersSnapshot = await getDocs(usersQuery);
        const recentLogins = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          email: doc.data().email,
          lastLoginAt: doc.data().lastLoginAt?.toDate()?.toISOString()
        }));

        const lastWeekDate = new Date();
        lastWeekDate.setDate(lastWeekDate.getDate() - 7);
        
        const activeUsers = usersSnapshot.docs.filter(doc => {
          const lastLogin = doc.data().lastLoginAt?.toDate();
          return lastLogin && lastLogin > lastWeekDate;
        });

        setStats({
          recentLogins,
          taskActivity,
          projectActivity,
          userActivity: {
            totalActive: usersSnapshot.size,
            lastWeekActive: activeUsers.length
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
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">Statystyki Aktywności</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-white mb-2">Aktywni użytkownicy (ogółem)</h3>
          <p className="text-4xl font-bold text-white">{stats.userActivity.totalActive}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-white mb-2">Aktywni w ostatnim tygodniu</h3>
          <p className="text-4xl font-bold text-white">{stats.userActivity.lastWeekActive}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Ostatnie logowania</h3>
          <div className="overflow-y-auto max-h-[400px]">
            <ul className="space-y-3">
              {stats.recentLogins.map(login => (
                <li key={login.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all rounded-lg">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{login.email}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{login.lastLoginAt ? new Date(login.lastLoginAt).toLocaleString() : 'Nigdy'}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Aktywność Zadań</h3>
          <div className="overflow-y-auto max-h-[400px] space-y-4">
            <ul className="space-y-3">
              {stats.taskActivity.map(activity => (
                <li key={`${activity.notificationId}-${activity.timestamp}`} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className='pr-3'>{activity.title} - {activity.action}</span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">Wykonawca: {activity.userId}</span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(activity.timestamp).toLocaleString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Aktywność Projektów</h3>
          <div className="overflow-y-auto max-h-[400px] space-y-4">
            <ul className="space-y-3">
              {stats.projectActivity.map(activity => (
                <li key={`${activity.notificationId}-${activity.timestamp}`} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span>{activity.name} - {activity.action}</span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">Właściciel: {activity.userId}</span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(activity.timestamp).toLocaleString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}