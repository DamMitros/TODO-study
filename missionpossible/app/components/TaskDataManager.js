"use client";

import { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { useUser } from '../context/UserContext';
import Notification from './Notification';

export default function TaskDataManager() {
  const { tasks, addTask } = useTasks();
  const { user } = useUser();
  const [notification, setNotification] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
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

  const isDuplicateTask = (task, existingTasks) => {
    return existingTasks.some(existingTask => 
      existingTask.title.toLowerCase() === task.title.toLowerCase() &&
      existingTask.description?.toLowerCase() === task.description?.toLowerCase() &&
      existingTask.userId === user.uid
    );
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv,.xml';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      if (!['json', 'csv', 'xml'].includes(fileExtension)) {
        setImportStatus({
          type: 'error',
          message: 'Nieprawidłowy format pliku. Dozwolone formaty: JSON, CSV, XML'
        });
        return;
      }

      try {
        const content = await file.text();
        let parsedData;
        switch (fileExtension) {
          case 'json':
            try {
              parsedData = JSON.parse(content);
              if (!Array.isArray(parsedData)) throw new Error('Invalid JSON structure');
            } catch (err) {
              throw new Error('Nieprawidłowa struktura pliku JSON');
            }
            break;

          case 'csv':
            try {
              parsedData = parseCSV(content);
              if (!Array.isArray(parsedData)) throw new Error('Invalid CSV structure');
            } catch (err) {
              throw new Error('Nieprawidłowa struktura pliku CSV');
            }
            break;

          case 'xml':
            try {
              parsedData = parseXML(content);
              if (!Array.isArray(parsedData)) throw new Error('Invalid XML structure');
            } catch (err) {
              throw new Error('Nieprawidłowa struktura pliku XML');
            }
            break;

          default:
            throw new Error('Nieobsługiwany format pliku');
        }

        const requiredFields = ['title']; 
        const isValidData = parsedData.every(task => 
          requiredFields.every(field => task.hasOwnProperty(field))
        );

        if (!isValidData) {
          throw new Error('Brakuje wymaganych pól w importowanych zadaniach');
        }

        const userTasks = tasks.filter(task => task.userId === user.uid);
        const newTasks = parsedData.filter(task => !isDuplicateTask(task, userTasks));
        const duplicateCount = parsedData.length - newTasks.length;
        for (const task of newTasks) {
          await addTask({
            ...task,
            userId: user.uid,
            createdAt: new Date().toISOString()
          });
        }

        setImportStatus({
          type: 'success',
          message: `Zaimportowano ${newTasks.length} zadań${duplicateCount > 0 ? `, pominięto ${duplicateCount} duplikatów` : ''}`
        });

      } catch (error) {
        setImportStatus({type: 'error', message: error.message || 'Wystąpił błąd podczas importowania pliku'});
      }
    };
    input.click();
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
    <div className="space-y-8">
      <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100"> Zarządzanie zadaniami</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h4 className="text-xl font-medium text-gray-800 dark:text-gray-200"> Eksport Zadań</h4>
          <div className="flex flex-col gap-4">
            <button onClick={exportToJSON} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200"> Eksportuj do JSON</button>
            <button onClick={exportToCSV} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200"> Eksportuj do CSV</button>
            <button onClick={exportToXML} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200"> Eksportuj do XML</button>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-xl font-medium text-gray-800 dark:text-gray-200">Import Zadań </h4>
          <div className="flex flex-col gap-4">
            <button onClick={handleImport} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Importuj zadania
            </button>
            <p className="text-sm text-gray-600 dark:text-gray-400">Obsługiwane formaty: JSON, CSV, XML </p>
          </div>

          {importStatus && (
            <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
              importStatus.type === 'success' 
                ? 'bg-green-50 text-green-800 dark:bg-green-900/50 dark:text-green-200' 
                : 'bg-red-50 text-red-800 dark:bg-red-900/50 dark:text-red-200'
            }`}>
              {importStatus.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span>{importStatus.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}