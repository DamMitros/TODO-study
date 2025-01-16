"use client";

import { useUser } from "../context/UserContext";

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
        <li>UID: {user.uid}</li>
        <li>Email: {user.email}</li>
        <li>Email Verified: {user.emailVerified.toString()}</li>
        <li>Is Anonymous: {user.isAnonymous.toString()}</li>
        <li>Provider Data: {JSON.stringify(user.providerData)}</li>
        <li>Created At: {user.createdAt}</li>
        <li>Last Login At: {user.lastLoginAt}</li>
      </ul>
    </div>
  );
}