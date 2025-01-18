"use client";

import { useState } from 'react';
import { useNotes } from '../context/NoteContext';

export default function PersonalNotes({ entityId, entityType }) {
  const { notes, addNote, deleteNote } = useNotes();
  const [newNote, setNewNote] = useState('');

  const entityNotes = notes.filter(
    note => note.entityId === entityId && note.entityType === entityType
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      await addNote({
        content: newNote.trim(),
        entityId,
        entityType,
      });
      setNewNote('');
    } catch (error) {
      console.error('Error dodając notatke:', error);
    }
  };

  const handleDelete = async (noteId) => {
    try {
      await deleteNote(noteId);
    } catch (error) {
      console.error('Error usuwając notatke:', error);
    }
  };

  return (
    <div>
      <h3>Moje Notatki</h3>
      
      <form onSubmit={handleSubmit}>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Dodaj prywatną notatkę..."
          rows="3"
        />
        <button type="submit">Dodaj notatkę</button>
      </form>

      <div>
        {entityNotes.length === 0 ? (
          <p>Brak notatek</p>
        ) : (
          entityNotes.map(note => (
            <div key={note.id}>
              <div>
                <p>{note.content}</p>
                <span>
                  {new Date(note.createdAt).toLocaleString()}
                </span>
              </div>
              <button onClick={() => handleDelete(note.id)}>Usuń</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}