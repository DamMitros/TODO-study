"use client";

import { useBackup } from '../context/BackupContext';
import { useNotifications } from '../context/NotificationContext';
import { useCallback, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialogs';

export default function UserBackup() {
  const { backups, createUserBackup, downloadBackup, restoreBackup, deleteBackup } = useBackup();
  const { addNotification } = useNotifications();
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: '',
    onConfirm: null
  });

  const handleCreateBackup = useCallback(async () => {
    try {
      const backup = await createUserBackup();
      if (backup) {
        addNotification({
          type: 'backup',
          title: 'Kopia zapasowa',
          message: 'Kopia zapasowa została utworzona pomyślnie',
          priority: 'normal'
        });
      }
    } catch (error) {
      console.error('Backup creation failed:', error);
      addNotification({
        type: 'backup',
        title: 'Błąd kopii zapasowej',
        message: 'Wystąpił błąd podczas tworzenia kopii zapasowej',
        priority: 'high'
      });
    }
  }, [createUserBackup, addNotification]);

  const handleRestore = useCallback(async (backup) => {
    setConfirmDialog({
      isOpen: true,
      message: 'Czy na pewno chcesz przywrócić dane z tej kopii zapasowej?',
      onConfirm: async () => {
        try {
          await restoreBackup(backup);
          addNotification('Dane zostały przywrócone z kopii zapasowej', 'success');
        } catch (error) {
          console.error('Przywrócenie nieudane:', error);
          addNotification('Błąd podczas przywracania danych', 'error');
        }
        setConfirmDialog({ isOpen: false, message: '', onConfirm: null });
      }
    });
  }, [restoreBackup, addNotification]);

  const handleDelete = useCallback(async (backupId) => {
    setConfirmDialog({
      isOpen: true,
      message: 'Czy na pewno chcesz usunąć tę kopię zapasową?',
      onConfirm: async () => {
        try {
          await deleteBackup(backupId);
          addNotification('Kopia zapasowa została usunięta', 'success');
        } catch (error) {
          console.error('Usuwanie nieudane:', error);
          addNotification('Błąd podczas usuwania kopii zapasowej', 'error');
        }
        setConfirmDialog({ isOpen: false, message: '', onConfirm: null });
      }
    });
  }, [deleteBackup, addNotification]);

  return (
    <div>
      <h3>Kopie zapasowe danych</h3>
      <button onClick={handleCreateBackup}>Utwórz kopię zapasową</button>
      
      <div>
        {backups.length === 0 ? (
          <p>Nie masz jeszcze żadnych kopii zapasowych</p>
        ) : (
          <ul>
            {backups.map(backup => (
              <li key={backup.id}>
                <div>
                  <span>Data utworzenia: {new Date(backup.createdAt).toLocaleString()}</span>
                  <span>Wielkość: {backup.size ? (backup.size / 1024).toFixed(2) : 0} KB</span>
                </div>
                <div>
                  <button onClick={() => downloadBackup(backup)}>Pobierz</button>
                  <button onClick={() => handleRestore(backup)}>Przywróć</button>
                  <button onClick={() => handleDelete(backup.id)}>Usuń</button>
                </div>
              </li>
            ))}
          </ul>
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