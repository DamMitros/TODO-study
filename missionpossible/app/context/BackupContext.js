"use client"
import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc, writeBatch, onSnapshot, orderBy } from 'firebase/firestore';
import { useUser } from './UserContext';

const BackupContext = createContext();

export function BackupProvider({ children }) {
  const [backups, setBackups] = useState([]);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'backups'),
        where('userId', '==', user.uid)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const backupData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBackups(backupData);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const createUserBackup = async () => {
    if (!user) return;

    const backup = {
      tasks: [],
      projects: [],
      notes: [],
      timestamp: new Date().toISOString()
    };

    const tasksSnapshot = await getDocs(
      query(collection(db, 'tasks'), 
      where('userId', '==', user.uid))
    );
    backup.tasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const projectsSnapshot = await getDocs(
      query(collection(db, 'projects'), 
      where('createdBy', '==', user.uid))
    );
    backup.projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const backupString = JSON.stringify(backup);
    const size = new Blob([backupString]).size;
    await addDoc(collection(db, 'backups'), {
      userId: user.uid,
      data: backup,
      createdAt: new Date().toISOString(),
      size: size
    });

    return backup;
  };

  const downloadBackup = (backup) => {
    const blob = new Blob([JSON.stringify(backup.data)], 
      { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-${backup.createdAt}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const createSystemBackup = async () => {
    try {
      const backup = {
        users: [],
        tasks: [],
        projects: [],
        timestamp: new Date().toISOString()
      };
  
      const [usersSnapshot, tasksSnapshot, projectsSnapshot] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'tasks')),
        getDocs(collection(db, 'projects'))
      ]);

      backup.users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      backup.tasks = tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      backup.projects = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      await addDoc(collection(db, 'systemBackups'), {
        data: backup,
        timestamp: backup.timestamp,
        size: new Blob([JSON.stringify(backup)]).size
      });

      return backup;
    } catch (error) {
      console.error('Error tworząć system-backup:', error);
      throw error;
    }
  };

  const restoreBackup = async (backup) => {
    if (!user || !backup) return;
    
    try {
      const batch = writeBatch(db);
      const tasksRef = collection(db, 'tasks');
      const userTasksQuery = query(tasksRef, where('userId', '==', user.uid));
      const existingTasks = await getDocs(userTasksQuery);
      existingTasks.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      backup.data.tasks.forEach(task => {
        const newTaskRef = doc(tasksRef);
        batch.set(newTaskRef, {
          ...task,
          userId: user.uid,
          updatedAt: new Date().toISOString()
        });
      });

      const projectsRef = collection(db, 'projects');
      const userProjectsQuery = query(projectsRef, where('createdBy', '==', user.uid));
      const existingProjects = await getDocs(userProjectsQuery);
      existingProjects.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      backup.data.projects.forEach(project => {
        const newProjectRef = doc(projectsRef);
        batch.set(newProjectRef, {
          ...project,
          createdBy: user.uid,
          updatedAt: new Date().toISOString()
        });
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Odzyskiwanie danych nieudane:', error);
      throw error;
    }
  };

  const deleteBackup = async (backupId) => {
    if (!user?.isAdmin) return;

    try {
      await deleteDoc(doc(db, 'systemBackups', backupId));
      return true;
    } catch (error) {
      console.error('Usunięcie backupu nieudane:', error);
      throw error;
    }
  };

  const getAllBackups = async () => {
    if (!user?.isAdmin) return [];

    try {
      const backupsSnapshot = await getDocs(
        query(collection(db, 'systemBackups'),
        orderBy('timestamp', 'desc'))
      );
      return backupsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Pobranie listy backupów nieudane:', error);
      throw error;
    }
  };

  const restoreSystemBackup = async (backup) => {
    if (!user?.isAdmin) return;

    try {
      const batch = writeBatch(db);
      const [usersSnapshot, tasksSnapshot, projectsSnapshot] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'tasks')),
        getDocs(collection(db, 'projects'))
      ]);

      usersSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      tasksSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      projectsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      backup.data.users.forEach(userData => {
        const userDoc = doc(db, 'users', userData.id);
        batch.set(userDoc, userData);
      });

      backup.data.tasks.forEach(taskData => {
        const taskDoc = doc(db, 'tasks', taskData.id);
        batch.set(taskDoc, {
          ...taskData,
          updatedAt: new Date().toISOString()
        });
      });

      backup.data.projects.forEach(projectData => {
        const projectDoc = doc(db, 'projects', projectData.id);
        batch.set(projectDoc, {
          ...projectData,
          updatedAt: new Date().toISOString()
        });
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Przywracanie system-backupu nieudane:', error);
      throw error;
    }
  };

  return (
    <BackupContext.Provider value={{
      backups,
      createUserBackup,
      downloadBackup,
      createSystemBackup,
      restoreBackup,
      deleteBackup,
      getAllBackups,  
      restoreSystemBackup 
    }}>
      {children}
    </BackupContext.Provider>
  );
}

export const useBackup = () => useContext(BackupContext);