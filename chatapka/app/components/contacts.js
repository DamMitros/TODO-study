import { useState } from "react";

const initialContacts = [
  { id: 1, name: "Jan Kowalski", category: "znajomi" },
  { id: 2, name: "Anna Nowak", category: "rodzina" },
  // przykladowe (docelowo maja byc pobierane z API)
];

export function useContacts() {
  const [contacts, setContacts] = useState(initialContacts);

  const addContact = (contact) => {
    setContacts([...contacts, contact]);
  };

  const editContact = (id, updatedContact) => {
    setContacts(contacts.map(contact => contact.id === id ? updatedContact : contact));
  };

  const deleteContact = (id) => {
    setContacts(contacts.filter(contact => contact.id !== id));
  };

  const searchContacts = (query) => {
    return contacts.filter(contact => contact.name.toLowerCase().includes(query.toLowerCase()));
  };

  const groupContacts = (category) => {
    return contacts.filter(contact => contact.category === category);
  };

  return { contacts, addContact, editContact, deleteContact, searchContacts, groupContacts };
}