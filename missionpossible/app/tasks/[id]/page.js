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
import { useProjects } from "../../context/ProjectContext";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

export default function TaskDetail() {
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: '',
    onConfirm: null
  });

  const [canEdit, setCanEdit] = useState(false);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const { projects } = useProjects();
  const { user } = useUser();
  const router = useRouter();
  const params = useParams(); 
  const id = params.id; 
  const { getAllTasksAdmin, deleteTask, leaveTask, toggleTaskCompletion } = useTasks();
  
  const fetchUsers = async () => {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const usersData = usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));
    setUsers(usersData);
  };

  useEffect(() => {
    const fetchTask = async () => {
      if (!id || !user) return;

      try {
        const allTasks = await getAllTasksAdmin();
        const foundTask = allTasks.find((t) => t.id === id);
        
        if (!foundTask) {
          return;
        }

        if (user.isAdmin || 
            foundTask.userId === user.uid || 
            (foundTask.sharedWith && foundTask.sharedWith.includes(user.email))) {
          fetchUsers();
          setTask(foundTask);
          setCanEdit(true);
        } else {
          router.push('/tasks');
        }
      } catch (error) {
        console.error("Błąd podczas pobierania zadania:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id, user, getAllTasksAdmin, router]);
  
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
  const isAdminMember = user && task && task.sharedWith && task.sharedWith.includes(user.email) && user.isAdmin;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{task.title}</h2>
          
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Opis:</span> {task.description || "Brak opisu"}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Miejsce:</span> {task.location || "Nie podano"}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Powtarzalność:</span> {task.repeat || "Jednorazowe"}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Istotność:</span> {task.importance}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Termin:</span> {task.deadline ? new Date(task.deadline).toLocaleDateString() : "Brak terminu"}
            </p>
            
            {task.sharedWith && task.sharedWith.length > 0 && (
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Osoby w zadaniu: </span>
              {[
                users.find(u => u.uid === task.userId)?.email,
                ...(task.sharedWith || [])
              ].join(", ")}
            </p>
            )}

            {task.projectId && (
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Nazwa projektu: </span>
              {task.projectId ? projects.find(p => p.id === task.projectId)?.name || "Nieznaleziony" : "Brak projektu"}
            </p>              
            )}

            <div className="space-y-2">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Postęp wykonania:</span> {task.executionProgress}%
              </p>
              <TaskProgressBar progress={task.executionProgress} />
            </div>

            <div className="pt-4 space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Utworzono: {new Date(task.createdAt).toLocaleDateString()}
              </p>
              {task.updatedAt && (
                <p className="text-sm text-gray-600 dark:text-gray-400">Zaktualizowano: {new Date(task.updatedAt).toLocaleDateString()}</p>
              )}
              {task.completedAt && (
                <p className="text-sm text-gray-600 dark:text-gray-400">Wykonano: {new Date(task.completedAt).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-6">
            <button 
              onClick={handleToggleCompletion}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                task.completed
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {task.completed ? 'Oznacz jako niewykonane' : 'Oznacz jako wykonane'}
            </button>
            
            {canEdit && (
              <>
                <button onClick={handleEdit} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200">Edytuj zadanie</button>
      
                {isOwner ? (
                  <>
                    <button onClick={handleDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200">Usuń zadanie</button>
                    {isAdminMember && (
                      <button onClick={handleLeaveTask} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200">Opuść zadanie</button>
                    )}
                  </>
                ) : (
                  <button onClick={handleLeaveTask} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200">Opuść zadanie</button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg h-[calc(100vh-12rem)] flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Moje notatki</h3>
          </div>
          <div className="flex-grow overflow-y-auto p-4">
            <NoteProvider>
              <PersonalNotes entityId={task.id} entityType="task" />
            </NoteProvider>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Komentarze</h3>
            <CommentProvider>
              <TaskComments taskId={task.id} />
            </CommentProvider>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, message: '', onConfirm: null })}
      />
    </div>
  );
}
