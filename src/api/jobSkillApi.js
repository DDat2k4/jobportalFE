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

// GET /api/job-skills/{id}
export const getJobSkillById = async (id) => {
  try {
    const res = await axios.get(`${API_URL}/job-skills/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};

// GET /api/job-skills?jobId=&skillId=&page=&size=
export const getJobSkills = async ({ jobId, skillId, page = 1, size = 10 } = {}) => {
  try {
    const params = {
      page,
      size,
      ...(jobId ? { jobId } : {}),
      ...(skillId ? { skillId } : {}),
    };
    const res = await axios.get(`${API_URL}/job-skills`, {
      params,
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = unwrap(res) ?? {};
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

// GET /api/job-skills/by-job/{jobId}
export const getJobSkillsByJobId = async (jobId) => {
  try {
    const res = await axios.get(`${API_URL}/job-skills/by-job/${jobId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = unwrap(res);
    return Array.isArray(data) ? data : (data?.items ?? []);
  } catch (err) {
    rethrow(err);
  }
};

// POST /api/job-skills
export const createJobSkill = async (jobSkill) => {
  try {
    const res = await axios.post(`${API_URL}/job-skills`, jobSkill, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};

// PUT /api/job-skills/{id}
export const updateJobSkill = async (id, jobSkill) => {
  try {
    const res = await axios.put(`${API_URL}/job-skills/${id}`, jobSkill, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};

// DELETE /api/job-skills/{id}
export const deleteJobSkill = async (id) => {
  try {
    const res = await axios.delete(`${API_URL}/job-skills/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};
