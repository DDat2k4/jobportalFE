import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Hàm lấy token
const getToken = () => localStorage.getItem("access_token");

// Lấy industry theo ID
export const getIndustryById = async (id) => {
  try {
    const res = await axios.get(`${API_URL}/industries/${id}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return res.data?.data || res.data;
  } catch (error) {
    console.error(`Error fetching industry ${id}:`, error);
    throw error;
  }
};

// Lấy danh sách industries (filter + paging)
export const getIndustries = async ({
  name,
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
      ...(sortBy ? { sortBy } : {}),
      ...(asc !== undefined ? { asc } : {}),
    };
    const res = await axios.get(`${API_URL}/industries`, {
      params,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    const data = res?.data?.data || res?.data || {};
    return {
      items: data.items || data.content || [],
      total: data.total || data.totalElements || 0,
      page: data.page || data.pageNumber || page,
      size: data.size || data.pageSize || size,
    };
  } catch (error) {
    console.error("Error fetching industries:", error);
    throw error;
  }
};

// Lấy danh sách tất cả industries
export const getAllIndustries = async () => {
  try {
    const res = await axios.get(`${API_URL}/industries`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return res.data?.data?.items || res.data?.items || [];
  } catch (error) {
    console.error("Error fetching all industries:", error);
    throw error;
  }
};

// Thêm industry mới
export const createIndustry = async (industry) => {
  try {
    const payload =
      typeof industry === "string"
        ? { name: industry }
        : {
            name: industry?.name,
            ...(industry?.description != null ? { description: industry.description } : {}),
          };
    const res = await axios.post(`${API_URL}/industries`, payload, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error("Error creating industry:", error);
    throw error;
  }
};

// Cập nhật industry
export const updateIndustry = async (id, industry) => {
  try {
    const payload =
      typeof industry === "string"
        ? { name: industry }
        : {
            name: industry?.name,
            ...(industry?.description != null ? { description: industry.description } : {}),
          };
    const res = await axios.put(`${API_URL}/industries/${id}`, payload, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error(`Error updating industry ${id}:`, error);
    throw error;
  }
};

// Xóa industry
export const deleteIndustry = async (id) => {
  try {
    const res = await axios.delete(`${API_URL}/industries/${id}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error(`Error deleting industry ${id}:`, error);
    throw error;
  }
};
