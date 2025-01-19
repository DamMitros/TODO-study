"use client";

import { useParams, useRouter } from "next/navigation"; 
import { useTasks } from "../../context/TaskContext";
import { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import TaskComments from '../../components/TaskComments';
import { CommentProvider } from '../../context/CommentContext';
import PersonalNotes from '../../components/PersonalNotes';
import { NoteProvider } from '../../context/NoteContext';

export default function TaskDetail() {
  const [canEdit, setCanEdit] = useState(false);
  const [task, setTask] = useState(null);
  const { user } = useUser();
  const router = useRouter();
  const params = useParams(); 
  const id = params.id; 
  const { getAllTasks, deleteTask, updateTask, leaveTask } = useTasks();
  const allTasks = getAllTasks();

  useEffect(() => {
    if (id && user) {
      const foundTask = allTasks.find((t) => t.id === id);
      if (user.isAdmin || 
          foundTask.userId === user.uid || 
          (foundTask.sharedWith && foundTask.sharedWith.includes(user.email))) {
        setTask(foundTask);
        setCanEdit(true);
      } else {
        router.push('/tasks');
      }
    }
  }, [id, allTasks, user, router]);
  
  if (!user){
    return <p>Wczytywanie danych użytkownika...</p>;
  } 

  if (!task) {
    return <p>Ładowanie zadania...</p>;
  }

  const handleDelete = async () => {
    await deleteTask(task.id);
    router.push("/tasks");
  };

  const handleEdit = () => {
    router.push(`/tasks/${task.id}/edit`);
  };

  const handleToggleCompletion = async () => {
    const updatedTask = {
      ...task,
      completed: !task.completed,
      completedAt: !task.completed ? new Date().toISOString() : null
    };
    await updateTask(task.id, updatedTask);
    setTask(updatedTask);
  };

  const handleLeaveTask = async () => {
    if (window.confirm('Czy na pewno chcesz opuścić to zadanie?')) {
      await leaveTask(task.id);
      router.push('/tasks');
    }
  };

  const isOwner = user && task && (task.userId === user.uid || user.isAdmin);

  return (
    <div>
      <h2>{task.title}</h2>
      <p><strong>Opis:</strong> {task.description || "Brak opisu"}</p>
      <p><strong>Miejsce:</strong> {task.location || "Nie podano"}</p>
      <p><strong>Powtarzalność:</strong> {task.repeat || "Jednorazowe"}</p>
      <p><strong>Istotność:</strong> {task.importance}</p>
      <p><strong>Termin:</strong> {task.deadline || "Brak terminu"}</p>
      <p><strong>Data utworzenia:</strong> {new Date(task.createdAt).toLocaleDateString()}</p>
      {task.updatedAt && (
        <p><strong>Data aktualizacji:</strong> {new Date(task.updatedAt).toLocaleDateString()}</p>
      )}
      <div>
        <p><strong>Postęp wykonania:</strong> {task.executionProgress}%</p>
        <div>
          <div 
            className="progress-fill"
            style={{ width: `${task.executionProgress}%` }} // takie zielone linie aby pokazywało postęp??? (to be implemented??)
          />
        </div>
      </div>
      <br />
      <button onClick={handleToggleCompletion}>
        {task.completed ? 'Oznacz jako niewykonane' : 'Oznacz jako wykonane'}
      </button>
      {task.completedAt && (
        <p><strong>Wykonano:</strong> {new Date(task.completedAt).toLocaleDateString()}</p>
      )}
      {canEdit && (
        <>
          <button onClick={handleEdit}>Edytuj zadanie</button>
          {isOwner ? (
            <button onClick={handleDelete}>Usuń zadanie</button>
          ) : (
            <button onClick={handleLeaveTask}>Opuść zadanie</button>
          )}
        </>
      )}
      <CommentProvider>
        <TaskComments taskId={task.id} />
      </CommentProvider>
      <NoteProvider>
        <PersonalNotes entityId={task.id} entityType="task" />
      </NoteProvider>
    </div>
  );
}
