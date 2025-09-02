import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/axiosConfig";
import {
    Task,
    ActivityLog,
    CommentItem,
    Assignee,
    Member,
} from "../../types";
import "./TaskModalStyles.css";
import { jwtDecode } from "jwt-decode";

interface TokenPayload {
    id: number;
    sub: string;
    iat: number;
    exp: number;
    roles: string[];
}

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskId: number | null;
    projectId: number;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, taskId, projectId }) => {
    const [loading, setLoading] = useState(false);
    const [task, setTask] = useState<Task | null>(null);

    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [comments, setComments] = useState<CommentItem[]>([]);
    const [newComment, setNewComment] = useState("");

    const [tags, setTags] = useState<string[]>([]);
    const [addingTag, setAddingTag] = useState(false);
    const [newTag, setNewTag] = useState("");

    const [assignees, setAssignees] = useState<Assignee[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [showAssigneePicker, setShowAssigneePicker] = useState(false);

    const [editingEffort, setEditingEffort] = useState(false);
    const [editingStatus, setEditingStatus] = useState(false);
    const [effortLevels, setEffortLevels] = useState<string[]>([]);

    const [pendingStatus, setPendingStatus] = useState<Task["status"] | null>(null);
    const [pendingEffort, setPendingEffort] = useState<string | null>(null);

    const [editingTitle, setEditingTitle] = useState(false);
    const [editingDescription, setEditingDescription] = useState(false);

    const [pendingTitle, setPendingTitle] = useState<string | null>(null);
    const [pendingDescription, setPendingDescription] = useState<string | null>(null);

    const [editingParent, setEditingParent] = useState(false);
    const [parentOptions, setParentOptions] = useState<Task[]>([]);
    const [pendingParentId, setPendingParentId] = useState<number | null>(null);

    const [editingStartDate, setEditingStartDate] = useState(false);
    const [editingEndDate, setEditingEndDate] = useState(false);
    const [pendingStartDate, setPendingStartDate] = useState<string | null>(null);
    const [pendingEndDate, setPendingEndDate] = useState<string | null>(null);

    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const token = localStorage.getItem("token");


    const isReady = isOpen && taskId != null;

    const availableMembers = useMemo(() => {
        const assignedIds = new Set(assignees.map((a) => a.userid));
        return members.filter((m) => !assignedIds.has(m.userId));
    }, [assignees, members]);

    const fetchEffortLevels = async () => {
        const res = await api.get<string[]>(`/api/tasks/effort-levels`);
        setEffortLevels(res.data);
    };

    const loadParentOptions = async () => {
        if (!projectId) return;
        const res = await api.get<Task[]>(`/api/tasks/by-project?projectId=${projectId}`);
        setParentOptions(
            res.data.filter(t => t.id !== taskId && t.status !== "DELETED") // exclude self and deleted tasks
        );
        setEditingParent(true);
    };


    const fetchTask = async () => {
        if (taskId == null) return;
        const res = await api.get<Task>(`/api/tasks/${taskId}`);
        setTask(res.data);
    };

    const fetchLogs = async () => {
        if (taskId == null) return;
        const res = await api.get<ActivityLog[]>(`/api/tasks/${taskId}/activity-logs`);
        setLogs(res.data.reverse());
    };

    const fetchComments = async () => {
        if (taskId == null) return;
        const res = await api.get<CommentItem[]>(`/api/tasks/${taskId}/comments`);
        setComments(res.data);
    };

    const fetchTags = async () => {
        if (taskId == null) return;
        const res = await api.get<string[]>(`/api/tasks/${taskId}/tags`);
        setTags(res.data);
    };

    const fetchAssignees = async () => {
        if (taskId == null) return;
        const res = await api.get<Assignee[]>(`/api/tasks/${taskId}/assignees`);
        setAssignees(res.data);
    };

    const fetchMembers = async () => {
        if (!projectId) return;
        const res = await api.get<Member[]>(`/api/projects/${projectId}/members`);
        setMembers(res.data);
    };

    const syncAll = async () => {
        if (!isReady) return;
        setLoading(true);
        try {
            await Promise.all([
                fetchTask(),
                fetchLogs(),
                fetchComments(),
                fetchTags(),
                fetchAssignees(),
                fetchMembers(),
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode<TokenPayload>(token);
                setCurrentUserId(decoded.id);
            } catch (err) {
                console.error("Invalid token", err);
            }
        }
    }, [token]);

    useEffect(() => {
        if (isReady) syncAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReady, taskId]);

    useEffect(() => {
        if (isReady) {
            fetchEffortLevels();
        }
    }, [isReady]);

    if (!isOpen) return null;


    const handleAddComment = async () => {
        if (!newComment.trim() || taskId == null) return;
        await api.post(`/api/tasks/${taskId}/comments`, { comment: newComment.trim() });
        setNewComment("");
        await fetchComments();
        await fetchLogs();
    };

    const handleDeleteComment = async (commentId: number) => {
        try {
            await api.delete(`/api/tasks/comments/${commentId}`);
            await fetchComments();
            await fetchLogs();
        } catch (err) {
            console.error("Failed to delete comment", err);
        }
    };

    const handleDeleteTag = async (tag: string) => {
        if (taskId == null) return;
        await api.delete(`/api/tasks/${taskId}/tags`, { params: { tag } });
        await fetchTags();
        await fetchLogs();
    };

    const handleAddTag = async () => {
        const tag = newTag.trim();
        if (!tag || taskId == null) return;
        await api.post(`/api/tasks/${taskId}/tags`, { tag });
        setNewTag("");
        setAddingTag(false);
        await fetchTags();
        await fetchLogs();
    };

    const handleRemoveAssignee = async (userId: number) => {
        if (taskId == null) return;
        await api.delete(`/api/tasks/${taskId}/assign/${userId}`);
        await fetchAssignees();
        await fetchLogs();
    };

    const handleAddAssignee = async (userId: number) => {
        if (taskId == null) return;
        await api.post(`/api/tasks/${taskId}/assign/${userId}`);
        setShowAssigneePicker(false);
        await fetchAssignees();
        await fetchLogs();
    };

    const updateTask = async (updates: Partial<Task>) => {
        if (!task) return;
        const payload = {
            title: updates.title ?? task.title,
            description: updates.description ?? task.description,
            startDate: task.startDate,
            endDate: task.endDate,
            status: updates.status ?? task.status,
            effortLevel: updates.effortLevel ?? task.effortLevel,
            parent: task.parent ? { id: task.parent.id } : null,
        };

        await api.put(`/api/tasks/${task.id}`, payload);
        await fetchTask(); 
        await fetchLogs();


        setEditingTitle(false);
        setEditingDescription(false);
        setEditingStatus(false);
        setEditingEffort(false);
    };

    const handleAddParent = async () => {
        if (!task || pendingParentId == null) return;

        const payload = {
            title: task.title,
            description: task.description,
            startDate: task.startDate,
            endDate: task.endDate,
            status: task.status,
            effortLevel: task.effortLevel,
            parent: { id: pendingParentId },
        };

        try {
            await api.put(`/api/tasks/${task.id}`, payload);
            await fetchTask();
            await fetchLogs();
            setEditingParent(false);
            setPendingParentId(null);
        } catch (err: any) {

            if (err.response?.data?.error) {
                alert(err.response.data.error); 
            } else {
                console.error(err);
                alert("Something went wrong");
            }
        }
    };

    const handleRemoveParent = async () => {
        if (!task || !task.parent) return;
        const payload = {
            title: task.title,
            description: task.description,
            startDate: task.startDate,
            endDate: task.endDate,
            status: task.status,
            effortLevel: task.effortLevel,
            parent: null,
        };
        await api.put(`/api/tasks/${task.id}`, payload);
        await fetchTask();
        await fetchLogs();
        setEditingParent(false);
    };

    const handleDeleteTask = async () => {
        if (!task) return;
        const confirmed = window.confirm("Are you sure you want to delete this task?");
        if (!confirmed) return;

        try {
            await api.delete(`/api/tasks/${task.id}`);
        } catch (err) {
            console.error("Failed to delete task", err);
            alert("Failed to delete task. Please try again.");
        }
    };

    const msToDays = (ms: number | null | undefined) => {
        if (!ms) return "—";
        return (ms / (1000 * 60 * 60 * 24)).toFixed(1) + " days";
    };

    return (
        <div className="task-modal-backdrop" onClick={onClose}>
            <div className="task-modal-box" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="task-modal-header">
                    <div className="task-header-left">
                        {task && (
                            <div className="task-meta">
                                #{task.id}
                            </div>
                        )}
                        <div>
                            {!editingTitle ? (
                                <div className="title-row">
                                    <h2>{task?.title}</h2>
                                    <button
                                        className="icon-btn"
                                        onClick={() => {
                                            setPendingTitle(task?.title ?? "");
                                            setEditingTitle(true);
                                        }}
                                    >
                                        ✎
                                    </button>
                                </div>
                            ) : (
                                <span>
                                    <input
                                        className="input-style"
                                        value={pendingTitle ?? ""}
                                        onChange={(e) => setPendingTitle(e.target.value)}
                                    />
                                    <button
                                        className="icon-btn"
                                        onClick={() => {
                                            if (!task || pendingTitle == null) return;
                                            updateTask({ title: pendingTitle });
                                        }}
                                    >
                                        ✔
                                    </button>
                                    <button
                                        className="icon-btn"
                                        onClick={() => {
                                            setEditingTitle(false);
                                            setPendingTitle(null);
                                        }}
                                    >
                                        ✕
                                    </button>
                                </span>
                            )}
                        </div>


                    </div>
                    <div className="task-header-actions">
                        {loading && <span className="sync-text">Syncing…</span>}
                        <button className="icon-btn refresh-btn" onClick={syncAll} title="Refresh">↻ Refresh</button>
                        <button className="icon-btn delete-btn" onClick={handleDeleteTask} title="Delete Task">🗑 Delete</button>
                        <button className="close-btn" onClick={onClose}>✕</button>
                    </div>
                </div>

                {/* Body */}
                <div className="task-modal-body">
                    {/* Left Pane */}
                    <div className="left-pane">

                        {task ? (
                            <div className="details">
                                <div className="task-description-section">
                                    <div className="section-title">
                                        Description:
                                        {!editingDescription ?
                                            <>
                                                <button
                                                    className="icon-btn"
                                                    onClick={() => {
                                                        setPendingDescription(task?.description ?? "");
                                                        setEditingDescription(true);
                                                    }}
                                                >
                                                    ✎
                                                </button></>
                                            :
                                            <></>
                                        }
                                    </div>{" "}

                                    {!editingDescription ? (
                                        <>
                                            <p>{task?.description || "—"}</p>
                                        </>
                                    ) : (
                                        <span>
                                            <textarea
                                                className="input-style"
                                                value={pendingDescription ?? ""}
                                                onChange={(e) => setPendingDescription(e.target.value)}
                                                style={{ width: "475px", height: "100px", resize: "none" }}
                                            />
                                            <button
                                                className="icon-btn"
                                                onClick={() => {
                                                    if (!task || pendingDescription == null) return;
                                                    updateTask({ description: pendingDescription });
                                                }}
                                            >
                                                ✔
                                            </button>
                                            <button
                                                className="icon-btn"
                                                onClick={() => {
                                                    setEditingDescription(false);
                                                    setPendingDescription(null);
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </span>
                                    )}
                                </div>

                                {/* Start Date editable */}
                                <div className="task-section-row">
                                    <div className="section-title">Start:</div>{" "}
                                    {!editingStartDate ? (
                                        <>
                                            {task.startDate ? new Date(task.startDate).toLocaleDateString() : "—"}
                                            <button
                                                className="icon-btn"
                                                onClick={() => setEditingStartDate(true)}
                                                title="Edit start date"
                                            >
                                                ✎
                                            </button>
                                        </>
                                    ) : (
                                        <span>
                                            <input
                                                type="date"
                                                className="input-style"
                                                value={pendingStartDate ?? task.startDate?.slice(0, 10) ?? ""}
                                                onChange={(e) => { setPendingStartDate(e.target.value); }}
                                            />
                                            <button
                                                className="icon-btn"
                                                onClick={async () => {
                                                    if (!task || !pendingStartDate) return;
                                                    const newStartDate = new Date(pendingStartDate);
                                                    newStartDate.setHours(0, 0, 0, 0);
                                                    const isoStart = pendingStartDate + "T00:00:00.000Z";

                                                    // Prevent end date < start date
                                                    let endDate = task.endDate;
                                                    if (endDate && new Date(endDate) < newStartDate) {
                                                        endDate = isoStart;
                                                    }

                                                    const payload = {
                                                        title: task.title,
                                                        description: task.description,
                                                        startDate: isoStart,
                                                        endDate: endDate,
                                                        status: task.status,
                                                        effortLevel: task.effortLevel,
                                                        parent: task.parent ? { id: task.parent.id } : null,
                                                    };
                                                    await api.put(`/api/tasks/${task.id}`, payload);
                                                    await fetchTask();
                                                    await fetchLogs();
                                                    setEditingStartDate(false);
                                                }}
                                            >
                                                ✔
                                            </button>
                                            <button className="icon-btn" onClick={() => setEditingStartDate(false)}>✕</button>
                                        </span>
                                    )}
                                </div>

                                {/* End Date editable */}
                                <div className="task-section-row">
                                    <div className="section-title">End:</div>{" "}
                                    {!editingEndDate ? (
                                        <>
                                            {task.endDate ? new Date(task.endDate).toLocaleDateString() : "—"}
                                            <button
                                                className="icon-btn"
                                                onClick={() => setEditingEndDate(true)}
                                                title="Edit end date"
                                            >
                                                ✎
                                            </button>
                                        </>
                                    ) : (
                                        <span>
                                            <input
                                                type="date"
                                                className="input-style"
                                                value={pendingEndDate ?? task.endDate?.slice(0, 10) ?? ""}
                                                onChange={(e) => setPendingEndDate(e.target.value)}
                                                min={task.startDate?.slice(0, 10) ?? undefined} // prevent end < start
                                            />
                                            <button
                                                className="icon-btn"
                                                onClick={async () => {
                                                    if (!task || !pendingEndDate) return;
                                                    const newEndDate = new Date(pendingEndDate);
                                                    newEndDate.setHours(0, 0, 0, 0);
                                                    const isoEnd = pendingEndDate + "T23:59:59.999Z";

                                                    const payload = {
                                                        title: task.title,
                                                        description: task.description,
                                                        startDate: task.startDate,
                                                        endDate: isoEnd,
                                                        status: task.status,
                                                        effortLevel: task.effortLevel,
                                                        parent: task.parent ? { id: task.parent.id } : null,
                                                    };
                                                    await api.put(`/api/tasks/${task.id}`, payload);
                                                    await fetchTask();
                                                    await fetchLogs();
                                                    setEditingEndDate(false);
                                                }}
                                            >
                                                ✔
                                            </button>
                                            <button className="icon-btn" onClick={() => setEditingEndDate(false)}>✕</button>
                                        </span>
                                    )}
                                </div>

                                <div className="task-section-row">
                                    <div className="section-title">Time Estimate:</div>{" "}
                                    {msToDays(task?.timeEstimate)}
                                </div>

                                {/* Status editable */}
                                <div className="task-section-row">
                                    <div className="section-title">Status:</div>{" "}
                                    {!editingStatus ? (
                                        <>
                                            {task.status.replace(/_/g, " ")}
                                            <button
                                                className="icon-btn"
                                                onClick={() => {
                                                    setPendingStatus(task.status);
                                                    setEditingStatus(true);
                                                }}
                                            >
                                                ✎
                                            </button>
                                        </>
                                    ) : (
                                        <span>
                                            <select
                                                className="input-style"
                                                value={pendingStatus ?? task.status}
                                                onChange={(e) => setPendingStatus(e.target.value as Task["status"])}
                                            >
                                                {["NOT_STARTED", "IN_PROGRESS", "DONE"].map((status) => (
                                                    <option key={status} value={status}>
                                                        {status.replace(/_/g, " ")}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                className="icon-btn"
                                                onClick={() => {
                                                    if (pendingStatus) {
                                                        updateTask({ status: pendingStatus });
                                                    }
                                                }}
                                            >
                                                ✔
                                            </button>
                                            <button
                                                className="icon-btn"
                                                onClick={() => {
                                                    setEditingStatus(false);
                                                    setPendingStatus(null);
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </span>
                                    )}
                                </div>


                                {/* Effort editable */}
                                <div className="task-section-row">
                                    <div className="section-title">Effort:</div>{" "}
                                    {!editingEffort ? (
                                        <>
                                            {task.effortLevel}
                                            <button className="icon-btn" onClick={() => {
                                                setPendingEffort(task.effortLevel);
                                                setEditingEffort(true);
                                            }}>✎</button>
                                        </>
                                    ) : (
                                        <span>
                                            <select
                                                className="input-style"
                                                value={pendingEffort ?? task.effortLevel}
                                                onChange={(e) => setPendingEffort(e.target.value)}
                                            >
                                                {effortLevels.map((lvl) => (
                                                    <option key={lvl} value={lvl}>{lvl}</option>
                                                ))}
                                            </select>
                                            <button
                                                className="icon-btn"
                                                onClick={() => {
                                                    if (pendingEffort) updateTask({ effortLevel: pendingEffort });
                                                }}
                                            >
                                                ✔
                                            </button>
                                            <button
                                                className="icon-btn"
                                                onClick={() => {
                                                    setEditingEffort(false);
                                                    setPendingEffort(null);
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </span>
                                    )}
                                </div>

                                {/* {task.parent && (
                                    <div><strong>Parent:</strong> {task.parent.title} (#{task.parent.id})</div>
                                )} */}


                                <div className="task-section-row">
                                    <div className="section-title">Parent:</div>{" "}
                                    {!task ? (
                                        "—"
                                    ) : task.parent ? (
                                        <>
                                            {task.parent.title} (# {task.parent.id})
                                            <button
                                                className="icon-btn"
                                                title="Remove parent"
                                                onClick={handleRemoveParent}
                                            >
                                                ✕
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="icon-btn" onClick={loadParentOptions}>+ Add parent</button>
                                            {editingParent && (
                                                <span>
                                                    <select
                                                        className="input-style"
                                                        value={pendingParentId ?? ""}
                                                        onChange={(e) => setPendingParentId(Number(e.target.value))}
                                                    >
                                                        <option value="" disabled>Select parent task…</option>
                                                        {parentOptions.map((t) => (
                                                            <option key={t.id} value={t.id}>{t.id} — {t.title}</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        className="icon-btn"
                                                        onClick={handleAddParent}
                                                    >
                                                        ✔
                                                    </button>
                                                    <button
                                                        className="icon-btn"
                                                        onClick={() => setEditingParent(false)}
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>

                                {Array.isArray((task as any).subtasks) && (task as any).subtasks.length > 0 && (
                                    <div className="task-section-row">
                                        <div className="section-title">Subtasks:</div>
                                        <ul>
                                            {(task as any).subtasks.map((s: any) => (
                                                <li key={s.id}>{s.title} — {s.status}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>Loading task…</div>
                        )}

                        {/* Tags */}
                        <div className="section-title">Tags</div>
                        <div className="chip-row">
                            {tags.map((t) => (
                                <span key={t} className="chip">
                                    {t}
                                    <button className="chip-delete-btn" onClick={() => handleDeleteTag(t)} title="Remove tag">✕</button>
                                </span>
                            ))}
                            {!addingTag ? (
                                <button className="icon-btn" onClick={() => setAddingTag(true)}>+ Add tag</button>
                            ) : (
                                <div className="input-row">
                                    <input
                                        className="input-style"
                                        value={newTag}
                                        placeholder="Enter tag"
                                        onChange={(e) => setNewTag(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                                    />
                                    <button className="small-btn" onClick={handleAddTag}>Add</button>
                                    <button className="icon-btn" onClick={() => { setAddingTag(false); setNewTag(""); }}>Cancel</button>
                                </div>
                            )}
                        </div>

                        {/* Assignees */}
                        <div className="section-title">Assignees</div>
                        <div className="chip-row">
                            {assignees.map((a) => (
                                <span key={a.userid} className="chip">
                                    {a.name}
                                    <button className="chip-delete-btn" onClick={() => handleRemoveAssignee(a.userid)} title="Remove assignee">✕</button>
                                </span>
                            ))}
                            {!showAssigneePicker ? (
                                <button className="icon-btn" onClick={() => setShowAssigneePicker(true)}>+ Add assignee</button>
                            ) : (
                                <div className="input-row">
                                    <select
                                        className="input-style"
                                        defaultValue=""
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val) handleAddAssignee(Number(val));
                                        }}
                                    >
                                        <option value="" disabled>Select member…</option>
                                        {availableMembers.map((m) => (
                                            <option key={m.userId} value={m.userId}>{m.name} ({m.role})</option>
                                        ))}
                                    </select>
                                    <button className="icon-btn" onClick={() => setShowAssigneePicker(false)}>Cancel</button>
                                </div>
                            )}
                        </div>

                        {/* Comments */}
                        <div className="section-title">Comments</div>
                        <div className="comments">
                            {comments.length === 0 ? (
                                <div className="placeholder">No comments on this task</div>
                            ) : (
                                comments.map((c) => (
                                    <div key={c.id} className="comment-card">
                                        <div className="comment-meta">
                                            <strong>{c.userName}</strong> • {new Date(c.createdAt).toLocaleString()}
                                            {c.userId === currentUserId && (
                                                <button
                                                    className="icon-btn"
                                                    style={{ float: "right" }}
                                                    onClick={() => handleDeleteComment(c.id)}
                                                    title="Delete comment"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                        <div className="comment-text">{c.comment}</div>
                                    </div>
                                ))
                            )}

                            <div className="input-row">
                                <input
                                    className="input-style"
                                    placeholder="Write a comment…"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                                />
                                <button className="small-btn" onClick={handleAddComment}>Submit</button>
                            </div>
                        </div>
                    </div>

                    {/* Right Pane — Activity Logs */}
                    <div className="right-pane">
                        <div className="section-title">Activity</div>
                        {logs.length === 0 ? (
                            <div className="placeholder">No activity yet.</div>
                        ) : (
                            <ul className="activity-list">
                                {logs.map((log) => (
                                    <li key={log.id} className="activity-item">
                                        <div className="activity-time">{new Date(log.createdAt).toLocaleString()}</div>
                                        <div>{log.details}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskModal;
