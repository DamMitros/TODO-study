"use client";

import TaskForm from "../../components/TaskForm";
import { TaskProvider } from "../../context/TaskContext";

export default function NewTaskPage() {
  return (
    <TaskProvider>
      <div>
        <h1>Dodaj nowe zadanie</h1>
        <TaskForm />
      </div>
    </TaskProvider>
  );
}