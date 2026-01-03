import {
  createUserCv,
  getFullUserCv,
  updateFullUserCv as apiUpdateFullUserCv,
  cloneUserCv as apiCloneUserCv,
} from "../api/userCvApi.js";
import {
  createCvSection,
  getSectionsByCvId as apiGetSectionsByCvId,
} from "../api/cvSectionApi.js";

/**
 * Tạo CV mới và thêm các sections (chạy tuần tự để đảm bảo thứ tự position).
 * cv: { userId, title, templateCode, isDefault, ... }
 * sections: [{ type, title, position, content, ... }]
 */
export const createCvWithSections = async (cv, sections = []) => {
  const createdCvResp = await createUserCv(cv);
  const createdCv = createdCvResp?.data;
  if (!createdCv?.id) throw new Error("Create CV failed");

  for (const s of sections) {
    await createCvSection({ ...s, cvId: createdCv.id });
  }
  const full = await getFullUserCv(createdCv.id);
  return full;
};

/**
 * Cập nhật full CV qua endpoint bulk.
 * payload phải theo FullCvResponse: { cv: {...}, sections: [...] }
 */
export const updateFullCv = async (id, payload) => {
  const res = await apiUpdateFullUserCv(id, payload);
  return res;
};

/**
 * Clone CV (server tự copy sections).
 */
export const cloneCv = async (id) => {
  const res = await apiCloneUserCv(id);
  return res;
};

/**
 * Lấy danh sách sections theo cvId.
 */
export const getSectionsByCvId = async (cvId) => {
  const res = await apiGetSectionsByCvId(cvId);
  return res;
};
