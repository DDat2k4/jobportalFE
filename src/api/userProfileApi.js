import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;
const getToken = () => localStorage.getItem("access_token");

const unwrap = (res) => {
  const body = res?.data;
  if (body && typeof body === "object" && Object.prototype.hasOwnProperty.call(body, "success")) {
    if (body.success === false) {
      const msg = body.message || "Request failed";
      const err = new Error(msg);
      err.response = { status: res?.status, data: body };
      throw err;
    }
    return body.data ?? body;
  }
  return body;
};

const rethrow = (err) => {
  if (err?.response) {
    const { status, data } = err.response;
    let message = typeof data === "string" ? data : data?.message || err.message || "Request failed";
    if (status === 401) message = "Unauthorized. Please login again.";
    if (status === 403) message = "Access denied. You do not have permission.";
    const e = new Error(message);
    e.response = err.response;
    throw e;
  }
  throw err;
};

// GET /user-profiles/{id}
export const getUserProfile = async (id) => {
  try {
    const res = await axios.get(`${API_URL}/user-profiles/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};

// GET /user-profiles/by-user/{userId}
export const getUserProfileByUserId = async (userId) => {
  try {
    const res = await axios.get(`${API_URL}/user-profiles/by-user/${userId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};

// GET /user-profiles (paged list with filters)
export const getUserProfiles = async ({
  name,
  gender,
  headline,
  page = 1,
  size = 10,
  sortBy,
  asc,
} = {}) => {
  try {
    const params = {
      page,
      size,
      ...(name ? { name } : {}),
      ...(typeof gender === "number" ? { gender } : {}),
      ...(headline ? { headline } : {}),
      ...(sortBy ? { sortBy } : {}),
      ...(asc !== undefined ? { asc } : {}),
    };
    const res = await axios.get(`${API_URL}/user-profiles`, {
      params,
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = unwrap(res) ?? {};
    const box = data.items ? data : (res.data?.data ?? {});
    return {
      items: Array.isArray(box.items) ? box.items : [],
      total: Number(box.total ?? 0),
      page: Number(box.page ?? page),
      size: Number(box.size ?? size),
    };
  } catch (err) {
    rethrow(err);
  }
};

// POST /user-profiles
export const createUserProfile = async (profile) => {
  try {
    const res = await axios.post(`${API_URL}/user-profiles`, profile, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};

// PUT /user-profiles/{id}
export const updateUserProfile = async (id, profile) => {
  try {
    const res = await axios.put(`${API_URL}/user-profiles/${id}`, profile, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};

// DELETE /user-profiles/{userId}
export const deleteUserProfileByUserId = async (userId) => {
  try {
    const res = await axios.delete(`${API_URL}/user-profiles/${userId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};

// PATCH /user-profiles/{userId}/basic?name=...&avatar=...
export const updateUserProfileBasic = async (userId, { name, avatar }) => {
  if (!name || !avatar) throw new Error("name and avatar are required");
  try {
    const res = await axios.patch(`${API_URL}/user-profiles/${userId}/basic`, null, {
      params: { name, avatar },
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};
