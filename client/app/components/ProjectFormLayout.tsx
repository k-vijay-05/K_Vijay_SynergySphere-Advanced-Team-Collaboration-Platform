'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ProjectForm from './ProjectForm';

interface ProjectManager {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface ProjectFormData {
  name: string;
  tags: string[];
  projectManager: ProjectManager | null;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  image: string | null;
  description: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  projectId?: string;
}

interface ProjectFormLayoutProps {
  initialData?: Partial<ProjectFormData>;
  isEditing?: boolean;
  projectId?: string;
}

export default function ProjectFormLayout({ initialData, isEditing = false, projectId }: ProjectFormLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load notifications data
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const notificationsResponse = await fetch('/data/notifications.json');
        const notificationsData = await notificationsResponse.json();
        setNotifications(notificationsData);
      } catch (error) {
        console.error('Error loading notifications:', error);
        setNotifications([]);
      }
    };

    loadNotifications();
  }, []);

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const handleSave = (data: ProjectFormData) => {
    console.log('Saving project:', data);
    // In a real app, this would save to the backend
    // For now, just redirect back to projects
    window.location.href = '/projects';
  };

  const handleDiscard = () => {
    if (confirm('Are you sure you want to discard your changes?')) {
      window.location.href = '/projects';
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        currentPath="/projects"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          currentPath="/projects"
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
        />

        {/* Form Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <ProjectForm
            initialData={initialData}
            onSave={handleSave}
            onDiscard={handleDiscard}
            isEditing={isEditing}
          />
        </main>
      </div>
    </div>
  );
}
