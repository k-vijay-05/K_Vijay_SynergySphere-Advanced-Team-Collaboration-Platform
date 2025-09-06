'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ProjectCard from './ProjectCard';

interface Project {
  id: string;
  title: string;
  tags: string[];
  image: string;
  deadline: string;
  daysRemaining: number;
  projectManager: {
    name: string;
    email: string;
    avatar: string;
  };
  taskCount: number;
  status: 'active' | 'planning' | 'urgent' | 'completed';
  description: string;
  createdAt: string;
  updatedAt: string;
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

export default function ProjectsLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load projects data
        const projectsResponse = await fetch('/data/projects.json');
        const projectsData = await projectsResponse.json();
        setProjects(projectsData);

        // Load notifications data
        const notificationsResponse = await fetch('/data/notifications.json');
        const notificationsData = await notificationsResponse.json();
        setNotifications(notificationsData);
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback data if fetch fails
        setProjects([
          {
            id: "1",
            title: "RD Services",
            tags: ["Services", "Customer Care"],
            image: "/api/placeholder/400/200",
            deadline: "2024-03-21",
            daysRemaining: 18,
            projectManager: {
              name: "Sarah Johnson",
              email: "sarah.johnson@company.com",
              avatar: "/api/placeholder/40/40"
            },
            taskCount: 10,
            status: "active",
            description: "Research and Development services for customer care improvements",
            createdAt: "2024-01-15",
            updatedAt: "2024-02-03"
          }
        ]);
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter projects based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
  }, [projects, searchQuery]);

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const handleEditProject = (project: Project) => {
    console.log('Edit project:', project);
    // In a real app, this would open an edit modal or navigate to edit page
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      setProjects(prev => prev.filter(project => project.id !== projectId));
      console.log('Delete project:', projectId);
    }
  };

  const handleNewProject = () => {
    console.log('Create new project');
    // In a real app, this would open a create project modal or navigate to create page
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Projects Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Title and Stats */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Projects</h1>
              <p className="text-gray-600">
                Manage and track all your projects in one place
              </p>
            </div>

            {/* Projects Grid */}
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'No projects found' : 'No projects yet'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search terms'
                    : 'Get started by creating your first project'
                  }
                </p>
                {!searchQuery && (
                  <button
                    onClick={handleNewProject}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Project
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                  />
                ))}
              </div>
            )}

            {/* Projects Summary */}
            {filteredProjects.length > 0 && (
              <div className="mt-8 bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Project Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {filteredProjects.filter(p => p.status === 'active').length}
                    </div>
                    <div className="text-sm text-gray-600">Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {filteredProjects.filter(p => p.status === 'planning').length}
                    </div>
                    <div className="text-sm text-gray-600">Planning</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {filteredProjects.filter(p => p.status === 'urgent').length}
                    </div>
                    <div className="text-sm text-gray-600">Urgent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {filteredProjects.filter(p => p.status === 'completed').length}
                    </div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
