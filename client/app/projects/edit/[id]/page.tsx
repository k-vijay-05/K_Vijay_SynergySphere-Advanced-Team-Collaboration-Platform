import ProjectFormLayout from '../../../components/ProjectFormLayout';

interface EditProjectPageProps {
  params: {
    id: string;
  };
}

export default function EditProjectPage({ params }: EditProjectPageProps) {
  // In a real app, you would fetch the project data based on the ID
  const initialData = {
    name: 'Sample Project',
    tags: ['Services', 'Customer Care'],
    projectManager: {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      avatar: '/api/placeholder/32/32'
    },
    deadline: '2024-03-21',
    priority: 'high' as const,
    image: null,
    description: 'This is a sample project description for editing purposes.'
  };

  return (
    <ProjectFormLayout 
      initialData={initialData}
      isEditing={true}
      projectId={params.id}
    />
  );
}
