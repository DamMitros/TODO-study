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
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-4 items-stretch">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Dodaj komentarz..."
            rows="1"
            className="flex-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent resize-y"
          />
          <button type="submit"  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200"> Dodaj komentarz </button>
        </div>
      </form>

      <div className="space-y-4">
        {taskComments.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-center italic">Brak komentarzy</p>
        ) : (
          taskComments.map(comment => (
            <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <strong className="text-gray-900 dark:text-gray-100">{comment.userEmail}</strong>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{new Date(comment.createdAt).toLocaleString()}</span>
                  {comment.editedAt && (
                    <span className="text-sm text-gray-400 dark:text-gray-500 ml-2 italic">(edytowano)</span>
                  )}
                </div>
              </div>
              
              {editingId === comment.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows="3"
                    className="rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all duration-200"
                  />
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => handleSaveEdit(comment.id)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200"> Zapisz</button>
                    <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200"> Anuluj </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                  {(user.isAdmin || comment.userId === user.uid) && (
                    <div className="flex justify-end space-x-2 mt-2">
                      <button onClick={() => handleEdit(comment.id, comment.content)} className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 transition-colors duration-200" > Edytuj </button>
                      <button onClick={() => handleDelete(comment.id)} className="px-3 py-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 transition-colors duration-200">Usuń </button>
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