"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { collection, addDoc, updateDoc, deleteDoc, onSnapshot, doc, query, where, getDocs, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useUser } from "./UserContext";
import { useProjects } from "./ProjectContext"; 

const TaskContext = createContext();

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [adminTasks, setAdminTasks] = useState([]); 
  const { user } = useUser();
  const { projects } = useProjects(); 
  const sendNotification = async (task, action) => {
    if (!user || !task) return;
    
    try {
      const usersToNotify = new Set(task.sharedWith || []);
      usersToNotify.delete(user.email); 

      const messages = {
        created: 'zostało utworzone',
        updated: 'zostało zaktualizowane',
        deleted: 'zostało usunięte',
        shared: 'zostało udostępnione'
      };

      for (const recipientEmail of usersToNotify) {
        await addDoc(collection(db, 'notifications'), {
          userId: recipientEmail,
          taskId: task.id,
          type: 'task',
          title: task.title,
          message: `Zadanie ${messages[action]} przez ${user.email}`,
          timestamp: new Date().toISOString(),
          read: false
        });
      }

    } catch (error) {
      console.error("Error wysyłając powiadomienia(Task):", error);
    }
  };

  useEffect(() => {
    if (!user?.isAdmin) return;

    const allTasksQuery = query(collection(db, "tasks"));
    
    const unsubscribeAdmin = onSnapshot(allTasksQuery, (snapshot) => {
      const allTasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAdminTasks(allTasksData);
    });

    return () => {
      unsubscribeAdmin();
    };
  }, [user?.isAdmin]);

  useEffect(() => {
    if (!user) return;

    const ownerQuery = query(collection(db, "tasks"), where('userId', '==', user.uid));
    const sharedQuery = query(collection(db, "tasks"),where('sharedWith', 'array-contains', user.email));
    const userProjects = projects.filter(project => project.members && project.members.includes(user.email));
    
    let unsubscribeProject = () => {};
    
    if (userProjects.length > 0) {
      const projectQuery = query(collection(db, "tasks"),
        where('projectId', 'in', userProjects.map(p => p.id)));

      unsubscribeProject = onSnapshot(projectQuery, (snapshot) => {
        const projectTaskData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTasks(prev => {
          const combined = [...prev];
          projectTaskData.forEach(projectTask => {
            if (!combined.find(t => t.id === projectTask.id)) {
              combined.push(projectTask);
            }
          });
          return combined;
        });
      });
    }

    const unsubscribeOwner = onSnapshot(ownerQuery, (snapshot) => {
      const taskData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(taskData);
    });

    const unsubscribeShared = onSnapshot(sharedQuery, (snapshot) => {
      const sharedTaskData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(prev => {
        const combined = [...prev];
        sharedTaskData.forEach(sharedTask => {
          if (!combined.find(t => t.id === sharedTask.id)) {
            combined.push(sharedTask);
          }
        });
        return combined;
      });
    });

    return () => {
      unsubscribeOwner();
      unsubscribeShared();
      unsubscribeProject();
    };
  }, [user, projects]);

  const addTask = async (taskData) => {
    try {
      const docRef = await addDoc(collection(db, 'tasks'), {
        ...taskData,
        userId: user.uid,
        createdAt: new Date().toISOString()
      });
      await sendNotification({
        ...taskData,
        id: docRef.id
      }, 'created');
    } catch (error) {
      console.error('Error dodając taska:', error);
    }
  };

  const updateTask = async (taskId, taskData) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const taskSnapshot = await getDoc(taskRef);
      const oldTaskData = taskSnapshot.data();
      await updateDoc(taskRef, taskData);
      await sendNotification({
        ...oldTaskData,
        ...taskData,
        id: taskId
      }, 'updated');
    } catch (error) {
      console.error('Error aktualizując taska:', error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const taskSnapshot = await getDoc(taskRef);
      const taskData = taskSnapshot.data();
      await sendNotification({ ...taskData, id: taskId }, 'deleted');
      await deleteDoc(taskRef);
    } catch (error) {
      console.error('Error usuwając taska:', error);
    }
  };

  const toggleTaskCompletion = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const updatedTask = {
        ...task,
        completed: !task.completed,
        completedAt: !task.completed ? new Date().toISOString() : null
      };
      await updateTask(taskId, updatedTask);
    }
  };

  const leaveTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedSharedWith = task.sharedWith.filter(email => email !== user.email);
    await updateTask(taskId, {
      ...task,
      sharedWith: updatedSharedWith
    });
  };

  const editTask = async (taskId, taskData) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const taskSnapshot = await getDoc(taskRef);
      const oldTaskData = taskSnapshot.data();
      await updateDoc(taskRef, taskData);
      await sendNotification({
        ...oldTaskData,
        ...taskData,
        id: taskId
      }, 'updated');
    } catch (error) {
      console.error('Error aktualizując taska:', error);
      throw error;
    }
  };

  const getAllTasks = () => {
    if (!user?.isAdmin) return [];
    return adminTasks;
  };

  return (
    <TaskContext.Provider value={{ 
      tasks, 
      addTask, 
      deleteTask,
      updateTask: editTask, 
      toggleTaskCompletion,
      leaveTask,
      getAllTasks 
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export const useTasks = () => useContext(TaskContext);