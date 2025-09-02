import React, { useState } from "react";
import { Task } from "../../../types";
import "./ComponentStyles.css";
import TaskModal from "../../task/TaskModal";

interface Props {
    tasks: Task[];
    onTaskModalClose?: () => void;
}

const ListView: React.FC<Props> = ({ tasks, onTaskModalClose }) => {
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    return (
        <div className="schedule-view-container">
            <h3>Task List</h3>
            {tasks.length === 0 ? (
                <p>No tasks available.</p>
            ) : (
                <div className="task-list">
                    {/* Header  */}
                    <div className="task-row task-header">
                        <span></span>
                        <span>Name</span>
                        <span>Complexity</span>
                        <span>Due Date</span>
                    </div>

                    {/* Task  */}
                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            className="task-row"
                            onClick={() => setSelectedTask(task)}
                            style={{ cursor: "pointer" }}
                        >
                            <span className="task-check">
                                {task.status === "DONE" ? "✔" : ""}
                            </span>
                            <span>{task.title}</span>
                            <span style={{ textTransform: 'lowercase' }}>{task.effortLevel}</span>
                            <span>
                                {new Date(task.endDate).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "2-digit",
                                    year: "numeric",
                                })}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Task Modal */}
            {selectedTask && (
                <TaskModal
                    isOpen={true}
                    taskId={selectedTask.id}
                    projectId={selectedTask.projectId}
                    onClose={async () => {
                        setSelectedTask(null);
                        if (onTaskModalClose) await onTaskModalClose(); 
                    }}
                />
            )}
        </div>
    );
};

export default ListView;
