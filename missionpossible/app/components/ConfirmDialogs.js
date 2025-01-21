"use client";

export default function ConfirmDialog({ isOpen, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div>
      <div>
        <p>{message}</p>
        <div>
          <button onClick={onCancel}>Anuluj</button>
          <button onClick={onConfirm}>Potwierdź</button>
        </div>
      </div>
    </div>
  );
}