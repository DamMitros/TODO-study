"use client"

import { useState, useEffect } from 'react';
import { useBackup } from '../../context/BackupContext';
import { useUser } from '../../context/UserContext';
import { useNotifications } from '../../context/NotificationContext';
import ConfirmDialog from '../../components/ConfirmDialogs';

export default function AdminBackupsPage() {
  const { user } = useUser();
  const { createSystemBackup, getAllBackups, deleteBackup, downloadBackup, restoreSystemBackup } = useBackup();
  const [backups, setBackups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const { addNotification } = useNotifications();
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: '',
    onConfirm: null
  });
  
  useEffect(() => {
    if (user?.isAdmin) {
      loadBackups();
    }
  }, [user]);

  const loadBackups = async () => {
    const systemBackups = await getAllBackups();
    setBackups(systemBackups);
  };

  const handleSystemBackup = async () => {
    try {
      await createSystemBackup();
      await loadBackups();
      addNotification('Backup systemu został utworzony pomyślnie', 'success');
    } catch (error) {
      console.error('System backup nieudany:', error);
      addNotification('Wystąpił błąd podczas tworzenia backupu', 'error');
    }
  };

  const showConfirmDialog = (message, onConfirm) => {
    setConfirmDialog({
      isOpen: true,
      message,
      onConfirm
    });
  };

  const handleDeleteBackup = async (backupId) => {
    showConfirmDialog(
      'Czy na pewno chcesz usunąć ten backup?',
      async () => {
        try {
          await deleteBackup(backupId);
          await loadBackups();
          addNotification('Backup został usunięty', 'success');
        } catch (error) {
          console.error('Usunięcie backupu nieudane:', error);
          addNotification('Błąd podczas usuwania backupu', 'error');
        }
        setConfirmDialog({ isOpen: false, message: '', onConfirm: null });
      }
    );
  };

  const handleRestoreBackup = async (backup) => {
    showConfirmDialog(
      'Czy na pewno chcesz przywrócić system z tego backupu? Wszystkie aktualne dane zostaną zastąpione.',
      async () => {
        try {
          await restoreSystemBackup(backup);
          addNotification('System został przywrócony z backupu', 'success');
        } catch (error) {
          console.error('Przywracanie danych systemu nieudane:', error);
          addNotification('Błąd podczas przywracania systemu', 'error');
        }
        setConfirmDialog({ isOpen: false, message: '', onConfirm: null });
      }
    );
  };

  const filteredBackups = backups
    .filter(backup => new Date(backup.timestamp).toLocaleString().toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => 
      {const comparison = new Date(b.timestamp) - new Date(a.timestamp);
      return sortOrder === 'desc' ? comparison : -comparison;
    });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Zarządzanie Backupami</h2>
        <button onClick={handleSystemBackup} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center gap-2"> Utwórz backup systemu</button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="text"
            placeholder="Szukaj backupu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button onClick={() => setSortOrder(order => order === 'desc' ? 'asc' : 'desc')} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 flex items-center gap-2">
            <span>Data</span>
            {sortOrder === 'desc' ? '↓' : '↑'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data utworzenia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Wielkość</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Użytkownicy</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Zadania</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Projekty</th>
                <th className="px-24 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Akcje</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredBackups.map(backup => (
                <tr key={backup.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{new Date(backup.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{backup.size ? (backup.size / 1024 / 1024).toFixed(2) : 0} MB</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{backup.data?.users?.length ?? 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{backup.data?.tasks?.length ?? 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{backup.data?.projects?.length ?? 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={() => downloadBackup(backup)} className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">Pobierz</button>
                    <button onClick={() => handleRestoreBackup(backup)} className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200">Przywróć</button>
                    <button onClick={() => handleDeleteBackup(backup.id)} className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200">Usuń</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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