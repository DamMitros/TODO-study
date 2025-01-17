export default function MyProjectsLayout({ children }) {
  return (
    <div>
      <header>
        <h1>Moje Projekty</h1>
      </header>
      <main>{children}</main>
    </div>
  );
}