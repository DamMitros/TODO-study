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
      const usersToNotify = new Set([
        ...(task.sharedWith || []),
        ...(task.projectId ? projects.find(p => p.id === task.projectId)?.members || [] : [])
      ]);
      usersToNotify.delete(user.email);

      const messages = {
        created: 'zostało utworzone',
        updated: 'zostało zaktualizowane',
        deleted: 'zostało usunięte',
        shared: 'zostało udostępnione',
        completed: 'zostało oznaczone jako wykonane',
        uncompleted: 'zostało oznaczone jako niewykonane',
        comment: 'otrzymało nowy komentarz',
        progress: `zostało zaktualizowane (postęp: ${task.executionProgress}%)`
      };

      for (const recipientEmail of usersToNotify) {
        await addDoc(collection(db, 'notifications'), {
          userId: recipientEmail,
          taskId: task.id,
          type: 'task',
          title: `Aktualizacja zadania: ${task.title}`,
          message: `Zadanie ${messages[action]} przez ${user.email}`,
          timestamp: new Date().toISOString(),
          read: false,
          priority: task.importance >= 4 ? 'high' : 'normal'
        });
      }

    } catch (error) {
      console.error("Error wysyłając powiadomienia:", error);
    }
  };

  const notifyTaskUsers = async (task, action) => {
    if (!user || !task) return;
    
    try {
      const usersToNotify = new Set([
        task.userId, 
        ...(task.sharedWith || []), 
        ...(task.projectId ? projects.find(p => p.id === task.projectId)?.members || [] : []) 
      ]);
      usersToNotify.delete(user.email); 
  
      const messages = {
        created: 'zostało utworzone',
        updated: 'zostało zaktualizowane',
        deleted: 'zostało usunięte',
        shared: 'zostało udostępnione',
        completed: 'zostało oznaczone jako wykonane',
        uncompleted: 'zostało oznaczone jako niewykonane',
        comment: 'otrzymało nowy komentarz',
        progress: `zostało zaktualizowane (postęp: ${task.executionProgress}%)`
      };
  
      for (const recipientEmail of usersToNotify) {
        await addDoc(collection(db, 'notifications'), {
          userId: recipientEmail,
          taskId: task.id,
          type: 'task',
          title: `Aktualizacja zadania: ${task.title}`,
          message: `Zadanie ${messages[action]} przez ${user.email}`,
          timestamp: new Date().toISOString(),
          read: false,
          priority: task.importance >= 4 ? 'high' : 'normal'
        });
        if (task.projectId) {
          const project = projects.find(p => p.id === task.projectId);
          if (project) {
            await notifyProjectMembers(project, 'task_updated');
          }
        }
      }
    } catch (error) {
      console.error("Error wysyłając powiadomienie:", error);
    }
  };

  useEffect(() => {
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

  useEffect(() => {
    if (!user) return;

    const hasExistingNotification = (notifications, task, isToday) => {
      return notifications.some(n => 
        n.taskId === task.id && 
        n.type === 'deadline' &&
        new Date(n.timestamp).toDateString() === new Date().toDateString() &&
        ((isToday && n.message.includes('dzisiaj')) || 
         (!isToday && n.message.includes('jutro')))
      );
    };

    const checkDeadlines = async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const existingNotificationsSnapshot = await getDocs(
        query(
          collection(db, 'notifications'),
          where('userId', '==', user.email),
          where('type', '==', 'deadline')
        )
      );
      
      const existingNotifications = existingNotificationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
  
      for (const task of tasks) {
        if (task.completed || !task.deadline) continue;
        
        const deadline = new Date(task.deadline);
        const deadlineDate = deadline.toDateString();
        const todayDate = today.toDateString();
        const tomorrowDate = tomorrow.toDateString();
  
        if (deadlineDate === todayDate && !hasExistingNotification(existingNotifications, task, true)) {
          await addDoc(collection(db, 'notifications'), {
            userId: user.email,
            taskId: task.id,
            type: 'deadline',
            title: 'Termin zadania dziś!',
            message: `Zadanie "${task.title}" ma termin wykonania dzisiaj!`,
            timestamp: new Date().toISOString(),
            read: false,
            priority: 'high'
          });
        }
        else if (deadlineDate === tomorrowDate && !hasExistingNotification(existingNotifications, task, false)) {
          await addDoc(collection(db, 'notifications'), {
            userId: user.email,
            taskId: task.id,
            type: 'deadline',
            title: 'Zbliżający się termin',
            message: `Zadanie "${task.title}" ma termin wykonania jutro!`,
            timestamp: new Date().toISOString(),
            read: false,
            priority: 'medium'
          });
        }
      }
    };
    checkDeadlines();
  
    const interval = setInterval(checkDeadlines, 3600000);
    return () => clearInterval(interval);
  }, [tasks, user]);

  const addTask = async (taskData) => {
    try {
      const docRef = await addDoc(collection(db, 'tasks'), {
        ...taskData,
        userId: user.uid,
        createdAt: new Date().toISOString()
      });
      
      await notifyTaskUsers({
        ...taskData,
        id: docRef.id
      }, 'created');

      if (taskData.projectId) {
        const project = projects.find(p => p.id === taskData.projectId);
        if (project) {
          await notifyProjectMembers(project, 'task_added');
        }
      }
    } catch (error) {
      console.error('Error dodając zadanie:', error);
      throw error;
    }
  };

  const updateTask = async (taskId, taskData) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        ...taskData,
        updatedAt: new Date().toISOString()
      });
      await notifyTaskUsers(taskData, 'updated');
    } catch (error) {
      console.error('Error aktualizując zadanie:', error);
      throw error;
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