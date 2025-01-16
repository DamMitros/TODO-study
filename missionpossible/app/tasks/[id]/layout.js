export default function Layout({ children }) {
  return (
      <div>
        <header>
          <h1>Moje Zadania</h1>
        </header>
        <main>{children}</main>
      </div>
  );
}
