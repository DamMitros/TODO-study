import './globals.css';
import Navigation from "./components/Navigation"
import { UserProvider } from "./context/UserContext";
import { TaskProvider } from "./context/TaskContext"
import { ProjectProvider } from "./context/ProjectContext";
import { NotificationProvider } from './context/NotificationContext';
import { BackupProvider } from './context/BackupContext';
import { ThemeProvider } from './context/ThemeContext';

export const metadata = {
  title: "MissionPossible",
  description: "Projekt na Fronted:3",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light">
      <body className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100">
        <UserProvider>
          <NotificationProvider>
            <ProjectProvider>
              <TaskProvider>
                <BackupProvider>
                  <ThemeProvider>
                    <div className="flex flex-col min-h-screen">
                      <Navigation />
                      <main className="flex-grow container mx-auto px-4 py-8 overflow-hidden">
                        {children}
                      </main>
                    </div>
                  </ThemeProvider>
                </BackupProvider>
              </TaskProvider>
            </ProjectProvider>
          </NotificationProvider>
        </UserProvider>
      </body>
    </html>
  );
}
