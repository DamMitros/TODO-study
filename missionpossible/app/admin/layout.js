"use client";
import { useUser } from "../context/UserContext";

export default function AdminLayout({children}) {
  const { user } = useUser();

  if (!user?.isAdmin) {
    return <p>Odmowa dostępu. Wymagane uprawnienia administratora.</p>;
  }

  return (
    <div>
      <h1>Panel Administratora</h1>
      <div>
        <a href="/admin/users">Zarządzanie użytkownikami</a>
        <a href="/admin/tasks">Zarządzanie zadaniami</a>
        <a href="/admin/projects">Zarządzanie projektami</a>
        <a href="/admin/stats">Statystyki aktywności</a>
      </div>
      {children}
    </div>
  );
}