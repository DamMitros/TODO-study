export default function MyProjectsLayout({ children }) {
  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-center text-indigo-600 dark:text-indigo-400">Moje Projekty</h1>
      </header>
      <main>{children}</main>
    </div>
  );
}