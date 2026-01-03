import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;
const getToken = () => localStorage.getItem("access_token");

const unwrap = (res) => {
  const body = res?.data;
  if (body && typeof body === "object" && Object.prototype.hasOwnProperty.call(body, "success")) {
    if (body.success === false) {
      const e = new Error(body.message || "Upload failed");
      e.response = { status: res?.status, data: body };
      throw e;
    }
    return body.data ?? body;
  }
  return body;
};

const rethrow = (err) => {
  if (err?.response) {
    const { status, data } = err.response;
    let message = typeof data === "string" ? data : data?.message || err.message || "Upload failed";
    if (status === 401) message = "Unauthorized. Please login again.";
    if (status === 403) message = "Access denied. You do not have permission.";
    const e = new Error(message);
    e.response = err.response;
    throw e;
  }
  throw err;
};

// Upload single image -> returns URL
export const uploadImage = async (file) => {
  if (!file) throw new Error("No file selected");
  const fd = new FormData();
  fd.append("file", file);
  try {
    const res = await axios.post(`${API_URL}/uploads/single`, fd, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    const data = unwrap(res);
    const url =
      (typeof data === "string" && data) ||
      data?.url ||
      data?.fileUrl ||
      data?.location ||
      data?.path ||
      data?.secure_url ||
      data?.data?.url ||
      null;
    if (!url) throw new Error("Upload succeeded but no URL returned");
    return url;
  } catch (err) {
    rethrow(err);
  }
};

// Upload 1 file duy nhất
export const uploadSingleFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post(`${API_URL}/uploads/single`, formData, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data?.data; 
};

// Upload nhiều file cùng lúc
export const uploadMultipleFiles = async (files) => {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  const res = await axios.post(`${API_URL}/uploads/multiple`, formData, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data?.data;
};
