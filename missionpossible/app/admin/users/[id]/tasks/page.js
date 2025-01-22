"use client";

import { useParams, useRouter } from 'next/navigation';
import { useTasks } from '../../../../context/TaskContext';
import { useUser } from '../../../../context/UserContext';

export default function UserTasksPage() {
  const { getAllTasks } = useTasks();
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const userId = params.id;

  if (!user?.isAdmin) {
    return <p>Odmowa dostępu. Wymagane uprawnienia administratora.</p>;
  }

  const userTasks = getAllTasks().filter(task => task.userId === userId);

  return (
    <div>
      <h2>Zadania użytkownika</h2>
      <div>
        {userTasks.map(task => (
          <div key={task.id}>
            <h3>{task.title}</h3>
            <p>Status: {task.completed ? 'Wykonane' : 'W toku'}</p>
            <p>Postęp: {task.executionProgress}%</p>
            <button onClick={() => router.push(`/tasks/${task.id}`)}>Zobacz szczegóły</button>
          </div>
        ))}
      </div>
    </div>
  );
}