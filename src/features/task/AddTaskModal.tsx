// src/features/task/AddTaskModal.tsx
import React, { useEffect, useState } from "react";
import api from "../../services/axiosConfig";
import { Task } from "../../types";
import "./TaskModalStyles.css";

interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: number;
    onTaskCreated?: () => void; // callback for parent refresh
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({
    isOpen,
    onClose,
    projectId,
    onTaskCreated,
}) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [effortLevel, setEffortLevel] = useState("");
    const [effortLevels, setEffortLevels] = useState<string[]>([]);

    const [parentId, setParentId] = useState<number | null>(null);
    const [parentOptions, setParentOptions] = useState<Task[]>([]);

    const [loading, setLoading] = useState(false);


    const fetchEffortLevels = async () => {
        const res = await api.get<string[]>(`/api/tasks/effort-levels`);
        setEffortLevels(res.data);
    };

    const loadParentOptions = async () => {
        if (!projectId) return;
        const res = await api.get<Task[]>(`/api/tasks/by-project?projectId=${projectId}`);
        setParentOptions(res.data);
    };

    useEffect(() => {
        if (isOpen) {
            fetchEffortLevels();
            loadParentOptions();
        }
    }, [isOpen]);

    if (!isOpen) return null;


    const handleSubmit = async () => {
        if (!title.trim() || !effortLevel) {
            alert("Title and effort level are required");
            return;
        }

        const payload = {
            title: title.trim(),
            description: description.trim() || "",
            startDate: startDate ? startDate + "T00:00:00.000Z" : null,
            endDate: endDate ? endDate + "T23:59:59.999Z" : null,
            projectId,
            parent: parentId ? { id: parentId } : null,
            effortLevel,
        };

        try {
            setLoading(true);
            await api.post(`/api/tasks`, payload);
            if (onTaskCreated) onTaskCreated();
            onClose();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to create task");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="task-modal-backdrop" onClick={onClose}>
            <div className="task-modal-box add-task-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="task-modal-header">
                    <div><strong>Create Task</strong></div>
                    <div className="task-header-actions">
                        {loading && <span className="sync-text">Saving…</span>}
                        <button className="close-btn" onClick={onClose}>✕</button>
                    </div>
                </div>

                {/* Body */}
                <div className="task-modal-body">
                    <div className="left-pane">
                        <div className="details">
                            <div>
                                <strong>Title:</strong>
                                <input
                                    className="input-style"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter task title"
                                />
                            </div>

                            <div>
                                <strong>Description:</strong>
                                <textarea
                                    className="input-style"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Enter description"
                                />
                            </div>

                            <div>
                                <strong>Start Date:</strong>
                                <input
                                    type="date"
                                    className="input-style"
                                    value={startDate ?? ""}
                                    onChange={(e) => setStartDate(e.target.value || null)}
                                />
                            </div>

                            <div>
                                <strong>End Date:</strong>
                                <input
                                    type="date"
                                    className="input-style"
                                    value={endDate ?? ""}
                                    onChange={(e) => setEndDate(e.target.value || null)}
                                    min={startDate ?? undefined}
                                />
                            </div>

                            <div>
                                <strong>Effort:</strong>
                                <select
                                    className="input-style"
                                    value={effortLevel}
                                    onChange={(e) => setEffortLevel(e.target.value)}
                                >
                                    <option value="" disabled>Select effort level…</option>
                                    {effortLevels.map((lvl) => (
                                        <option key={lvl} value={lvl}>{lvl}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <strong>Parent Task:</strong>
                                <select
                                    className="input-style"
                                    value={parentId ?? ""}
                                    onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
                                >
                                    <option value="">None</option>
                                    {parentOptions.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.id} — {t.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="actions-row">
                            <button className="small-btn" onClick={handleSubmit} disabled={loading}>
                                Create
                            </button>
                            <button className="icon-btn" onClick={onClose}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddTaskModal;
