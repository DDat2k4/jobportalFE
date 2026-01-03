import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;
const getToken = () => localStorage.getItem("access_token");

// unwrap helper: throw if backend returns { success: false, message }
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

// normalize axios error, including plain-text body and 401/403 messages
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

/**
 * Tạo mới company
 */
export async function createCompany(companyData) {
  try {
    const res = await axios.post(`${API_URL}/companies`, companyData, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (error) {
    rethrow(error);
  }
}

/**
 * Tạo địa chỉ công ty
 */
export async function createCompanyAddress(addressData) {
  try {
    const res = await axios.post(`${API_URL}/company-addresses`, addressData, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (error) {
    rethrow(error);
  }
}

/**
 * Cập nhật địa chỉ công ty theo id
 */
export async function updateCompanyAddress(id, addressData) {
  try {
    const res = await axios.put(`${API_URL}/company-addresses/${id}`, addressData, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (error) {
    rethrow(error);
  }
}

/**
 * Xóa địa chỉ công ty theo id
 */
export async function deleteCompanyAddress(id) {
  try {
    const res = await axios.delete(`${API_URL}/company-addresses/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (error) {
    rethrow(error);
  }
}

/**
 * Tạo mạng xã hội công ty
 */
export async function createCompanySocial(socialData) {
  try {
    const res = await axios.post(`${API_URL}/company-socials`, socialData, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (error) {
    rethrow(error);
  }
}

/**
 * Cập nhật mạng xã hội công ty theo id
 */
export async function updateCompanySocial(id, socialData) {
  try {
    const res = await axios.put(`${API_URL}/company-socials/${id}`, socialData, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (error) {
    rethrow(error);
  }
}

/**
 * Xóa mạng xã hội công ty theo id
 */
export async function deleteCompanySocial(id) {
  try {
    const res = await axios.delete(`${API_URL}/company-socials/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (error) {
    rethrow(error);
  }
}

/**
 * Lấy chi tiết company theo id
 */
export async function getCompany(id) {
  try {
    const res = await axios.get(`${API_URL}/companies/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (error) {
    rethrow(error);
  }
}

/**
 * Lấy danh sách companies có phân trang + filter
 */
export async function getCompanies({
  page = 1,
  limit = 10,
  sort,
  filters = {},
} = {}) {
  try {
    const params = {
      page,
      limit,
      ...(sort ? { sort } : {}),
      ...(filters && typeof filters === "object" ? filters : {}),
    };
    const res = await axios.get(`${API_URL}/companies`, {
      params,
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = unwrap(res) ?? {};
    const box = data.items ? data : (res.data?.data ?? {});
    return {
      items: Array.isArray(box.items) ? box.items : Array.isArray(data) ? data : [],
      total: Number(box.total ?? 0),
      page: Number(box.page ?? page),
      limit: Number(box.limit ?? limit),
      loadMoreAble: Boolean(box.loadMoreAble ?? false),
      totalSafe: Number(box.totalSafe ?? box.total ?? 0),
    };
  } catch (error) {
    rethrow(error);
  }
}

/**
 * Cập nhật company theo id
 */
export async function updateCompany(id, companyData) {
  try {
    const res = await axios.put(`${API_URL}/companies/${id}`, companyData, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (error) {
    rethrow(error);
  }
}

/**
 * Xóa company theo id
 */
export async function deleteCompany(id) {
  try {
    const res = await axios.delete(`${API_URL}/companies/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (error) {
    rethrow(error);
  }
}

/**
 * Lấy thông tin đầy đủ company theo id
 * Trả về: { company, address, socials[] }
 */
export async function getCompanyFull(id) {
  try {
    const res = await axios.get(`${API_URL}/companies/${id}/full`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = unwrap(res) ?? {};
    const root = data?.data ?? data;
    return {
      company: root.company ?? null,
      address: root.addresse ?? root.address ?? null,
      socials: Array.isArray(root.socials) ? root.socials : [],
      raw: root,
    };
  } catch (error) {
    rethrow(error);
  }
}

/**
 * Lấy thông tin công ty theo id
 */
export const getCompanyById = async (id) => {
  try {
    const res = await axios.get(`${API_URL}/companies/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return unwrap(res);
  } catch (error) {
    rethrow(error);
  }
};

/**
 * Lấy danh sách công ty của người dùng theo userId
 */
export const getCompaniesByUserId = async (userId) => {
  try {
    const res = await axios.get(`${API_URL}/companies`, {
      params: { userId },
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = unwrap(res);
    return Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : (data?.data ?? []));
  } catch (error) {
    rethrow(error);
  }
};
