"use client";

import TaskForm from "../../components/TaskForm";
import { TaskProvider } from "../../context/TaskContext";

export default function NewTaskPage() {
  return (
    <TaskProvider>
      <div>
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-transparent bg-clip-text animate-gradient-x transition-all duration-300">Dodaj nowe zadanie</h1>
        <TaskForm />
      </div>
    </TaskProvider>
  );
}