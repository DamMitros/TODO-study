"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { collection, addDoc, updateDoc, deleteDoc, onSnapshot, doc, query, where } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useUser } from "./UserContext";
import { useProjects } from "./ProjectContext";

const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const { user } = useUser();
  const { projects } = useProjects();

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

  const addTask = async (task) => {
    await addDoc(collection(db, "tasks"), task);
  };

  const editTask = async (id, updatedTask) => {
    const taskRef = doc(db, "tasks", id);
    await updateDoc(taskRef, updatedTask);
  };

  const deleteTask = async (id) => {
    const taskRef = doc(db, "tasks", id);
    await deleteDoc(taskRef);
  };

  const toggleTaskCompletion = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const updatedTask = {
        ...task,
        completed: !task.completed,
        completedAt: !task.completed ? new Date().toISOString() : null
      };
      await editTask(taskId, updatedTask);
    }
  };

  return (
    <TaskContext.Provider value={{ 
      tasks, 
      addTask, 
      editTask, 
      deleteTask,
      toggleTaskCompletion 
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);