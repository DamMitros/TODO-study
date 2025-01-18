"use client";

import { useState } from 'react';
import { useComments } from '../context/CommentContext';

export default function TaskComments({ taskId }) {
  const { comments, addComment } = useComments();
  const [newComment, setNewComment] = useState('');

  const taskComments = comments.filter(comment => comment.taskId === taskId);

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
    } catch (error) {
      console.error('Error dodając komentarz:', error);
    }
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
              </div>
              <p>{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}