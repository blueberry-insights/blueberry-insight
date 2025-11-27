
export interface SessionReader { currentUserId(): Promise<string | null>; }

