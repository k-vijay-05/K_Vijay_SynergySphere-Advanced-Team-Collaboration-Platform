'use client';

import { useState } from 'react';
import Image from 'next/image';

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

interface ProjectFormProps {
  initialData?: Partial<ProjectFormData>;
  onSave: (data: ProjectFormData) => void;
  onDiscard: () => void;
  isEditing?: boolean;
}

export default function ProjectForm({ initialData, onSave, onDiscard, isEditing = false }: ProjectFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: initialData?.name || '',
    tags: initialData?.tags || [],
    projectManager: initialData?.projectManager || null,
    deadline: initialData?.deadline || '',
    priority: initialData?.priority || 'medium',
    image: initialData?.image || null,
    description: initialData?.description || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data for dropdowns
  const availableTags = [
    'Services', 'Customer Care', 'Sales', 'Upgrade', 'Migration', 'Design', 
    'Mobile', 'Backend', 'Integration', 'Security', 'Compliance', 'Testing'
  ];

  const projectManagers: ProjectManager[] = [
    { id: '1', name: 'Sarah Johnson', email: 'sarah.johnson@company.com', avatar: '/api/placeholder/32/32' },
    { id: '2', name: 'Mike Chen', email: 'mike.chen@company.com', avatar: '/api/placeholder/32/32' },
    { id: '3', name: 'Emily Rodriguez', email: 'emily.rodriguez@company.com', avatar: '/api/placeholder/32/32' },
    { id: '4', name: 'Alex Thompson', email: 'alex.thompson@company.com', avatar: '/api/placeholder/32/32' },
    { id: '5', name: 'David Kim', email: 'david.kim@company.com', avatar: '/api/placeholder/32/32' },
    { id: '6', name: 'Lisa Wang', email: 'lisa.wang@company.com', avatar: '/api/placeholder/32/32' },
  ];

  const [showTagsDropdown, setShowTagsDropdown] = useState(false);
  const [showManagersDropdown, setShowManagersDropdown] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (formData.tags.length === 0) {
      newErrors.tags = 'At least one tag is required';
    }

    if (!formData.projectManager) {
      newErrors.projectManager = 'Project manager is required';
    }

    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required';
    } else {
      const deadlineDate = new Date(formData.deadline);
      const today = new Date();
      if (deadlineDate <= today) {
        newErrors.deadline = 'Deadline must be in the future';
      }
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ProjectFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleTagAdd = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      handleInputChange('tags', [...formData.tags, tag]);
    }
    setTagInput('');
    setShowTagsDropdown(false);
  };

  const handleTagRemove = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleManagerSelect = (manager: ProjectManager) => {
    handleInputChange('projectManager', manager);
    setShowManagersDropdown(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you would upload the file to a server
      const imageUrl = URL.createObjectURL(file);
      handleInputChange('image', imageUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSave(formData);
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <a href="/projects" className="hover:text-gray-700">
              Projects
            </a>
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            {isEditing ? 'Edit Project' : 'New Project'}
          </li>
        </ol>
      </nav>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 mb-8">
        <button
          type="button"
          onClick={onDiscard}
          className="px-6 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-lg shadow p-8">
          {/* Project Name */}
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter project name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Tags */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags *
            </label>
            <div className="relative">
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onFocus={() => setShowTagsDropdown(true)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                    errors.tags ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Add tags..."
                />
                {showTagsDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {availableTags
                      .filter(tag => 
                        tag.toLowerCase().includes(tagInput.toLowerCase()) && 
                        !formData.tags.includes(tag)
                      )
                      .map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleTagAdd(tag)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                        >
                          {tag}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
            {errors.tags && (
              <p className="mt-1 text-sm text-red-600">{errors.tags}</p>
            )}
          </div>

          {/* Project Manager */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Manager *
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowManagersDropdown(!showManagersDropdown)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-left ${
                  errors.projectManager ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {formData.projectManager ? (
                  <div className="flex items-center space-x-3">
                    <Image
                      src={formData.projectManager.avatar}
                      alt={formData.projectManager.name}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                    <span>{formData.projectManager.name}</span>
                  </div>
                ) : (
                  <span className="text-gray-500">Select project manager</span>
                )}
              </button>
              {showManagersDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {projectManagers.map((manager) => (
                    <button
                      key={manager.id}
                      type="button"
                      onClick={() => handleManagerSelect(manager)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center space-x-3"
                    >
                      <Image
                        src={manager.avatar}
                        alt={manager.name}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                      <div>
                        <div className="font-medium">{manager.name}</div>
                        <div className="text-sm text-gray-500">{manager.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.projectManager && (
              <p className="mt-1 text-sm text-red-600">{errors.projectManager}</p>
            )}
          </div>

          {/* Deadline */}
          <div className="mb-6">
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
              Deadline *
            </label>
            <input
              type="date"
              id="deadline"
              value={formData.deadline}
              onChange={(e) => handleInputChange('deadline', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                errors.deadline ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.deadline && (
              <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>
            )}
          </div>

          {/* Priority */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Priority *
            </label>
            <div className="space-y-3">
              {[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' }
              ].map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="priority"
                    value={option.value}
                    checked={formData.priority === option.value}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Image
            </label>
            <div className="flex items-center space-x-4">
              {formData.image && (
                <div className="relative">
                  <Image
                    src={formData.image}
                    alt="Project preview"
                    width={100}
                    height={100}
                    className="rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleInputChange('image', null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              <div>
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageUpload}
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
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              rows={6}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 resize-none ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter project description..."
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
