import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/axiosConfig";
import { Project, Task } from "../../types";
import BoardView from "./components/BoardView";
import ListView from "./components/ListView";
import ScheduleView from "./components/ScheduleView";
import { DropResult } from "@hello-pangea/dnd";
import "./ProjectDashboardStyles.css";
import AddTaskModal from "../task/AddTaskModal";

type Tab = "BOARD" | "LIST" | "SCHEDULE";

const ProjectDashboard: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("LIST");
  const [showAddTask, setShowAddTask] = useState(false);
  const visibleTasks = tasks.filter(t => t.status !== "DELETED");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteProject = async () => {
    if (!projectId) return;
    setDeleting(true);
    try {
      await api.post(`/api/projects/${projectId}/delete`);
      navigate("/dashboard"); 
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete project");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const syncData = useCallback(async () => {
    if (!projectId) return;
    setLoadingTasks(true);
    try {
      const res = await api.get<Task[]>(`/api/tasks/by-project?projectId=${projectId}`);
      setTasks(res.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoadingTasks(false);
    }
  }, [projectId]);

  const fetchData = useCallback(async () => {
    if (!projectId) return;

    setLoadingProject(true);
    setLoadingTasks(true);
    setError("");

    try {
      const [projectRes, tasksRes] = await Promise.all([
        api.get<Project>(`/api/projects/${projectId}`),
        api.get<Task[]>(`/api/tasks/by-project?projectId=${projectId}`),
      ]);

      setProject(projectRes.data);
      setTasks(tasksRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load project data");
    } finally {
      setLoadingProject(false);
      setLoadingTasks(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    await syncData();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  if (error)
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={fetchData}>Retry</button>
      </div>
    );

  return (
    <div>
      {/* Header */}
      <header className="project-dashboard-header">
        <h2>Project Planner</h2>
        <button className="project-logout-button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <div className="dashboard-container">
        <div className="action-container">
          <button className="back-button" onClick={() => navigate("/dashboard")}>
            ← Back to Projects List
          </button>
          <button
            className="delete-project-button"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete Project
          </button>
        </div>


        {loadingProject ? (
          <p>Loading project info...</p>
        ) : project ? (
          <div className="project-info">
            <div>
              <h2 className="project-info-header">{project.name}</h2>
              <p>{project.description}</p>
            </div>

            <p className="project-info-text">Invite Code: {project.inviteCode}</p>
            <p className="project-info-text">
              Members:{" "}
              {project.members.length > 0 ? (
                project.members.map((m: any) => (
                  <span key={m.id} className="member-tag">{m.name}</span>
                ))
              ) : (
                "None"
              )}
            </p>
          </div>
        ) : (
          <p>No project found.</p>
        )}

        <hr />

        {/* Tabs + Add Task */}
        <div className="tabs-container">
          <div className="tabs">
            <button
              className={`tab-button ${activeTab === "LIST" ? "active" : ""}`}
              onClick={() => setActiveTab("LIST")}
            >
              List
            </button>
            <button
              className={`tab-button ${activeTab === "BOARD" ? "active" : ""}`}
              onClick={() => setActiveTab("BOARD")}
            >
              Boards
            </button>
            <button
              className={`tab-button ${activeTab === "SCHEDULE" ? "active" : ""}`}
              onClick={() => setActiveTab("SCHEDULE")}
            >
              Schedule
            </button>
          </div>

          <button className="add-task-button" onClick={() => setShowAddTask(true)}>
            + Add Task
          </button>
        </div>

        {/* Tab Content */}
        {loadingTasks ? (
          <p>Loading tasks...</p>
        ) : (
          <>

            {activeTab === "BOARD" && <BoardView tasks={visibleTasks} onDragEnd={handleDragEnd} />}
            {activeTab === "LIST" && <ListView tasks={visibleTasks} onTaskModalClose={syncData} />}
            {activeTab === "SCHEDULE" && project && <ScheduleView projectId={project.id} />}

          </>
        )}

        {showAddTask && (
          <AddTaskModal
            isOpen={showAddTask}
            onClose={() => setShowAddTask(false)}
            projectId={Number(projectId)}
            onTaskCreated={syncData}
          />
        )}

        {showDeleteModal && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <h3>Confirm Deletion</h3>
              <p>Are you sure you want to delete this project? This action cannot be undone.</p>
              <div className="modal-actions">
                <button
                  onClick={handleDeleteProject}
                  disabled={deleting}
                  className="confirm-delete"
                >
                  {deleting ? "Deleting..." : "Yes, Delete"}
                </button>
                <button className="confirm-delete cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProjectDashboard;
