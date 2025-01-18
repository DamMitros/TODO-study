"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useUser } from './UserContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    if (!user?.email) return;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.email),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(newNotifications);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Error czytając powiadomienie(ustawienie na przeczytanie):', error);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, isLoading, markAsRead }}>
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

const createTaskNotification = async (userContext, affectedUserEmail, taskTitle, action) => {
  if (!userContext?.user) return;
  if (userContext.user.email === affectedUserEmail) return;

  const messages = {
    created: `Zostałeś dodany do nowego zadania: ${taskTitle}`,
    updated: `Zadanie "${taskTitle}" zostało zaktualizowane`,
    deleted: `Zadanie "${taskTitle}" zostało usunięte`,
    left: `Użytkownik ${userContext.user.email} opuścił zadanie "${taskTitle}"`,
    shared: `Zadanie "${taskTitle}" zostało udostępnione użytkownikowi ${affectedUserEmail}`,
  };

  await addDoc(collection(db, 'notifications'), {
    userId: userContext.user.uid,
    timestamp: new Date().toISOString(),
    read: false,
    type: 'task',
    title: `Zmiana w zadaniu: ${taskTitle}`,
    message: messages[action],
    taskId: taskId
  });
};

const createProjectNotification = async (userContext, affectedUserEmail, projectName, action) => {
  if (!userContext?.user) return;
  
  if (userContext.user.email === affectedUserEmail) return;

  const messages = {
    created: `Zostałeś dodany do nowego projektu: ${projectName}`,
    updated: `Projekt "${projectName}" został zaktualizowany`,
    deleted: `Projekt "${projectName}" został usunięty`,
  };

  await addDoc(collection(db, 'notifications'), {
    userId: userContext.user.uid,
    timestamp: new Date().toISOString(),
    read: false,
    type: 'project',
    title: `Zmiana w projekcie: ${projectName}`,
    message: messages[action],
    projectId: projectId
  });
};