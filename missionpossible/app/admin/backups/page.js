"use client"

import { useState, useEffect } from 'react';
import { useBackup } from '../../context/BackupContext';
import { useUser } from '../../context/UserContext';
import { useNotifications } from '../../context/NotificationContext';

export default function AdminBackupsPage() {
  const { user } = useUser();
  const { createSystemBackup, getAllBackups, deleteBackup, downloadBackup, restoreSystemBackup } = useBackup();
  const [backups, setBackups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const { addNotification } = useNotifications();

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

  const handleDeleteBackup = async (backupId) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten backup?')) {
      try {
        await deleteBackup(backupId);
        await loadBackups();
        addNotification('Backup został usunięty', 'success');
      } catch (error) {
        console.error('Usunięcie backupu nieudane:', error);
        addNotification('Błąd podczas usuwania backupu', 'error');
      }
    }
  };

  const handleRestoreBackup = async (backup) => {
    if (window.confirm('Czy na pewno chcesz przywrócić system z tego backupu? Wszystkie aktualne dane zostaną zastąpione.')) {
      try {
        await restoreSystemBackup(backup);
        addNotification('System został przywrócony z backupu', 'success');
      } catch (error) {
        console.error('Przywracanie danych systemu nieudane:', error);
        addNotification('Błąd podczas przywracania systemu', 'error');
      }
    }
  };

  const filteredBackups = backups
    .filter(backup => 
      backup.timestamp.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const comparison = new Date(b.timestamp) - new Date(a.timestamp);
      return sortOrder === 'desc' ? comparison : -comparison;
    });

  return (
    <div>
      <h2>Zarządzanie Backupami</h2>
      <button onClick={handleSystemBackup}>Utwórz backup systemu</button>
      
      <div className="search-sort">
        <input
          type="text"
          placeholder="Szukaj backupu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={() => setSortOrder(order => order === 'desc' ? 'asc' : 'desc')}>
          {sortOrder === 'desc' ? '↓' : '↑'} Data
        </button>
      </div>

      <div>
        <h3>Lista backupów systemowych</h3>
        {filteredBackups.length === 0 ? (
          <p>Brak backupów systemowych</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data utworzenia</th>
                <th>Wielkość</th>
                <th>Liczba użytkowników</th>
                <th>Liczba zadań</th>
                <th>Liczba projektów</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filteredBackups.map(backup => (
                <tr key={backup.id}>
                  <td>{new Date(backup.timestamp).toLocaleString()}</td>
                  <td>{backup.size ? (backup.size / 1024 / 1024).toFixed(2) : 0} MB</td>
                  <td>{backup.data?.users?.length ?? 0}</td>
                  <td>{backup.data?.tasks?.length ?? 0}</td>
                  <td>{backup.data?.projects?.length ?? 0}</td>
                  <td>
                    <button onClick={() => downloadBackup(backup)}>Pobierz</button>
                    <button onClick={() => handleRestoreBackup(backup)}>Przywróć</button>
                    <button onClick={() => handleDeleteBackup(backup.id)}>Usuń</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}