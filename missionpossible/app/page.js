"use client"

import { useUser } from './context/UserContext';

export default function Page() {
  const { user } = useUser();

  return (
    <div>
      <h1>Twój wirtualny planer</h1>
      <p>Masz za dużo istotnych planów? Nie możesz odnaleźć się w natłoku zadań?</p>
      <p>Witaj w naszym planerze! Dzięki niemu będziesz mógł zapanować nad swoim czasem i zrealizować wszystkie swoje plany.</p>
      <a href={user ? "/tasks" : "/register"}>
        {user ? "Przejdź do swoich zadań" : "Zarejestruj się i zacznij planować z nami już teraz"}
      </a>
    </div>
  );
}