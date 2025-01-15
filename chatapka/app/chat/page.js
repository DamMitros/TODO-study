"use client";

import { useState } from "react";
import { useChats } from "./../components/Chat";
import { useContacts } from "./../components/contacts";
import MessageInput from "./../components/MessageInput";
import MessageList from "./../components/MessageList";

export default function ChatList() {
  const { chats, createIndividualChat, createGroupChat, sendMessage } = useChats();
  const { contacts } = useContacts();
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  const handleCreateIndividualChat = (contactId) => {
    createIndividualChat(contactId);
  };

  const handleCreateGroupChat = () => {
    createGroupChat(selectedContacts);
    setSelectedContacts([]);
  };

  return (
    <div>
      <h1>Rozmowy</h1>
      <ul>
        {chats.map(chat => (
          <li key={chat.id} onClick={() => setActiveChatId(chat.id)}>
            Rozmowa z: {chat.participants.map(id => contacts.find(contact => contact.id === id)?.name).join(", ")}
            {activeChatId && (
              <div>
                <MessageList messages={chats.find(chat => chat.id === activeChatId).messages} />
                <MessageInput chatId={activeChatId} sendMessage={sendMessage} />
              </div>
            )}
          </li>
        ))}
      </ul>
      <h2>Utwórz nową rozmowę</h2>
      <h3>Indywidualna</h3>
      <ul>
        {contacts.map(contact => (
          <li key={contact.id}>
            {contact.name}
            <button onClick={() => handleCreateIndividualChat(contact.id)}>Rozpocznij rozmowę</button>
          </li>
        ))}
      </ul>
      <h3>Grupowa</h3>
      <ul>
        {contacts.map(contact => (
          <li key={contact.id}>
            <input
              type="checkbox"
              checked={selectedContacts.includes(contact.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedContacts([...selectedContacts, contact.id]);
                } else {
                  setSelectedContacts(selectedContacts.filter(id => id !== contact.id));
                }
              }}
            />
            {contact.name}
          </li>
        ))}
      </ul>
      <button onClick={handleCreateGroupChat}>Utwórz rozmowę grupową</button>

    </div>
  );
}