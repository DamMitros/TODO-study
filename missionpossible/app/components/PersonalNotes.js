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
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <div className="flex gap-4">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Dodaj notatkę..."
              rows="3"
              className="flex-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent resize-y"
            />
            <button onClick={handleSubmit} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200" >Zapisz</button>
          </div>
        </div>
      </form>

      <div className="space-y-4">
        {entityNotes.length === 0 ? (
          <p>Brak notatek</p>
        ) : (
          entityNotes.map(note => (
            <div key={note.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{note.content}</p>
                <button onClick={() => handleDelete(note.id)}className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">×</button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2"> {new Date(note.createdAt).toLocaleString()} </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}