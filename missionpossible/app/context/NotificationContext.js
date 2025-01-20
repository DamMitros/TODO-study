"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useUser } from './UserContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.email),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp
      }));
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user]);

  const getNotificationColor = (type, priority) => {
    switch (type) {
      case 'deadline':
        return 'red';
      case 'task':
        return priority === 'high' ? 'orange' : 'blue';
      case 'project':
        return 'green';
      default:
        return 'gray';
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error("Error zaznaczając jako przeczytane:", error);
    }
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      markAsRead,
      getNotificationColor
    }}>
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