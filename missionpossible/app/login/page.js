"use client";

import { useState } from "react";
import { useUser } from "../context/UserContext";
import { registerWithEmail, loginWithEmail, loginWithGoogle } from "../components/auth"; 

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setUser } = useUser();

  const handleRegister = async () => {
    try {
      const response = await registerWithEmail(email, password);
      setUser(response.user);
      localStorage.setItem("user", JSON.stringify(response.user));
    } catch (error) {
      console.error(`Błąd podczas rejestracji: ${error.message}`);
    }
  };

  const handleLogin = async (method) => {
    try {
      let response;
      if (method === "email") {
        if (!email || !password) {
          console.error("Email i hasło są wymagane");
          return;
        }
        response = await loginWithEmail(email, password);
      } else if (method === "google") {
        response = await loginWithGoogle();
      } else {
        throw new Error("Nieznana metoda logowania");
      }

      setUser(response);
      localStorage.setItem("user", JSON.stringify(response));
    } catch (error) {
      console.error(`Błąd podczas logowania: ${error.message}`);
    }
  };

  return (
    <div>
      <h1>Logowanie</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Hasło"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={() => handleLogin("email")}>Zaloguj się</button>
      <button onClick={() => handleLogin("google")}>Zaloguj się przez Google</button>

      <h1>Rejestracja</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Hasło"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleRegister}>Zarejestruj się</button>
    </div>
  );
}
