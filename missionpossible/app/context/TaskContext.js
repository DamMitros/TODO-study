"use client";

import { createContext, useContext, useReducer, useEffect } from 'react';
import { taskReducer } from '../reducers/taskReducer';
import { collection, query, where, onSnapshot, updateDoc, deleteDoc, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useUser } from './UserContext';
import { useProjects } from './ProjectContext';
import { useNotifications } from './NotificationContext';

const TaskContext = createContext();

const initialState = {
  tasks: [],
  loading: false
};

export function TaskProvider({ children }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);
  const { user } = useUser();
  const { projects } = useProjects();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!user) return;
    
    const tasksRef = collection(db, "tasks");
    const ownedTasksQuery = query(tasksRef, where('userId', '==', user.uid));
    const sharedTasksQuery = query(tasksRef, where('sharedWith', 'array-contains', user.email));
  
    const unsubscribe = onSnapshot(
      ownedTasksQuery, 
      (ownedSnapshot) => {
        const ownedTasks = ownedSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
  
        const unsubscribeShared = onSnapshot(
          sharedTasksQuery,
          (sharedSnapshot) => {
            const sharedTasks = sharedSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
  
            const uniqueTasks = [
              ...ownedTasks,
              ...sharedTasks.filter(shared => 
                !ownedTasks.some(owned => owned.id === shared.id)
              )
            ];
  
            dispatch({ type: 'SET_TASKS', payload: uniqueTasks });
          }
        );
  
        return () => unsubscribeShared();
      }
    );
  
    return () => unsubscribe();
  }, [user]);

  const addTask = async (taskData) => {
    try {
      const docRef = await addDoc(collection(db, "tasks"), taskData);
      await addNotification({
        userId: user.email, 
        type: 'task',
        title: 'Nowe zadanie',
        message: `Utworzono nowe zadanie: ${taskData.title}`,
        priority: 'normal'
      });

      return docRef.id;
    } catch (error) {
      console.error('Error dodając zadanie:', error);
      throw error;
    }
  };

  const notifyTaskMembers = async (task, action, message) => {
    const recipientEmails = new Set(task.sharedWith || []);
    if (task.userId) {
      const userDoc = await getDoc(doc(db, "users", task.userId));
      if (userDoc.exists()) {
        recipientEmails.add(userDoc.data().email);
      }
    }

    for (const recipientEmail of recipientEmails) {
      if (recipientEmail) { 
        await addNotification({
          userId: recipientEmail, 
          taskId: task.id,
          type: 'task',
          title: `Aktualizacja zadania: ${task.title}`,
          message: message,
          priority: 'normal',
          timestamp: new Date().toISOString()
        });
      }
    }
  };

  const updateTask = async (taskId, taskData) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), taskData);
      await notifyTaskMembers(
        taskData,
        'updated',
        `Zadanie "${taskData.title}" zostało zaktualizowane`
      );
    } catch (error) {
      console.error('Error aktualizując zadanie:', error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const taskDoc = await getDoc(doc(db, "tasks", taskId));
      if (taskDoc.exists()) {
        const task = { id: taskDoc.id, ...taskDoc.data() };
        await notifyTaskMembers(
          task,
          'deleted',
          `Zadanie "${task.title}" zostało usunięte`
        );
      }
      await deleteDoc(doc(db, "tasks", taskId));
      dispatch({ type: 'DELETE_TASK', payload: taskId });
    } catch (error) {
      console.error('Error usuwając zadanie:', error);
      throw error;
    }
  };

  const toggleTaskCompletion = async (taskId) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      try {
        const newCompleted = !task.completed;
        await updateDoc(doc(db, "tasks", taskId), {
          completed: newCompleted,
          completedAt: newCompleted ? new Date().toISOString() : null
        });
        
        await notifyTaskMembers(
          task,
          'status_changed',
          `Zadanie "${task.title}" zostało ${newCompleted ? 'zakończone' : 'wznowione'}`
        );
  
      } catch (error) {
        console.error('Błąd podczas zmiany statusu zadania:', error);
        throw error;
      }
    }
  };

  const leaveTask = async (taskId) => {
    try {
      const taskRef = doc(db, "tasks", taskId);
      const taskDoc = await getDoc(taskRef);
      const taskData = taskDoc.data();
      const updatedSharedWith = taskData.sharedWith.filter(email => email !== user.email);

      await updateDoc(taskRef, {
        sharedWith: updatedSharedWith
      });

      await notifyTaskMembers(
        { ...taskData, id: taskId },
        'member_left',
        `Użytkownik ${user.email} opuścił zadanie "${taskData.title}"`
      );

      dispatch({ type: 'UPDATE_TASK', payload: { id: taskId, sharedWith: updatedSharedWith }});
    } catch (error) {
      console.error('Error opuszczając zadanie:', error);
      throw error;
    }
  };

  const addComment = async (taskId, comment) => {
    try {
      const taskRef = doc(db, "tasks", taskId);
      const taskDoc = await getDoc(taskRef);
      if (taskDoc.exists()) {
        const task = { id: taskDoc.id, ...taskDoc.data() };
        await notifyTaskMembers(
          task,
          'comment_added',
          `Dodano nowy komentarz w zadaniu "${task.title}"`
        );
      }
    } catch (error) {
      console.error('Błąd podczas wysyłania powiadomienia o komentarzu:', error);
    }
  };

  return (
    <TaskContext.Provider value={{
      tasks: state.tasks,
      loading: state.loading,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskCompletion,
      leaveTask,
      getAllTasks: () => state.tasks,
      addComment
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export const useTasks = () => useContext(TaskContext);