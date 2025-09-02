import api from './axiosConfig';
import { Project } from '../types'; // import the type from types folder

export const getMyProjects = async (): Promise<Project[]> => {
  const response = await api.get<Project[]>('/api/projects/my-projects');
  return response.data;
};
