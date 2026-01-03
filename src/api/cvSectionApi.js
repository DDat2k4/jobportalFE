import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;
const getToken = () => localStorage.getItem("access_token");

// Lấy section theo id
export const getCvSectionById = async (id) => {
  const res = await axios.get(`${API_URL}/cv-sections/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.data;
};

// Lấy danh sách section (phân trang + filter)
export const getCvSections = async ({
  cvId,
  type,
  title,
  page = 1,
  size = 10,
  sortBy,
  asc,
} = {}) => {
  const params = {
    page,
    size,
    ...(cvId ? { cvId } : {}),
    ...(type ? { type } : {}),
    ...(title ? { title } : {}),
    ...(sortBy ? { sortBy } : {}),
    ...(asc !== undefined ? { asc } : {}),
  };
  const res = await axios.get(`${API_URL}/cv-sections`, {
    params,
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.data;
};

// Lấy danh sách section theo cvId
export const getSectionsByCvId = async (cvId) => {
  const res = await axios.get(`${API_URL}/cv-sections/by-cv/${cvId}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.data;
};

/**
 * Lấy danh sách section theo cvId (trả về data trực tiếp)
 */
export const getSectionsByCvIdData = async (cvId) => {
  const res = await getSectionsByCvId(cvId);
  if (res?.success === false) throw new Error(res?.message || "Lấy sections thất bại");
  return res?.data ?? [];
};

// Tạo section
export const createCvSection = async (section) => {
  const res = await axios.post(`${API_URL}/cv-sections`, section, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });
  return res.data;
};

// Tạo nhiều section cho 1 CV
export const createCvSections = async (cvId, sections = []) => {
  if (!cvId) throw new Error("cvId is required");
  if (!Array.isArray(sections) || sections.length === 0) return [];
  const results = [];
  for (const s of sections) {
    results.push(await createCvSection({ ...s, cvId }));
  }
  return results;
};

/**
 * Tạo nhiều section cho 1 CV (trả về list data trực tiếp)
 */
export const createCvSectionsData = async (cvId, sections = []) => {
  const resps = await createCvSections(cvId, sections);
  return (resps || []).map((r) => {
    if (r?.success === false) throw new Error(r?.message || "Tạo section thất bại");
    return r?.data;
  });
};

// Cập nhật section
export const updateCvSection = async (id, section) => {
  const res = await axios.put(`${API_URL}/cv-sections/${id}`, section, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });
  return res.data;
};

// Xóa section
export const deleteCvSection = async (id) => {
  const res = await axios.delete(`${API_URL}/cv-sections/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.data;
};

// Xóa toàn bộ section theo cvId
export const deleteSectionsByCvId = async (cvId) => {
  const res = await axios.delete(`${API_URL}/cv-sections/by-cv/${cvId}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.data;
};

/**
 * Upsert 1 section (có id -> update, không có id -> create)
 */
export const upsertCvSection = async (section) => {
  return section?.id
    ? await updateCvSection(section.id, section)
    : await createCvSection(section);
};

/**
 * Upsert section (trả về data trực tiếp)
 */
export const upsertCvSectionData = async (section) => {
  const res = await upsertCvSection(section);
  if (res?.success === false) throw new Error(res?.message || "Lưu section thất bại");
  return res?.data;
};

/**
 * Cập nhật thứ tự nhiều section (drag & drop)
 * orderedSections: [{ id, position }, ...]
 */
export const updateCvSectionsOrder = async (orderedSections = []) => {
  if (!Array.isArray(orderedSections) || !orderedSections.length) return [];
  return Promise.all(
    orderedSections.map((s, idx) =>
      updateCvSection(s.id, { id: s.id, position: s.position ?? idx + 1 })
    )
  );
};
