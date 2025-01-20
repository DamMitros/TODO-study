"use client";

import { useUser } from "../context/UserContext";
import TaskDataManager from '../components/TaskDataManager';
import NotificationHistory from '../components/NotificationHistory';
import UserBackup from '../components/UserBackup';

export default function ProfilePage() {
  const { user } = useUser();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Profile</h1>
      <p>Witaj na swoim profilu</p>
      <p>Twoje dane:</p>
      <ul>
        <li>Email: {user.email}</li>
        <li>Email Verified: {user.emailVerified.toString()}</li>
        <li>Created At: {user.createdAt}</li>
        <li>Last Login At: {user.lastLoginAt}</li>
      </ul>

      <div>
        <UserBackup />
      </div>

      <div>
        <NotificationHistory />
      </div>
      
      <TaskDataManager />
    </div>
  );
}