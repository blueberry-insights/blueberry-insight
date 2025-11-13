// ports/SessionReader.ts
export interface SessionReader { currentUserId(): Promise<string | null>; }

