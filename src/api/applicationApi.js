import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;
const getToken = () => localStorage.getItem("access_token");

// unwrap backend ApiResponse or plain body
const unwrap = (res) => {
  const body = res?.data;
  if (body && typeof body === "object" && Object.prototype.hasOwnProperty.call(body, "success")) {
    if (body.success === false) {
      const e = new Error(body.message || "Request failed");
      e.response = { status: res?.status, data: body };
      throw e;
    }
    return body.data ?? body;
  }
  return body;
};

// normalize axios error
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

// GET /applications/{id}
export const getApplication = async (id) => {
  try {
    const res = await axios.get(`${API_URL}/applications/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};

// GET /applications
export const getApplications = async (params = {}) => {
  try {
    const res = await axios.get(`${API_URL}/applications`, {
      params,
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = unwrap(res) ?? {};
    const items = data?.items ?? data?.content ?? [];
    return {
      items,
      total: data?.total ?? data?.totalElements ?? items.length ?? 0,
      page: data?.page ?? data?.pageNumber ?? params.page ?? 1,
      size: data?.size ?? data?.pageSize ?? params.size ?? 10,
    };
  } catch (err) {
    rethrow(err);
  }
};

// POST /applications
export const createApplication = async (application) => {
  try {
    const res = await axios.post(`${API_URL}/applications`, application, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};

// PUT /applications/{id}
export const updateApplication = async (id, application) => {
  try {
    const res = await axios.put(`${API_URL}/applications/${id}`, application, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};

// DELETE /applications/{id}
export const deleteApplication = async (id) => {
  try {
    const res = await axios.delete(`${API_URL}/applications/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};

// PATCH /applications/{id}/status (feedback optional if CANCELED)
export const updateApplicationStatus = async (id, { newStatus, feedback } = {}) => {
  if (!newStatus) throw new Error("newStatus is required");
  const isCancel = String(newStatus).toUpperCase() === "CANCELED";
  if (!isCancel && (!feedback || !String(feedback).trim())) {
    throw new Error("Feedback is required");
  }
  try {
    const payload = {
      newStatus,
      ...(String(feedback || "").trim() ? { feedback: String(feedback).trim() } : {}),
    };
    const res = await axios.patch(`${API_URL}/applications/${id}/status`, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};

// Convenience alias
export const applyForJob = (payload) => createApplication(payload);
