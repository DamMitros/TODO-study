"use client";

import { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { useUser } from '../context/UserContext';
import Notification from './Notification';

export default function TaskDataManager() {
  const { tasks, addTask } = useTasks();
  const { user } = useUser();
  const [notification, setNotification] = useState(null);
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const exportToJSON = () => {
    try {
      const userTasks = tasks.filter(task => task.userId === user.uid);
      const dataStr = JSON.stringify(userTasks, null, 2);
      downloadFile(dataStr, 'tasks.json', 'application/json');
      showNotification('Pomyślnie wyeksportowano zadania do JSON', 'success');
    } catch (error) {
      showNotification('Błąd podczas eksportu do JSON', 'error');
    }
  };

  const exportToCSV = () => {
    try {
      const userTasks = tasks.filter(task => task.userId === user.uid);
      const headers = ['title', 'description', 'location', 'repeat', 'importance', 'deadline', 'completed', 'completedAt', 'executionProgress', 'createdAt', 'updatedAt'];
      const csvContent = [
        headers.join(','),
        ...userTasks.map(task => 
          headers.map(header => 
            JSON.stringify(task[header] || '')
          ).join(',')
        )
      ].join('\n');
      
      downloadFile(csvContent, 'tasks.csv', 'text/csv');
      showNotification('Pomyślnie wyeksportowano zadania do CSV', 'success');
    } catch (error) {
      showNotification('Błąd podczas eksportu do CSV', 'error');
    }
  };

  const exportToXML = () => {
    try {
      const userTasks = tasks.filter(task => task.userId === user.uid);
      let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<tasks>\n';
      userTasks.forEach(task => {
        xmlContent += '  <task>\n';
        Object.entries(task).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            xmlContent += `    <${key}>${value}</${key}>\n`;
          }
        });
        xmlContent += '  </task>\n';
      });
      
      xmlContent += '</tasks>';
      downloadFile(xmlContent, 'tasks.xml', 'application/xml');
      showNotification('Pomyślnie wyeksportowano zadania do XML', 'success');
    } catch (error) {
      showNotification('Błąd podczas eksportu do XML', 'error');
    }
  };

  const downloadFile = (content, fileName, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const fileType = file.name.split('.').pop().toLowerCase();
      const content = await file.text();
      let importedTasks = [];
      let duplicateCount = 0;

      switch (fileType) {
        case 'json':
          importedTasks = JSON.parse(content);
          break;
        case 'csv':
          importedTasks = parseCSV(content);
          break;
        case 'xml':
          importedTasks = parseXML(content);
          break;
        default:
          throw new Error('Nieobsługiwany format pliku');
      }

      for (const task of importedTasks) {
        const isDuplicate = tasks.some(existingTask => 
          existingTask.userId === user.uid &&
          existingTask.title === task.title &&
          existingTask.deadline === task.deadline
        );

        if (!isDuplicate) {
          const { id, ...taskWithoutId } = task;
          const newTask = {
            ...taskWithoutId,
            userId: user.uid,
            createdAt: new Date().toISOString()
          };
          await addTask(newTask);
        } else {
          duplicateCount++;
        }
      }
      
      const message = `Zaimportowano ${importedTasks.length - duplicateCount} zadań` + 
        (duplicateCount > 0 ? ` (pominięto ${duplicateCount} duplikatów)` : '');
      showNotification(message, 'success');
    } catch (err) {
      showNotification('Błąd podczas importowania zadań: ' + err.message, 'error');
    }
    event.target.value = '';
  };

  const parseCSV = (content) => {
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => {
        try {
          return JSON.parse(v);
        } catch {
          return v;
        }
      });
      return headers.reduce((obj, header, i) => {
        obj[header] = values[i];
        return obj;
      }, {});
    });
  };

  const parseXML = (content) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, 'text/xml');
    const taskNodes = xmlDoc.getElementsByTagName('task');
    return Array.from(taskNodes).map(taskNode => {
      const task = {};
      Array.from(taskNode.children).forEach(child => {
        task[child.tagName] = child.textContent;
      });
      return task;
    });
  };

  return (
    <div>
      <h2>Zarządzanie Danymi Zadań</h2>
      
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
        />
      )}

      <div>
        <h3>Eksport Zadań</h3>
        <button onClick={exportToJSON}>Eksportuj do JSON</button>
        <button onClick={exportToCSV}>Eksportuj do CSV</button>
        <button onClick={exportToXML}>Eksportuj do XML</button>
      </div>

      <div>
        <h3>Import Zadań</h3>
        <input
          type="file"
          accept=".json,.csv,.xml"
          onChange={handleImport}
        />
      </div>
    </div>
  );
}