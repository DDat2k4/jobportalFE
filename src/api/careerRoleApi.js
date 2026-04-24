import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Hàm lấy token
const getToken = () => localStorage.getItem("access_token");

// Lấy danh sách career role (filter + paging)
export const getCareerRoles = async ({
  name,
  industryId,
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
      ...(industryId ? { industryId } : {}),
      ...(sortBy ? { sortBy } : {}),
      ...(asc !== undefined ? { asc } : {}),
    };
    const res = await axios.get(`${API_URL}/career-roles`, {
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
    console.error("Error fetching career roles:", error);
    throw error;
  }
};

// Lấy danh sách tất cả career role
export const getAllCareerRoles = async () => {
  try {
    const res = await axios.get(`${API_URL}/career-roles`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return res.data?.data?.items || res.data?.items || [];
  } catch (error) {
    console.error("Error fetching all career roles:", error);
    throw error;
  }
};

// Thêm career role mới
export const createCareerRole = async (careerRole) => {
  try {
    const payload =
      typeof careerRole === "string"
        ? { name: careerRole }
        : {
            name: careerRole?.name,
            ...(careerRole?.industryId != null ? { industryId: careerRole.industryId } : {}),
            ...(careerRole?.description != null ? { description: careerRole.description } : {}),
          };
    const res = await axios.post(`${API_URL}/career-roles`, payload, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error("Error creating career role:", error);
    throw error;
  }
};

// Cập nhật career role
export const updateCareerRole = async (id, careerRole) => {
  try {
    const payload =
      typeof careerRole === "string"
        ? { name: careerRole }
        : {
            name: careerRole?.name,
            ...(careerRole?.industryId != null ? { industryId: careerRole.industryId } : {}),
            ...(careerRole?.description != null ? { description: careerRole.description } : {}),
          };
    const res = await axios.put(`${API_URL}/career-roles/${id}`, payload, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error(`Error updating career role ${id}:`, error);
    throw error;
  }
};

// Xóa career role
export const deleteCareerRole = async (id) => {
  try {
    const res = await axios.delete(`${API_URL}/career-roles/${id}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error(`Error deleting career role ${id}:`, error);
    throw error;
  }
};
