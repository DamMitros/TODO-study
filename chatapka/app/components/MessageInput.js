import { useState } from "react";

export default function MessageInput({ chatId, sendMessage }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);

  const handleSendText = () => {
    if (text.trim()) {
      sendMessage(chatId, { type: "text", content: text });
      setText("");
    }
  };

  const handleSendFile = () => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        sendMessage(chatId, { type: "file", content: e.target.result, fileName: file.name });
        setFile(null);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Napisz wiadomość..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={handleSendText}>Wyślij</button>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleSendFile}>Wyślij plik</button>
    </div>
  );
}