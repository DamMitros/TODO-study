"use client";

import { useState } from "react";
import { useUser } from "../context/UserContext";
import { registerWithEmail, loginWithEmail, loginWithGoogle, loginWithFacebook } from "../components/auth";
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState(""); 
  const { setUser } = useUser();
  const router = useRouter();

  const handleRegister = async () => {
    try {
      const response = await registerWithEmail(email, password);
      setUser(response.user);
      localStorage.setItem("user", JSON.stringify(response.user));
      router.push('/tasks');
    } catch (error) {
      // console.error(`Błąd podczas rejestracji: ${error.message}`);
      setError(`Błąd podczas rejestracji: ${error.message}`);
    }
  };

  const handleLogin = async (method) => {
    try {
      let response;
      if (method === "email") {
        if (!email || !password) {
          // console.error("Email i hasło są wymagane");
          setError("Email i hasło są wymagane");
          return;
        }
        response = await loginWithEmail(email, password);
      } else if (method === "google") {
        response = await loginWithGoogle();
      } else if (method === "facebook") {
        response = await loginWithFacebook();
      } else {
        throw new Error("Nieznana metoda logowania");
      }

      setUser(response);
      localStorage.setItem("user", JSON.stringify(response));
      router.push('/tasks');
    } catch (error) {
      if (error.message.includes('To konto jest już zarejestrowane')) {
        setError(error.message);
      } else {
        // console.error(`Błąd podczas logowania: ${error.message}`);
        setError('Wystąpił błąd podczas logowania. Spróbuj ponownie.');
      }
    }
  };

  return (
    <div>
      <div>
        <h2>{isLoginMode ? "Zaloguj się do swojego konta" : "Utwórz nowe konto"}</h2>
        
        {error && <div style={{ color: 'red' }}>{error}</div>} 

        <div>
          <div>
            <label>Email</label>
            <input
              type="email"
              placeholder="Twój adres email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label>Hasło</label>
            <input
              type="password"
              placeholder="Twoje hasło"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {isLoginMode ? (
            <>
              <button onClick={() => handleLogin("email")}>Zaloguj się</button>
              <span>lub</span>
              <button onClick={() => handleLogin("google")}>Kontynuuj z Google</button>
              <button onClick={() => handleLogin("facebook")}>Kontynuuj z Facebook</button>

              <p>
                Nie masz jeszcze konta?{" "}
                <button onClick={() => setIsLoginMode(false)}>Zarejestruj się tutaj</button>
              </p>
            </>
          ) : (
            <>
              <button onClick={handleRegister}>Utwórz konto</button>
              <p>
                Masz już konto?{" "}
                <button onClick={() => setIsLoginMode(true)}>Zaloguj się</button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
