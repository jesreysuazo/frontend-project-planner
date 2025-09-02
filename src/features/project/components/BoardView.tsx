import "./ComponentStyles.css";
import React, { useState } from "react";
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
} from "@hello-pangea/dnd";
import { Task } from "../../../types";
import TaskModal from "../../task/TaskModal";
import api from "../../../services/axiosConfig";

const STATUS_COLUMNS = ["NOT_STARTED", "IN_PROGRESS", "DONE"] as const;

interface BoardViewProps {
    tasks: Task[];
    onDragEnd?: (result: DropResult) => void; // optional if we handle drag ourselves
    onTaskModalClose?: () => void; // optional callback
}

const BoardView: React.FC<BoardViewProps> = ({ tasks, onDragEnd, onTaskModalClose }) => {
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const taskId = Number(result.draggableId);
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        const newStatus = result.destination.droppableId as Task["status"];
        if (task.status === newStatus) return; // nothing changed

        // Payload as per backend
        const payload = {
            title: task.title,
            description: task.description,
            startDate: task.startDate,
            endDate: task.endDate,
            status: newStatus,
            effortLevel: task.effortLevel,
            parent: task.parent ? { id: task.parent.id } : null,
        };

        try {
            await api.put(`/api/tasks/${task.id}`, payload);
            if (onDragEnd) onDragEnd(result); 
        } catch (err: any) {

            if (err.response?.data?.error) {
                alert(err.response.data.error); 
            } else {
                console.error(err);
                alert("Something went wrong");
            }
        }
    };

    return (
        <>
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="board-container">
                    {STATUS_COLUMNS.map((status) => (
                        <Droppable key={status} droppableId={status}>
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`board-column ${status.toLowerCase()}`} // add status class
                                >
                                    <h4 className="board-title">
                                        {status.replace("_", " ")}
                                    </h4>
                                    {tasks
                                        .filter((t) => t.status === status)
                                        .map((task, index) => (
                                            <Draggable
                                                key={task.id.toString()}
                                                draggableId={task.id.toString()}
                                                index={index}
                                            >
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className="task-card"
                                                        style={provided.draggableProps.style}
                                                        onClick={() => setSelectedTask(task)}
                                                    >
                                                        <p className="task-card-header">{task.title}</p>
                                                        <p className="task-desc">{task.description}</p>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    ))}
                </div>
            </DragDropContext>

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
        </>
    );
};

export default BoardView;
