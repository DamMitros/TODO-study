"use client";

import { useBackup } from '../context/BackupContext';
import { useNotifications } from '../context/NotificationContext';
import { useUser } from '../context/UserContext';
import { useCallback, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialogs';

export default function UserBackup() {
  const { backups, createUserBackup, downloadBackup, restoreBackup, deleteBackup } = useBackup();
  const { addNotification } = useNotifications();
  const { user } = useUser(); 
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
          priority: 'normal',
          userId: user?.email
        });
      }
    } catch (error) {
      // console.error('Backup stworzenie nieudane:', error);
      addNotification({
        type: 'backup',
        title: 'Błąd kopii zapasowej',
        message: 'Wystąpił błąd podczas tworzenia kopii zapasowej',
        priority: 'high',
        userId: user?.email 
      });
    }
  }, [createUserBackup, addNotification, user]);

  const handleRestore = useCallback(async (backup) => {
    setConfirmDialog({
      isOpen: true,
      message: 'Czy na pewno chcesz przywrócić dane z tej kopii zapasowej?',
      onConfirm: async () => {
        try {
          await restoreBackup(backup);
          addNotification({
            type: 'backup',
            title: 'Dane przywrócone',
            message: 'Dane zostały przywrócone z kopii zapasowej',
            priority: 'normal',
            userId: user?.email
          });
        } catch (error) {
          // console.error('Przywrócenie nieudane:', error);
          addNotification({
            type: 'backup',
            title: 'Błąd przywracania',
            message: 'Wystąpił błąd podczas przywracania kopii zapasowej',
            priority: 'high',
            userId: user?.email
          });
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
          addNotification({
            type: 'backup',
            title: 'Kopia zapasowa usunięta',
            message: 'Kopia zapasowa została usunięta',
            priority: 'normal',
            userId: user?.email 
          });
        } catch (error) {
          // console.error('Usuwanie nieudane:', error);
          addNotification({
            type: 'backup',
            title: 'Błąd usuwania kopii zapasowej',
            message: 'Wystąpił błąd podczas usuwania kopii zapasowej',
            priority: 'high',
            userId: user?.email
          });
        }
        setConfirmDialog({ isOpen: false, message: '', onConfirm: null });
      }
    });
  }, [deleteBackup, addNotification]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Kopie zapasowe danych </h3>
        <button onClick={handleCreateBackup} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 whitespace-nowrap"> Utwórz kopię</button>
      </div>
      
      <div className="overflow-y-auto max-h-[500px] pr-2">
        {backups.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 italic"> Nie masz jeszcze żadnych kopii zapasowych</p>
        ) : (
          <ul className="space-y-4">
            {backups.map(backup => (
              <li key={backup.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="break-all">
                    <span className="text-gray-700 dark:text-gray-300"> Data utworzenia: {new Date(backup.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex flex-row items-center justify-end gap-2">
                    <button onClick={() => downloadBackup(backup)}className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg min-w-[80px] justify-center transition-colors duration-200">Pobierz</button>
                    <button onClick={() => handleRestore(backup)} className="inline-flex items-center px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg min-w-[80px] justify-center transition-colors duration-200"> Przywróć</button>
                    <button onClick={() => handleDelete(backup.id)} className="inline-flex items-center px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg min-w-[80px] justify-center transition-colors duration-200">Usuń</button>
                  </div>
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