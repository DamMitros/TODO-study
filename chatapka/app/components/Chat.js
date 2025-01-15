import { useState } from "react";

const initialChats = [
  { id: 1, participants: [1, 2], messages: [] },
  // przykladowe (docelowo maja byc pobierane z API)
];

export function useChats() {
  const [chats, setChats] = useState(initialChats);

  const createIndividualChat = (participantId) => {
    const newChat = { id: Date.now(), participants: [participantId], messages: [] };
    setChats([...chats, newChat]);
  };

  const createGroupChat = (participantIds) => {
    const newChat = { id: Date.now(), participants: participantIds, messages: [] };
    setChats([...chats, newChat]);
  };

  const sendMessage = (chatId, message) => {
    setChats(chats.map(chat => 
      chat.id === chatId ? { ...chat, messages: [...chat.messages, message] } : chat
    ));
  };

  return { chats, createIndividualChat, createGroupChat, sendMessage };
}