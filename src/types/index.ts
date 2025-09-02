export interface Member {
    userId: number;
    name: string;
    role: string;
}

export interface Project {
    id: number;
    name: string;
    description: string;
    inviteCode: string;
    projectStartDate: string | null;
    members: Member[];
}


export interface Task {
    id: number;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    parent: { id: number; title: string } | null;
    projectId: number;
    createdById: number;
    timeEstimate: number;
    status: "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "DELETED" | "ON_HOLD";
    createdAt: string;
    updatedAt: string;
    effortLevel: string;
}

export interface ActivityLog {
    id: number;
    taskId: number;
    userId: number;
    action: string;
    details: string;
    createdAt: string;
}

export interface CommentItem {
    id: number;
    taskId: number;
    userId: number;
    comment: string;
    createdAt: string;
    updatedAt: string;
    userName: string;
}

export interface Assignee {
    userid: number;
    name: string;
}

export interface ScheduleTask extends Task {
    subtasks: {
        id: number;
        title: string;
        status: "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "ON_HOLD" | "DELETED";
    }[];
}