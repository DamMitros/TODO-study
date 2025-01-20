"use client";

import { TaskProvider } from "../context/TaskContext";
import TaskList from "../components/TaskList";
import { useRouter } from "next/navigation";

export default function TasksPage() {
  const router = useRouter();

  return (
    <TaskProvider>
      <div>
        <div>
          <h1>Lista zadań</h1>
          <button onClick={() => router.push('/tasks/new')}>Dodaj nowe zadanie</button>
        </div>
        <TaskList />
      </div>
    </TaskProvider>
  );
}