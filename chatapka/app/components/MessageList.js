export default function MessageList({ messages }) {
  return (
    <ul>
      {messages.map((message, index) => (
        <li key={index}>
          {message.type === "text" && <p>{message.content}</p>}
          {message.type === "file" && (
            <div>
              <p>{message.fileName}</p>
              <a href={message.content} download={message.fileName}>Pobierz</a>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}