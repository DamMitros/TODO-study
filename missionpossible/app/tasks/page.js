"use client";

import { TaskProvider } from "../context/TaskContext";
import TaskForm from "../components/TaskForm";
import TaskList from "../components/TaskList";

export default function HomePage() {
  return (
    <TaskProvider>
      <div>
        <h1>TODO Application</h1>
        <a> Tutaj jest opcja dodania notatek</a>
        <TaskForm />
        <p>----------------------------------</p>
        <a> Tutaj jest lista notatek</a>
        <TaskList />
      </div>
    </TaskProvider>
  );
}