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

// List permissions with paging and filters
export const getPermissions = async ({ page = 1, limit = 10, sort, filters = {} } = {}) => {
	try {
		const params = {
			page,
			limit,
			...(sort ? { sort } : {}),
			...(filters && typeof filters === "object" ? filters : {}),
		};
		const res = await axios.get(`${API_URL}/permissions`, {
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
	} catch (err) {
		rethrow(err);
	}
};

// Get permission by id
export const getPermissionById = async (id) => {
	try {
		const res = await axios.get(`${API_URL}/permissions/${id}`, {
			headers: { Authorization: `Bearer ${getToken()}` },
		});
		return unwrap(res);
	} catch (err) {
		rethrow(err);
	}
};

// Get permission by code
export const getPermissionByCode = async (code) => {
	try {
		const res = await axios.get(`${API_URL}/permissions/code/${encodeURIComponent(code)}`, {
			headers: { Authorization: `Bearer ${getToken()}` },
		});
		return unwrap(res);
	} catch (err) {
		rethrow(err);
	}
};

// Create permission
export const createPermission = async (permission) => {
	try {
		const res = await axios.post(`${API_URL}/permissions`, permission, {
			headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
		});
		return unwrap(res);
	} catch (err) {
		rethrow(err);
	}
};

// Update permission
export const updatePermission = async (id, permission) => {
	try {
		const res = await axios.put(`${API_URL}/permissions/${id}`, permission, {
			headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
		});
		return unwrap(res);
	} catch (err) {
		rethrow(err);
	}
};

// Delete permission
export const deletePermission = async (id) => {
	try {
		const res = await axios.delete(`${API_URL}/permissions/${id}`, {
			headers: { Authorization: `Bearer ${getToken()}` },
		});
		return unwrap(res);
	} catch (err) {
		rethrow(err);
	}
};
