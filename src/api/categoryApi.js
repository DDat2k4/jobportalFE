import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Hàm lấy token
const getToken = () => localStorage.getItem("access_token");

// fallback tĩnh nếu cần
export const STATIC_COUNTRIES = [
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "BR", name: "Brazil" },
  { code: "BI", name: "Burundi" },
  { code: "BG", name: "Bulgaria" },
  { code: "DE", name: "Germany" },
  { code: "GD", name: "Grenada" },
  { code: "GT", name: "Guatemala" },
  { code: "IS", name: "Iceland" },
];

// Lấy danh sách category (filter + paging)
export const getCategories = async ({
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
    const res = await axios.get(`${API_URL}/job-categories`, {
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
    console.error("Error fetching categories:", error);
    throw error;
  }
};

// Lấy category theo ID
export const getCategoryById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/job-categories/${id}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data?.data || response.data;
  } catch (error) {
    console.error(`Error fetching category ${id}:`, error);
    throw error;
  }
};

// Lấy danh sách tất cả category
export const getAllCategories = async () => {
  try {
    const res = await axios.get(`${API_URL}/job-categories`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return res.data?.data?.items || res.data?.items || [];
  } catch (error) {
    console.error("Error fetching all categories:", error);
    throw error;
  }
};

// Thêm category mới
export const createCategory = async (category) => {
  try {
    const payload =
      typeof category === "string"
        ? { name: category }
        : {
            name: category?.name,
            ...(category?.description != null ? { description: category.description } : {}),
          };
    const res = await axios.post(`${API_URL}/job-categories`, payload, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
};

// Cập nhật category
export const updateCategory = async (id, category) => {
  try {
    const payload =
      typeof category === "string"
        ? { name: category }
        : {
            name: category?.name,
            ...(category?.description != null ? { description: category.description } : {}),
          };
    const res = await axios.put(`${API_URL}/job-categories/${id}`, payload, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error(`Error updating category ${id}:`, error);
    throw error;
  }
};

// Xóa category
export const deleteCategory = async (id) => {
  try {
    const res = await axios.delete(`${API_URL}/job-categories/${id}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error(`Error deleting category ${id}:`, error);
    throw error;
  }
};