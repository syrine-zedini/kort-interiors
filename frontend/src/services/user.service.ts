import api from '@/libs/axios';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  address?: string;
  role?: string;
}

export interface UpdateProfileData {
  username?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  oldPassword?: string;
  newPassword?: string;
}

export const getUserProfile = async (): Promise<UserProfile> => {
  const response = await api.get('/users/profile');
  return response.data;
};

export const updateUserProfile = async (data: UpdateProfileData): Promise<UserProfile> => {
  const response = await api.patch('/users/update', data);
  return response.data.user;
};
