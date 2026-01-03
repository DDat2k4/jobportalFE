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

// GET /api/notifications/{id}
export const getNotificationById = async (id) => {
  try {
    const res = await axios.get(`${API_URL}/notifications/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};

// GET /api/notifications?page=&size=&isRead=&sortBy=&asc=
export const getNotifications = async ({ page = 1, size = 10, isRead, sortBy, asc } = {}) => {
  try {
    const params = {
      page,
      size,
      ...(isRead !== undefined ? { isRead } : {}),
      ...(sortBy ? { sortBy } : {}),
      ...(asc !== undefined ? { asc } : {}),
    };
    const res = await axios.get(`${API_URL}/notifications`, {
      params,
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = unwrap(res) ?? {};
    // expect Page<Notification>-like shape
    return {
      items: data.items ?? data.data ?? [],
      total: Number(data.total ?? data.totalElements ?? 0),
      totalPages: Number(data.totalPages ?? Math.ceil((data.total ?? 0) / size)),
      page: Number(data.page ?? page),
      size: Number(data.size ?? size),
    };
  } catch (err) {
    rethrow(err);
  }
};

// POST /api/notifications
export const createNotification = async (notification) => {
  try {
    const res = await axios.post(`${API_URL}/notifications`, notification, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};

// PUT /api/notifications/{id}
export const updateNotification = async (id, notification) => {
  try {
    const res = await axios.put(`${API_URL}/notifications/${id}`, notification, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};

// DELETE /api/notifications/{id}
export const deleteNotification = async (id) => {
  try {
    const res = await axios.delete(`${API_URL}/notifications/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};

// PATCH /api/notifications/{id}/read
export const markAsRead = async (id) => {
  try {
    const res = await axios.patch(`${API_URL}/notifications/${id}/read`, null, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};

// PATCH /api/notifications/read-all
export const markAllAsRead = async () => {
  try {
    const res = await axios.patch(`${API_URL}/notifications/read-all`, null, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (err) {
    rethrow(err);
  }
};

// GET /api/notifications/unread-count
export const getUnreadCount = async () => {
  try {
    const res = await axios.get(`${API_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = unwrap(res);
    return Number(data ?? 0);
  } catch (err) {
    rethrow(err);
  }
};
