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
      <a href="/">Strona Główna</a>
      <a href="/chat">Chat</a>
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