import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const getToken = () => localStorage.getItem("access_token");

// Lấy danh sách công ty theo employerId
export const getEmployerCompanies = async (employerId) => {
  if (!employerId) return [];
  const res = await axios.get(`${API_URL}/employer-companies/employers/${employerId}/companies`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
  const items = res.data?.data ?? [];
  // Chuẩn hóa về { id, name } cho UI select
  return items.map((it, i) => ({
    id: it.companyId ?? i,
    name: it.companyName ?? `#${it.companyId ?? i}`,
  }));
};

// Lấy danh sách Users theo role có phân trang
export const getUsers = async ({ page = 1, limit = 8, role , keyword = "", status } = {}) => {
  const res = await axios.get(`${API_URL}/users`, {
    params: {
      role,
      page,
      limit,
      ...(keyword ? { keyword } : {}),
      // accept numeric 0/1/3 and keep empty undefined
      ...(status !== undefined && status !== null && status !== "" ? { status } : {}),
    },
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return {
    items: res.data?.data?.items || [],
    total: res.data?.data?.total || 0,
    page: res.data?.data?.page || page,
    loadMoreAble: res.data?.data?.loadMoreAble,
    totalSafe: res.data?.data?.totalSafe,
  };
};

// List users with pagination and optional role filter
export const getUsersForEmployerSeeker = async ({ page = 1, limit = 10, role } = {}) => {
  const params = {
    page,
    limit,
    ...(role ? { role } : {}),
  };
  const res = await axios.get(`${API_URL}/users`, {
    params,
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = res?.data?.data ?? res?.data ?? {};
  return {
    items: data.items ?? data.list ?? [],
    total: data.total ?? data.count ?? (Array.isArray(data.items) ? data.items.length : 0),
  };
};

// Companies of employer by userId
export const getEmployerCompaniesByUserId = async (userId) => {
  const res = await axios.get(`${API_URL}/companies`, {
    params: { userId },
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  // expected: array of { id, name, ... }
  return res?.data?.data ?? res?.data ?? [];
};

// Lấy user hiện tại
export const getMe = async () => {
  const res = await axios.get(`${API_URL}/users/me`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res?.data?.data ?? res?.data;
};

// Lấy thông tin user theo ID
export const getUserById = async (id) => {
  const res = await axios.get(`${API_URL}/users/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res?.data?.data ?? res?.data;
};

// Lấy tất cả user (admin)
export const getAllUsers = async () => {
  const res = await axios.get(`${API_URL}/users/all`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res?.data?.data ?? res?.data ?? [];
};

// Tạo user mới (admin) - backend nhận @RequestParam
export const createUser = async ({ username, email, passwordHash }) => {
  const res = await axios.post(`${API_URL}/users`, null, {
    params: { username, email, passwordHash },
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res?.data?.data ?? res?.data;
};

// Cập nhật user (admin/chính chủ)
// active: boolean -> backend sẽ map thành short 1/0
export const updateUser = async (id, { email, passwordHash, active } = {}) => {
  const params = {
    ...(email !== undefined ? { email } : {}),
    ...(passwordHash !== undefined ? { passwordHash } : {}),
    ...(active !== undefined ? { active } : {}),
  };
  const res = await axios.put(`${API_URL}/users/${id}`, null, {
    params,
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res?.data?.data ?? res?.data;
};

// Xóa user (admin)
export const deleteUser = async (userId) => {
  const res = await axios.delete(`${API_URL}/users/${userId}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res?.data?.data ?? res?.data;
};

// Kích hoạt user (admin)
export const activateUser = async (userId) => {
  const res = await axios.post(`${API_URL}/users/${userId}/activate`, null, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res?.data?.data ?? res?.data;
};

// Vô hiệu hóa user (admin)
export const deactivateUser = async (userId) => {
  const res = await axios.post(`${API_URL}/users/${userId}/deactivate`, null, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res?.data?.data ?? res?.data;
};

// Khóa user (admin)
export const lockUser = async (userId, until) => {
  const res = await axios.post(`${API_URL}/users/${userId}/lock`, null, {
    params: { ...(until ? { until } : {}) },
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res?.data?.data ?? res?.data;
};

// Mở khóa user (admin)
export const unlockUser = async (userId) => {
  const res = await axios.post(`${API_URL}/users/${userId}/unlock`, null, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res?.data?.data ?? res?.data;
};

// Reset số lần login sai (admin)
export const resetFailedAttempts = async (userId) => {
  const res = await axios.post(`${API_URL}/users/${userId}/reset-attempts`, null, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res?.data?.data ?? res?.data;
};

// Tăng số lần login sai (admin)
export const increaseFailedAttempts = async (userId) => {
  const res = await axios.post(`${API_URL}/users/${userId}/increase-attempts`, null, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res?.data?.data ?? res?.data;
};

// Tìm kiếm Users theo nhiều tiêu chí (admin)
export const searchUsers = async ({
  id,
  username,
  email,
  phone,
  active,        
  name,
  roles,            
  page = 1,
  size = 10,
  sortBy,
  asc,
} = {}) => {
  const res = await axios.get(`${API_URL}/users/search`, {
    params: {
      ...(id != null ? { id } : {}),
      ...(username ? { username } : {}),
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      ...(active != null && active !== "" ? { active } : {}),
      ...(name ? { name } : {}),
      ...(Array.isArray(roles) && roles.length ? { roles } : {}),
      page,
      size,
      ...(sortBy ? { sortBy } : {}),
      ...(asc != null ? { asc } : {}),
    },
    paramsSerializer: {
      serialize: (params) => {
        const sp = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v === undefined || v === null || v === "") return;
          if (k === "roles" && Array.isArray(v)) {
            v.forEach((val) => sp.append("roles", val));
          } else if (Array.isArray(v)) {
            v.forEach((val) => sp.append(k, val));
          } else {
            sp.append(k, v);
          }
        });
        return sp.toString();
      },
    },
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = res?.data?.data ?? res?.data ?? {};
  return {
    items: data.items ?? [],
    total: Number(data.total ?? 0),
    page: Number(data.page ?? page),
    size: Number(data.size ?? size),
  };
};
