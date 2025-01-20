import Navigation from "./components/Navigation"
import { UserProvider } from "./context/UserContext";
import { TaskProvider } from "./context/TaskContext"
import { ProjectProvider } from "./context/ProjectContext";
import { NotificationProvider } from './context/NotificationContext';
import { BackupProvider } from './context/BackupContext';

export const metadata = {
  title: "MissionPossible",
  description: "Projekt na Fronted:3",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <NotificationProvider>
            <ProjectProvider>
              <TaskProvider>
                <BackupProvider>
                  <Navigation />
                  {children}
                </BackupProvider>
              </TaskProvider>
            </ProjectProvider>
          </NotificationProvider>
        </UserProvider>
      </body>
    </html>
  );
}
