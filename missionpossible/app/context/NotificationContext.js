"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy, addDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useUser } from './UserContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "tasks"),
      where("userId", "==", user.uid)
    );

    const checkDeadlines = async (tasks) => {
      const now = new Date();
      tasks.forEach(async task => {
        if (!task.deadline || task.deadlineNotified) return;

        const deadline = new Date(task.deadline);
        const timeDiff = deadline.getTime() - now.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (daysDiff <= 3) {
          try {
            const recipientEmails = new Set(task.sharedWith || []);
            const userDoc = await getDoc(doc(db, "users", task.userId));
            if (userDoc.exists()) {
              recipientEmails.add(userDoc.data().email);
            }

            const message = daysDiff <= 0 
              ? `Termin zadania "${task.title}" minął ${Math.abs(daysDiff)} dni temu`
              : `Zadanie "${task.title}" kończy się za ${daysDiff} dni`;

            const notificationPromises = Array.from(recipientEmails).map(recipientEmail => {
              if (!recipientEmail) return null; 
              
              return addDoc(collection(db, 'notifications'), {
                userId: recipientEmail, 
                taskId: task.id,
                type: 'deadline',
                title: daysDiff <= 0 ? `Przekroczony termin: ${task.title}` : `Zbliżający się termin: ${task.title}`,
                message: message,
                priority: 'high',
                timestamp: new Date().toISOString(),
                read: false
              });
            });

            await Promise.all(notificationPromises.filter(Boolean));
            const taskRef = doc(db, "tasks", task.id);
            await updateDoc(taskRef, {
              deadlineNotified: true
            });
          } catch (error) {
            console.error('Błąd wysyłania powiadomień o terminie:', error);
          }
        }
      });
    };

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      checkDeadlines(tasks);
    });

    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.email),
      orderBy("timestamp", "desc")
    );

    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(notificationsData);
    });

    return () => {
      unsubscribe();
      unsubscribeNotifications();
    };
  }, [user]);

  const addNotification = async (notification) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notification,
        userId: notification.userId, 
        timestamp: new Date().toISOString(),
        read: false
      });
    } catch (error) {
      console.error('Error dodając powiadomienie:', error);
      throw error;
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
    } catch (error) {
      console.error("Error zaznaczając jako przeczytane:", error);
    }
  };

  const getNotificationColor = (type, priority) => {
    switch (type) {
      case 'deadline': return '#ff4444';
      case 'project': return '#33b5e5';
      case 'task': return '#00C851';
      case 'comment': return '#ffbb33';
      case 'backup': return '#9933CC';
      default: return priority === 'high' ? '#ff4444' : '#2BBBAD';
    }
  };

  const contextValue = {
    notifications,
    addNotification,
    markAsRead,
    getNotificationColor
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications musi być używane w ramach NotificationProvider');
  }
  return context;
};