"use client";

import { useState } from 'react';
import { useComments } from '../context/CommentContext';
import { useNotifications } from '../context/NotificationContext';
import { useTasks } from '../context/TaskContext';
import { useUser } from '../context/UserContext';
import ConfirmDialog from '../components/ConfirmDialogs';

export default function TaskComments({ taskId }) {
  const { comments, addComment, deleteComment, editComment } = useComments();
  const { addNotification } = useNotifications();
  const { getAllTasks } = useTasks();
  const { user } = useUser();
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: '',
    onConfirm: null
  });

  const taskComments = comments.filter(comment => comment.taskId === taskId);
  const tasks = getAllTasks();
  const currentTask = tasks.find(task => task.id === taskId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await addComment({
        taskId,
        content: newComment.trim(),
        type: 'comment'
      });
      setNewComment('');
      addNotification({
        type: 'comment',
        title: 'Nowy komentarz',
        message: `Dodano nowy komentarz do zadania: ${currentTask?.title}`,
        taskId
      });
    } catch (error) {
      console.error('Error dodając komentarz:', error);
    }
  };

  const handleEdit = async (commentId, content) => {
    setEditingId(commentId);
    setEditContent(content);
  };

  const handleSaveEdit = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      await editComment(commentId, editContent);
      addNotification({
        type: 'comment',
        title: 'Komentarz edytowany',
        message: `Edytowano komentarz w zadaniu: ${currentTask?.title}`,
        taskId
      });
      setEditingId(null);
    } catch (error) {
      console.error('Error edytując komentarz:', error);
    }
  };

  const handleDelete = async (commentId) => {
    setConfirmDialog({
      isOpen: true,
      message: 'Czy na pewno chcesz usunąć ten komentarz?',
      onConfirm: async () => {
        try {
          await deleteComment(commentId);
          addNotification({
            type: 'comment',
            title: 'Komentarz usunięty',
            message: `Usunięto komentarz w zadaniu: ${currentTask?.title}`,
            taskId
          });
        } catch (error) {
          console.error('Error usuwając komentarz:', error);
        }
        setConfirmDialog({ isOpen: false, message: '', onConfirm: null });
      }
    });
  };

  return (
    <div>
      <h3>Komentarze</h3>
      
      <form onSubmit={handleSubmit}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Dodaj komentarz..."
          rows="3"
        />
        <button type="submit">Dodaj komentarz</button>
      </form>

      <div>
        {taskComments.length === 0 ? (
          <p>Brak komentarzy</p>
        ) : (
          taskComments.map(comment => (
            <div key={comment.id}>
              <div>
                <strong>{comment.userEmail}</strong>
                <span>{new Date(comment.createdAt).toLocaleString()}</span>
                {comment.editedAt && <span>(edytowano)</span>}
              </div>
              {editingId === comment.id ? (
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows="3"
                  />
                  <button onClick={() => handleSaveEdit(comment.id)}>Zapisz</button>
                  <button onClick={() => setEditingId(null)}>Anuluj</button>
                </div>
              ) : (
                <div>
                  <p>{comment.content}</p>
                  {(user.isAdmin || comment.userId === user.uid) && (
                    <div>
                      <button onClick={() => handleEdit(comment.id, comment.content)}>
                        Edytuj
                      </button>
                      <button onClick={() => handleDelete(comment.id)}>
                        Usuń
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, message: '', onConfirm: null })}
      />
    </div>
  );
}