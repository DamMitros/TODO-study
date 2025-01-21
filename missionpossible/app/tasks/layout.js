export default function TasksLayout({children}){
  return (
    <div>
      <h1>Twoja lista zadań do zrobienia (albo nie...)</h1>
      {children}
    </div>
  )
}