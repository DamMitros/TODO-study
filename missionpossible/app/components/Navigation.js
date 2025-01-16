"use client";

import { useUser } from "../context/UserContext";

export default function Navigation() {
  const { user, setUser } = useUser();

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <div>
      <h1>MissionPossible</h1>
      <a href="/">Strona Główna</a>
      <a href="/tasks">Lista zadań</a>
      {/* <a href="/calender">Kalendarz</a> */}
      {user ? (
        <>
          <a href="/profile">Profil</a>
          <button onClick={handleLogout}>Wyloguj</button>
        </>
      ) : (
        <a href="/login">Logowanie</a>
      )}
    </div>
  );
}