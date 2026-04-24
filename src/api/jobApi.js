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
    let message =
      typeof data === "string"
        ? data
        : data?.message || err.message || "Request failed";
    if (status === 401) message = "Unauthorized. Please login again.";
    if (status === 403) message = "Access denied. You do not have permission.";
    const e = new Error(message);
    e.response = err.response;
    throw e;
  }
  throw err;
};

// Thêm job mới
export const createJob = async (jobData) => {
  try {
    const res = await axios.post(`${API_URL}/jobs`, jobData, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};

// Lấy chi tiết job theo id
export const getJobDetail = async (id) => {
  try {
    const res = await axios.get(`${API_URL}/jobs/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};

// Cập nhật job
export const updateJob = async (id, jobData) => {
  try {
    const res = await axios.put(`${API_URL}/jobs/${id}`, jobData, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};

// Xóa job
export const deleteJob = async (id) => {
  try {
    const res = await axios.delete(`${API_URL}/jobs/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};

// Lấy số lượng công việc theo career role
export const getJobCountsByCareerRole = async (status = 1) => {
  try {
    const res = await axios.get(`${API_URL}/jobs/count-by-career-role`, {
      params: { status },
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = unwrap(res);
    return Array.isArray(data) ? data : data?.items ?? [];
  } catch (err) {
    rethrow(err);
  }
};

// Lấy số lượng công việc theo industry
export const getJobCountsByIndustry = async (status = 1) => {
  try {
    const res = await axios.get(`${API_URL}/jobs/count-by-industry`, {
      params: { status },
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = unwrap(res);
    return Array.isArray(data) ? data : data?.items ?? [];
  } catch (err) {
    rethrow(err);
  }
};

// Lấy danh sách công việc (có phân trang và filter)
export const getJobs = async ({
  page = 1,
  size = 10,
  keyword,
  title,
  companyId,
  careerRoleId,
  location,
  sortBy,
  asc,
} = {}) => {
  try {
    const params = {
      page,
      size,
      ...(keyword ? { keyword } : {}),
      ...(title ? { title } : {}),
      ...(companyId ? { companyId } : {}),
      ...(careerRoleId ? { careerRoleId: careerRoleId } : {}),
      ...(location ? { location } : {}),
      ...(sortBy ? { sortBy } : {}),
      ...(typeof asc === "boolean" ? { asc } : {}),
    };

    const res = await axios.get(`${API_URL}/jobs`, {
      params,
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    const data = unwrap(res) ?? {};
    return {
      items: data.items ?? [],
      total: data.total ?? 0,
      page: data.page ?? page,
      size: data.size ?? size,
    };
  } catch (err) {
    rethrow(err);
  }
};
