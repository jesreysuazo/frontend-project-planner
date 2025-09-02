import axios from 'axios';
import API_BASE_URL from '../config/apiConfig';

const API_URL = API_BASE_URL;

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export const login = async (data: LoginData) => {
  const response = await axios.post(`${API_URL}/auth/login`, data);
  return response.data;
};

export const register = async (data: RegisterData) => {
  const response = await axios.post(`${API_URL}/auth/register`, data);
  return response.data;
};
