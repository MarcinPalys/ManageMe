export interface Project {
  id: string
  name: string
  description: string
}
export interface User {
  id: string;
  firstName: string;
  lastName: string;
}

export type Priority = 'low' | 'medium' | 'high';
export type Status = 'todo' | 'doing' | 'done';

export interface Story {
  id: string;
  name: string;
  description: string;
  priority: Priority;
  projectId: string;
  ownerId: string;
  createdAt: string;
  status: Status;
}