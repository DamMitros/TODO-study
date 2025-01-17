"use client";

import { useParams, useRouter } from "next/navigation";
import { useTasks } from "../../../context/TaskContext";
import { useUser } from "../../../context/UserContext";
import { useEffect, useState } from "react";
import TaskEditForm from "../../../components/TaskEditForm";

export default function EditTaskPage() {
  const { tasks } = useTasks();
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  
  const [task, setTask] = useState(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (id) {
      const foundTask = tasks.find((t) => t.id === id);
      if (foundTask && (foundTask.userId === user.uid || 
          (foundTask.sharedWith && foundTask.sharedWith.includes(user.email)))) {
        setTask(foundTask);
      } else {
        router.push('/tasks');
      }
    }
  }, [id, tasks, user, router]);

  if (!user) {
    return <p>Przekierowywanie do strony logowania...</p>;
  }

  if (!task) {
    return <p>Ładowanie zadania...</p>;
  }

  const handleCancelEdit = () => {
    router.push(`/tasks/${id}`);
  };

  const isOwner = user && task && task.userId === user.uid;

  return (
    <div>
      <h1>Edycja zadania</h1>
      <TaskEditForm 
        task={task} 
        onCancelEdit={handleCancelEdit}
        isOwner={isOwner}
      />
    </div>
  );
}