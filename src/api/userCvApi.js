import axios from "axios";
import { createCvSection } from "./cvSectionApi.js";

const API_URL = import.meta.env.VITE_API_BASE_URL;
const getToken = () => localStorage.getItem("access_token");

// Lấy CV theo id
export const getUserCvById = async (id) => {
  const res = await axios.get(`${API_URL}/user-cvs/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.data;
};

// Lấy danh sách CV (phân trang + filter)
export const getUserCvs = async ({
  page = 1,
  size = 10,
  sortBy,
  asc,
  userId,
  title,
  templateCode,
  isDefault,
  ...rest
} = {}) => {
  const params = {
    page,
    size,
    ...(sortBy ? { sortBy } : {}),
    ...(asc !== undefined ? { asc } : {}),
    ...(userId ? { userId } : {}),
    ...(title ? { title } : {}),
    ...(templateCode ? { templateCode } : {}),
    ...(typeof isDefault === "boolean" ? { isDefault } : {}),
    ...(rest || {}),
  };
  const res = await axios.get(`${API_URL}/user-cvs`, {
    params,
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.data;
};

// Tạo CV
export const createUserCv = async (cv) => {
  const res = await axios.post(`${API_URL}/user-cvs`, cv, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });
  return res.data;
};

// Tạo CV + tạo luôn các section, trả về full CV
export const createUserCvWithSections = async (cv, sections = []) => {
  const createdResp = await createUserCv(cv);
  const createdCv = createdResp?.data;
  if (!createdCv?.id) throw new Error("Create CV failed");

  for (const s of sections) {
    await createCvSection({ ...s, cvId: createdCv.id });
  }
  return await getFullUserCv(createdCv.id);
};

// Cập nhật CV
export const updateUserCv = async (id, cv) => {
  const res = await axios.put(`${API_URL}/user-cvs/${id}`, cv, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });
  return res.data;
};

// Xóa CV
export const deleteUserCv = async (id) => {
  const res = await axios.delete(`${API_URL}/user-cvs/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.data;
};

// Set default CV (server ensures only one default)
export const setDefaultUserCv = async (id) => {
  const res = await axios.patch(`${API_URL}/user-cvs/${id}/default`, null, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.data;
};

// Lấy CV mặc định theo userId
export const getDefaultUserCv = async (userId) => {
  const res = await axios.get(`${API_URL}/user-cvs/default/${userId}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.data;
};

// Lấy full CV (bao gồm sections)
export const getFullUserCv = async (id) => {
  const res = await axios.get(`${API_URL}/user-cvs/${id}/full`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.data;
};

// Clone CV
export const cloneUserCv = async (id) => {
  const res = await axios.post(`${API_URL}/user-cvs/${id}/clone`, null, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.data;
};

// Cập nhật full CV (cv + sections)
export const updateFullUserCv = async (id, payload) => {
  const res = await axios.put(`${API_URL}/user-cvs/${id}/full`, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });
  return res.data;
};

/**
 * Lấy full CV và trả về trực tiếp data (throw nếu lỗi)
 */
export const getFullUserCvData = async (id) => {
  const res = await getFullUserCv(id);
  if (res?.success === false) throw new Error(res?.message || "Lấy full CV thất bại");
  return res?.data;
};

/**
 * Tạo CV + sections và trả về trực tiếp data (throw nếu lỗi)
 */
export const createUserCvWithSectionsData = async (cv, sections = []) => {
  const res = await createUserCvWithSections(cv, sections);
  if (res?.success === false) throw new Error(res?.message || "Tạo CV thất bại");
  return res?.data;
};

/**
 * Lấy CV mặc định (nếu chưa có thì tạo mới kèm sections), trả về trực tiếp data
 */
export const getOrCreateDefaultUserCvData = async (userId, init = {}, sections = []) => {
  const res = await getOrCreateDefaultUserCv(userId, init, sections);
  if (res?.success === false) throw new Error(res?.message || "Lấy/Tạo CV mặc định thất bại");
  return res?.data;
};

/**
 * Lấy CV theo id
 */
export const getUserCvByIdData = async (id) => {
  const res = await getUserCvById(id);
  if (res?.success === false) throw new Error(res?.message || "Lấy CV thất bại");
  return res?.data;
};

/**
 * Clone CV 
 */
export const cloneUserCvData = async (id) => {
  const res = await cloneUserCv(id);
  if (res?.success === false) throw new Error(res?.message || "Clone CV thất bại");
  return res?.data;
};

/**
 * Cập nhật full CV
 */
export const updateFullUserCvData = async (id, payload) => {
  const res = await updateFullUserCv(id, payload);
  if (res?.success === false) throw new Error(res?.message || "Cập nhật Full CV thất bại");
  return res?.data;
};
