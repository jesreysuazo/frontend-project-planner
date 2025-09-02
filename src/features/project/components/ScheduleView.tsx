import React, { useEffect, useState } from "react";
import api from "../../../services/axiosConfig";
import { ScheduleTask } from "../../../types";
import "./ComponentStyles.css";

interface Props {
    projectId: number;
}

const ScheduleView: React.FC<Props> = ({ projectId }) => {
    const [tasks, setTasks] = useState<ScheduleTask[]>([]);
    const [totalDays, setTotalDays] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchSchedule = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await api.post(`/api/projects/${projectId}/schedule`);
            setTasks(res.data.tasks);
            setTotalDays(res.data.totalDays);

            sessionStorage.setItem(
                `project-${projectId}-schedule`,
                JSON.stringify({ tasks: res.data.tasks, totalDays: res.data.totalDays })
            );
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to generate schedule");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const stored = sessionStorage.getItem(`project-${projectId}-schedule`);
        if (stored) {
            const parsed = JSON.parse(stored);
            setTasks(parsed.tasks);
            setTotalDays(parsed.totalDays);
        }
    }, [projectId]);


    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    };

    const formatStatus = (status: string) => {
        const str = status.replace(/_/g, " ");
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    return (
        <div className="schedule-view-container">
            <h3>Project Schedule</h3>
            <button className="generate-schedule-button" onClick={fetchSchedule}>
                {loading ? "Generating..." : "Generate Schedule"}
            </button>

            {error && <p className="error">{error}</p>}

            {tasks.length > 0 && (
                <div className="schedule-timeline">
                    <p>Total Project Duration: {totalDays} days</p>

                    {tasks.map((task) => (
                        <div key={task.id} className="task-card">
                            <h4>{task.title}</h4>
                            <p className="task-desc">
                                <strong>Status:</strong> {formatStatus(task.status)}
                            </p>
                            <p className="task-desc">
                                <strong>Start:</strong> {formatDate(task.startDate)}
                            </p>
                            <p className="task-desc">
                                <strong>End:</strong> {formatDate(task.endDate)}
                            </p>

                            {task.subtasks && task.subtasks.length > 0 && (
                                <div className="subtasks">
                                    <h5>Subtasks:</h5>
                                    <ul>
                                        {task.subtasks.map((sub) => (
                                            <li key={sub.id}>
                                                {sub.title} - <strong>{formatStatus(sub.status)}</strong>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ScheduleView;
