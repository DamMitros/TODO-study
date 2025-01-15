import Navigation from "./components/Navigation"
import { UserProvider } from "./context/UserContext";

export const metadata = {
  title: "ChatApka",
  description: "Projekt na Fronted:3",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <Navigation />
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
