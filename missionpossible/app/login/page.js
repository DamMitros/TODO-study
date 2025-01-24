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
      setUser(response);
      localStorage.setItem("user", JSON.stringify(response));
      router.push('/tasks');
    } catch (error) {
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
      if (error.message.includes('Twoje konto zostało zablokowane')) {
        setError(error.message);
      } else
      if (error.message.includes('To konto jest już zarejestrowane')) {
        setError(error.message);
      } else {
        // console.error(`Błąd podczas logowania: ${error.message}`);
        setError('Wystąpił błąd podczas logowania. Spróbuj ponownie.');
      }
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-900 dark:text-gray-100">{isLoginMode ? "Zaloguj się do swojego konta" : "Utwórz nowe konto"}</h2>

        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 dark:bg-red-900/50 dark:text-red-300 rounded-lg">{error}</div>
        )}

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              placeholder="Twój adres email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Hasło</label>
            <input
              type="password"
              placeholder="Twoje hasło"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="space-y-4">
            {isLoginMode ? (
              <>
                <button onClick={() => handleLogin("email")} className="w-full px-4 py-3 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors duration-200">Zaloguj się</button>
                
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">lub kontynuuj przez</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => handleLogin("google")} className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">Google</button>
                  <button onClick={() => handleLogin("facebook")} className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">Facebook</button>
                </div>

                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                  Nie masz jeszcze konta?{" "}
                  <button onClick={() => setIsLoginMode(false)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200">Zarejestruj się tutaj</button>
                </p>
              </>
            ) : (
              <>
                <button onClick={handleRegister} className="w-full px-4 py-3 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors duration-200">Utwórz konto</button>

                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                  Masz już konto?{" "}
                  <button onClick={() => setIsLoginMode(true)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200">Zaloguj się</button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
