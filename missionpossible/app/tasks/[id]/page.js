"use client";

import { useParams, useRouter } from "next/navigation"; 
import { useTasks } from "../../context/TaskContext";
import { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import TaskComments from '../../components/TaskComments';
import { CommentProvider } from '../../context/CommentContext';
import PersonalNotes from '../../components/PersonalNotes';
import { NoteProvider } from '../../context/NoteContext';
import TaskProgressBar from "../../components/TaskProgressBar";
import ConfirmDialog from "../../components/ConfirmDialogs";

export default function TaskDetail() {
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: '',
    onConfirm: null
  });

  const [canEdit, setCanEdit] = useState(false);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const router = useRouter();
  const params = useParams(); 
  const id = params.id; 
  const { getAllTasks, deleteTask, updateTask, leaveTask, toggleTaskCompletion } = useTasks();
  const allTasks = getAllTasks();

  useEffect(() => {
    if (id && user) {
      const foundTask = allTasks.find((t) => t.id === id);
      if (!foundTask) {
        // router.push('/tasks');
        return;
      }
      if (user.isAdmin || 
          foundTask.userId === user.uid || 
          (foundTask.sharedWith && foundTask.sharedWith.includes(user.email))) {
        setTask(foundTask);
        setCanEdit(true);
      } else {
        router.push('/tasks');
      }
    }
    setLoading(false);
  }, [id, allTasks, user, router]);
  
  if (!user) {
    return <p>Wczytywanie danych użytkownika...</p>;
  } 

  if (loading) {
    return <p>Ładowanie zadania...</p>;
  }

  if (!task) {
    return <p>Zadanie nie istnieje, zostało usunięte lub nie masz do niego dostępu</p>;
  }

  const handleDelete = () => {
    setConfirmDialog({
      isOpen: true,
      message: "Czy na pewno chcesz usunąć to zadanie?",
      onConfirm: async () => {
        try {
          await deleteTask(task.id);
          router.push("/tasks");
        } catch (error) {
          console.error("Błąd podczas usuwania zadania:", error);
        }
        setConfirmDialog({ isOpen: false, message: '', onConfirm: null });
      }
    });
  };

  const handleEdit = () => {
    router.push(`/tasks/${task.id}/edit`);
  };

  const handleToggleCompletion = async () => {
    try {
      await toggleTaskCompletion(task.id);
      setTask({
        ...task,
        completed: !task.completed,
        completedAt: !task.completed ? new Date().toISOString() : null
      });
    } catch (error) {
      console.error("Błąd podczas aktualizacji statusu zadania:", error);
    }
  };

  const handleLeaveTask = () => {
    setConfirmDialog({
      isOpen: true,
      message: "Czy na pewno chcesz opuścić to zadanie?",
      onConfirm: async () => {
        try {
          await leaveTask(task.id);
          router.push("/tasks");
        } catch (error) {
          console.error("Błąd podczas opuszczania zadania:", error);
        }
        setConfirmDialog({ isOpen: false, message: '', onConfirm: null });
      }
    });
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
        <TaskProgressBar progress={task.executionProgress} />
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

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, message: '', onConfirm: null })}
      />
    </div>
  );
}
