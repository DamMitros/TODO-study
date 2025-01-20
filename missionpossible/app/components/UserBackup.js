"use client"
import { useBackup } from '../context/BackupContext';
import { useUser } from '../context/UserContext';
import { useNotifications } from '../context/NotificationContext';

export default function UserBackup() {
  const { user } = useUser();
  const { backups, createUserBackup, downloadBackup, restoreBackup, deleteBackup } = useBackup();
  const { addNotification } = useNotifications();

  const handleCreateBackup = async () => {
    try {
      await createUserBackup();
      addNotification('Kopia zapasowa została utworzona', 'success');
    } catch (error) {
      console.error('Backup nie stworzony:', error);
      addNotification('Błąd podczas tworzenia kopii zapasowej', 'error');
    }
  };

  const handleRestore = async (backup) => {
    if (window.confirm('Czy na pewno chcesz przywrócić dane z tej kopii zapasowej? Aktualne dane zostaną zastąpione.')) {
      try {
        await restoreBackup(backup);
        addNotification('Dane zostały przywrócone z kopii zapasowej', 'success');
      } catch (error) {
        console.error('Przywrócanie nieudane:', error);
        addNotification('Błąd podczas przywracania danych', 'error');
      }
    }
  };

  const handleDelete = async (backupId) => {
    if (window.confirm('Czy na pewno chcesz usunąć tę kopię zapasową?')) {
      try {
        await deleteBackup(backupId);
        addNotification('Kopia zapasowa została usunięta', 'success');
      } catch (error) {
        console.error('Usuwanie nieudane:', error);
        addNotification('Błąd podczas usuwania kopii zapasowej', 'error');
      }
    }
  };

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
    </div>
  );
}