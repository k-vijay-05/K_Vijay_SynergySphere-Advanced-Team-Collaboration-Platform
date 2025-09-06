'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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

interface TaskFormErrors {
  name?: string;
  assignee?: string;
  project?: string;
  deadline?: string;
  description?: string;
}

interface TaskFormProps {
  onSave: (task: TaskFormData) => void;
  onDiscard: () => void;
  initialData?: Partial<TaskFormData>;
}

export default function TaskForm({ onSave, onDiscard, initialData }: TaskFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  const projectName = searchParams.get('projectName');

  const [formData, setFormData] = useState<TaskFormData>({
    name: initialData?.name || '',
    assignee: initialData?.assignee || { id: '', name: '', email: '' },
    project: initialData?.project || { 
      id: projectId || '', 
      name: projectName || '' 
    },
    tags: initialData?.tags || [],
    deadline: initialData?.deadline || '',
    image: initialData?.image || '',
    description: initialData?.description || '',
    priority: initialData?.priority || 'medium',
    status: initialData?.status || 'pending'
  });

  const [errors, setErrors] = useState<TaskFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Mock data for dropdowns
  const availableAssignees = [
    { id: '1', name: 'John Smith', email: 'john.smith@company.com' },
    { id: '2', name: 'Sarah Johnson', email: 'sarah.johnson@company.com' },
    { id: '3', name: 'Mike Chen', email: 'mike.chen@company.com' },
    { id: '4', name: 'Emily Rodriguez', email: 'emily.rodriguez@company.com' },
    { id: '5', name: 'David Kim', email: 'david.kim@company.com' }
  ];

  const availableProjects = [
    { id: '1', name: 'RD Services' },
    { id: '2', name: 'RD Sales' },
    { id: '3', name: 'RD Upgrade' },
    { id: '4', name: 'Mobile App Redesign' },
    { id: '5', name: 'API Integration' },
    { id: '6', name: 'Security Audit' }
  ];

  const availableTags = [
    'Design', 'Development', 'Testing', 'Documentation', 'Bug Fix', 'Feature',
    'UI/UX', 'Backend', 'Frontend', 'Database', 'API', 'Security'
  ];

  const validateForm = (): boolean => {
    const newErrors: TaskFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Task name is required';
    }

    if (!formData.assignee.id) {
      newErrors.assignee = 'Please select an assignee';
    }

    if (!formData.project.id) {
      newErrors.project = 'Please select a project';
    }

    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof TaskFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field as keyof TaskFormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleInputChange('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSave(formData);
      router.back();
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Are you sure you want to discard changes?')) {
      onDiscard();
      router.back();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li>
            <a href="/projects" className="hover:text-gray-700">
              Projects
            </a>
          </li>
          <li>
            <span className="text-gray-500">{'>'}</span>
          </li>
          {projectName ? (
            <>
              <li>
                <a href={`/tasks?project=${projectId}&projectName=${encodeURIComponent(projectName)}`} className="hover:text-gray-700">
                  {projectName}
                </a>
              </li>
              <li>
                <span className="text-gray-500">{'>'}</span>
              </li>
            </>
          ) : null}
          <li>
            <span className="text-gray-900 font-medium">New Task</span>
          </li>
        </ol>
      </nav>

      {/* Form Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-orange-600">Task Create/Edit View</h1>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handleDiscard}
            className="px-6 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Discard
          </button>
          <button
            type="submit"
            form="task-form"
            disabled={isSubmitting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Task Form */}
      <form id="task-form" onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Task Name */}
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 placeholder-gray-600 text-gray-900 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter task name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Assignee */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignee *
            </label>
            <button
              type="button"
              onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-left ${
                errors.assignee ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {formData.assignee.name ? (
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold mr-3">
                    {formData.assignee.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-gray-800 font-medium">{formData.assignee.name}</div>
                    <div className="text-sm text-gray-600">{formData.assignee.email}</div>
                  </div>
                </div>
              ) : (
                <span className="text-gray-600">Select assignee</span>
              )}
            </button>
            {showAssigneeDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {availableAssignees.map((assignee) => (
                  <button
                    key={assignee.id}
                    type="button"
                    onClick={() => {
                      handleInputChange('assignee', assignee);
                      setShowAssigneeDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold mr-3">
                        {assignee.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-gray-800 font-medium">{assignee.name}</div>
                        <div className="text-sm text-gray-600">{assignee.email}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {errors.assignee && (
              <p className="mt-1 text-sm text-red-600">{errors.assignee}</p>
            )}
          </div>

          {/* Project */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project *
            </label>
            <button
              type="button"
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-left ${
                errors.project ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {formData.project.name ? (
                <span className="text-gray-800 font-medium">{formData.project.name}</span>
              ) : (
                <span className="text-gray-600">Select project</span>
              )}
            </button>
            {showProjectDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {availableProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => {
                      handleInputChange('project', project);
                      setShowProjectDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 text-sm text-gray-800 font-medium border-b border-gray-100 last:border-b-0"
                  >
                    {project.name}
                  </button>
                ))}
              </div>
            )}
            {errors.project && (
              <p className="mt-1 text-sm text-red-600">{errors.project}</p>
            )}
          </div>

          {/* Tags */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 placeholder-gray-600 text-gray-900"
                placeholder="Add tags..."
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-3 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Add
              </button>
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
              Deadline *
            </label>
            <input
              type="date"
              id="deadline"
              value={formData.deadline}
              onChange={(e) => handleInputChange('deadline', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 placeholder-gray-600 text-gray-900 ${
                errors.deadline ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.deadline && (
              <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Image Upload */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image
            </label>
            <div className="flex items-center">
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      handleInputChange('image', e.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
              />
              <label
                htmlFor="image"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Image
              </label>
              {formData.image && (
                <span className="ml-3 text-sm text-gray-600">Image selected</span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              rows={6}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 resize-none placeholder-gray-600 text-gray-900 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter task description..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
