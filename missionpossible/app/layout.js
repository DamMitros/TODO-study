import Navigation from "./components/Navigation"
import { UserProvider } from "./context/UserContext";
import { TaskProvider } from "./context/TaskContext"
export const metadata = {
  title: "MissionPossible",
  description: "Projekt na Fronted:3",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <TaskProvider>
            <Navigation />
            {children}
          </TaskProvider>
        </UserProvider>
      </body>
    </html>
  );
}
