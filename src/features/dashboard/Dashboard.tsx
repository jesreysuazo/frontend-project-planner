import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProjects } from '../../services/projectService';
import { Project } from '../../types';
import api from '../../services/axiosConfig';
import './DashboardStyles.css';

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const navigate = useNavigate();

  const fetchProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMyProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const selectProject = (projectId: number) => {
    navigate(`/project/${projectId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const handleJoinProject = async () => {
    if (!inviteCode.trim()) return;
    try {
      await api.post('/api/projects/join', { inviteCode: inviteCode.trim() });
      setShowJoinModal(false);
      setInviteCode('');
      await fetchProjects();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to join project');
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      await api.post('/api/projects/create', {
        name: newProjectName.trim(),
        description: newProjectDescription.trim(),
        projectStartDate: null
      });
      setShowCreateModal(false);
      setNewProjectName('');
      setNewProjectDescription('');
      await fetchProjects();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create project');
    }
  };

  if (loading) return <p>Loading projects...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      {/* Header */}
      <header className="dashboard-header">
        <h2>Dashboard</h2>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* Dashboard Content */}
      <div className="dashboard-container">
        <div className="join-create-buttons">
          <button className="join-project-button create" onClick={() => setShowCreateModal(true)}>
            Create a Project
          </button>
          <button className="join-project-button" onClick={() => setShowJoinModal(true)}>
            Join a Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="no-projects">
            <p>No projects found.</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <div
                key={project.id}
                className="project-card"
                onClick={() => selectProject(project.id)}
              >
                <h3>{project.name}</h3>
                <p>{project.description || 'No description'}</p>
                <p>
                  Members: {project.members.map((m: any) => m.name).join(', ')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Join Project Modal */}
      {showJoinModal && (
        <div className="modal-backdrop" onClick={() => setShowJoinModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowJoinModal(false)}>✕</button>
            <div className="modal-content">
              <p className="modal-text">Please enter invite code</p>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="modal-input"
                placeholder="Invite code"
                onKeyDown={(e) => e.key === 'Enter' && handleJoinProject()}
              />
              <button className="modal-join-button" onClick={handleJoinProject}>
                Join
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            <div className="modal-content">
              <p className="modal-text">Create a new project</p>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="modal-input"
                placeholder="Project name"
              />
              <textarea
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                className="modal-input"
                placeholder="Project description"
              />
              <button className="modal-join-button" onClick={handleCreateProject}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
