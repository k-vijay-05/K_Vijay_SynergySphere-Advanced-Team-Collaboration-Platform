'use client';

import { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import TaskForm from '../../components/TaskForm';

interface TaskFormData {
  name: string;
  assignee: {
    id: string;
    name: string;
    email: string;
  };
  project: {
    id: string;
    name: string;
  };
  tags: string[];
  deadline: string;
  image: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'urgent';
}

export default function NewTaskPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleSave = async (taskData: TaskFormData) => {
    // Here you would typically save the task to your backend
    console.log('Saving task:', taskData);
    
    // For now, just show a success message
    alert('Task saved successfully!');
  };

  const handleDiscard = () => {
    console.log('Discarding task');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        currentPath="/tasks/new"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          currentPath="/tasks/new"
          notifications={[]}
          onMarkAsRead={() => {}}
        />

        {/* Task Form Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <TaskForm
            onSave={handleSave}
            onDiscard={handleDiscard}
          />
        </main>
      </div>
    </div>
  );
}
