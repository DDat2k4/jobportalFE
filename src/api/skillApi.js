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

// GET /api/skills/{id}
export const getSkillById = async (id) => {
  try {
    const res = await axios.get(`${API_URL}/skills/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};

// GET /api/skills?name=&page=&size=
export const getSkills = async ({ name, page = 1, size = 10 } = {}) => {
  try {
    const params = {
      page,
      size,
      ...(name ? { name } : {}),
    };
    const res = await axios.get(`${API_URL}/skills`, {
      params,
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = unwrap(res) ?? {};
    // normalize to { items, total, page, size }
    const items = data.items ?? data?.content ?? [];
    return {
      items: Array.isArray(items) ? items : [],
      total: Number(data.total ?? data.totalElements ?? items.length ?? 0),
      page: Number(data.page ?? page),
      size: Number(data.size ?? size),
    };
  } catch (err) {
    rethrow(err);
  }
};

// POST /api/skills
export const createSkill = async (skill) => {
  try {
    const res = await axios.post(`${API_URL}/skills`, skill, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};

// PUT /api/skills/{id}
export const updateSkill = async (id, skill) => {
  try {
    const res = await axios.put(`${API_URL}/skills/${id}`, skill, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};

// DELETE /api/skills/{id}
export const deleteSkill = async (id) => {
  try {
    const res = await axios.delete(`${API_URL}/skills/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};
