"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { collection, addDoc, updateDoc, deleteDoc, onSnapshot, doc, query } from "firebase/firestore";
import { db } from "../../firebaseConfig";

const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "tasks"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(tasksData);
    });

    return () => unsubscribe();
  }, []);

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