import Navigation from "./components/Navigation"
import { UserProvider } from "./context/UserContext";
import { TaskProvider } from "./context/TaskContext"
import { ProjectProvider } from "./context/ProjectContext";

export const metadata = {
  title: "MissionPossible",
  description: "Projekt na Fronted:3",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <ProjectProvider>
            <TaskProvider>
              <Navigation />
              {children}
            </TaskProvider>
          </ProjectProvider>
        </UserProvider>
      </body>
    </html>
  );
}
