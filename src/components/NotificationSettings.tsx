import React, { useState } from "react";

const NotificationSettings = () => {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);

  return (
    <div className="p-4 border rounded-md shadow-sm max-w-md">
      <h2 className="text-2xl font-bold mb-4">Notification Settings</h2>
      
      <div className="flex items-center justify-between mb-4">
        <span>Email Notifications</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={emailEnabled} 
            onChange={() => setEmailEnabled(!emailEnabled)}
          />
          <div className="w-11 h-6 bg-gray-200 rounded-full peer-focus:ring-2 peer-focus:ring-blue-500 dark:bg-gray-700 transition-colors duration-200 ease-in-out peer-checked:bg-blue-600"></div>
          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-5"></div>
        </label>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <span>SMS Notifications</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={smsEnabled} 
            onChange={() => setSmsEnabled(!smsEnabled)}
          />
          <div className="w-11 h-6 bg-gray-200 rounded-full peer-focus:ring-2 peer-focus:ring-blue-500 dark:bg-gray-700 transition-colors duration-200 ease-in-out peer-checked:bg-blue-600"></div>
          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-5"></div>
        </label>
      </div>
      
      <div className="flex items-center justify-between">
        <span>Push Notifications</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={pushEnabled} 
            onChange={() => setPushEnabled(!pushEnabled)}
          />
          <div className="w-11 h-6 bg-gray-200 rounded-full peer-focus:ring-2 peer-focus:ring-blue-500 dark:bg-gray-700 transition-colors duration-200 ease-in-out peer-checked:bg-blue-600"></div>
          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-5"></div>
        </label>
      </div>
    </div>
  );
};

export default NotificationSettings;
