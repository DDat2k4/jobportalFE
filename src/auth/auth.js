import axios from "axios";
import { getUserFromToken } from "../utils/jwt";

const API_URL = import.meta.env.VITE_API_BASE_URL;

// LOGIN
export const login = async (username, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, { username, password });
  const { accessToken, refreshToken, username: user, avatar, userId, id } = response.data.data;

  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);
  localStorage.setItem("username", user);
  if (avatar) localStorage.setItem("avatar", avatar);
  const uid = userId ?? id;
  if (uid !== undefined && uid !== null) localStorage.setItem("userId", String(uid));

  return { accessToken, refreshToken, username: user, avatar, userId: uid };
};

// SIGNUP
export const signup = async (formData) => {
  const payload = {
    username: formData.username,
    email: formData.email,
    phone: formData.phone,
    password: formData.password,
    roleType: String(formData.roleType), // "2" (EMPLOYER) | "3" (JOB_SEEKER)
  };
  const response = await axios.post(`${API_URL}/auth/register`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};

// LOGOUT
export const logout = async () => {
  try {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      await axios.post(`${API_URL}/auth/logout`, { refreshToken });
    }
  } catch (err) {
    console.error("Logout API failed:", err);
  } finally {
    const keys = ["access_token", "refresh_token", "username", "avatar", "userId"];
    keys.forEach((k) => localStorage.removeItem(k));
    // clear axios Authorization header if any
    if (axios?.defaults?.headers?.common?.Authorization) {
      delete axios.defaults.headers.common.Authorization;
    }
    window.location.href = "/login";
  }
};

// REFRESH TOKEN
export const refreshToken = async () => {
  try {
    const token = localStorage.getItem("refresh_token");
    if (!token) throw new Error("No refresh token available");

    const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: token }, {
      headers: { "Content-Type": "application/json" },
    });

    const { accessToken } = response.data.data;
    localStorage.setItem("access_token", accessToken);
    return accessToken;
  } catch (err) {
    console.error("Refresh token failed:", err);
    throw err;
  }
};

export const getAccessToken = () => localStorage.getItem("access_token");
export const getRefreshToken = () => localStorage.getItem("refresh_token");
export const isLoggedIn = () => !!localStorage.getItem("access_token");
export const getCurrentUser = () => getUserFromToken();

// Interceptor + Session Modal
let refreshInFlight = null;
let decisionPromise = null;
const promptSessionRenewal = () => {
  if (decisionPromise) return decisionPromise;

  decisionPromise = new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "jp-modal-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.id = "jp-session-expired-modal";

    const modal = document.createElement("div");
    modal.className = "jp-modal";
    modal.addEventListener("click", (e) => e.stopPropagation());

    const header = document.createElement("div");
    header.className = "jp-modal-header";
    const title = document.createElement("h4");
    title.className = "jp-modal-title";
    title.textContent = "Session expired";
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "jp-modal-close";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.textContent = "×";

    header.appendChild(title);
    header.appendChild(closeBtn);

    const body = document.createElement("div");
    body.className = "jp-modal-body";
    body.innerHTML = `<p>Your session has expired. Would you like to refresh your session?</p>`;

    const actions = document.createElement("div");
    actions.className = "jp-modal-actions";
    const logoutBtn = document.createElement("button");
    logoutBtn.type = "button";
    logoutBtn.className = "btn btn-default";
    logoutBtn.textContent = "Log out";
    const refreshBtn = document.createElement("button");
    refreshBtn.type = "button";
    refreshBtn.className = "btn theme-btn";
    refreshBtn.textContent = "Refresh session";

    actions.appendChild(logoutBtn);
    actions.appendChild(refreshBtn);

    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(actions);
    overlay.appendChild(modal);

    const cleanup = (result) => {
      document.body.classList.remove("modal-open");
      try { overlay.remove(); } catch {}
      resolve(result);
      decisionPromise = null;
    };

    overlay.addEventListener("click", () => cleanup("logout"));
    closeBtn.addEventListener("click", () => cleanup("logout"));
    logoutBtn.addEventListener("click", () => cleanup("logout"));
    refreshBtn.addEventListener("click", () => cleanup("refresh"));

    document.body.appendChild(overlay);
    document.body.classList.add("modal-open");

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cleanup("logout");
      }
    }, { once: true });
  });

  return decisionPromise;
};

const doRefreshOnce = async () => {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const newToken = await refreshToken();
    return newToken;
  })();

  try {
    const result = await refreshInFlight;
    refreshInFlight = null;
    return result;
  } catch (e) {
    refreshInFlight = null;
    throw e;
  }
};

/** Initialize axios interceptor to handle 401 -> refresh or logout */
export const initAuthInterceptors = () => {
  if (axios.__jp_interceptor_registered) return;
  axios.__jp_interceptor_registered = true;

  axios.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  axios.interceptors.response.use(
    (res) => res,
    async (error) => {
      const { response, config } = error || {};
      if (!response || !config) return Promise.reject(error);

      const url = String(config.url || "");
      const isAuthApi = /\/auth\/(login|logout|refresh)/i.test(url);

      if (response.status === 401 && !isAuthApi && !config.__isRetryRequest) {
        try {
          const decision = await promptSessionRenewal();

          if (decision === "logout") {
            await logout();
            return Promise.reject(error);
          }

          const newAccess = await doRefreshOnce();
          const retryCfg = { ...config, __isRetryRequest: true };
          retryCfg.headers = {
            ...(retryCfg.headers || {}),
            Authorization: `Bearer ${newAccess}`,
          };
          return axios(retryCfg);
        } catch (e) {
          await logout();
          return Promise.reject(e);
        }
      }

      return Promise.reject(error);
    }
  );
};

// Logout from all devices
export const logoutAllDevices = async () => {
  try {
    await axios.post(`${API_URL}/auth/logout-all`);
  } catch (err) {
    console.error("Logout-all API failed:", err);
  } finally {
    const keys = ["access_token", "refresh_token", "username", "avatar", "userId"];
    keys.forEach((k) => localStorage.removeItem(k));
    if (axios?.defaults?.headers?.common?.Authorization) {
      delete axios.defaults.headers.common.Authorization;
    }
    window.location.href = "/login";
  }
};

// Change password
export const changePassword = async (oldPassword, newPassword) => {
  const res = await axios.post(`${API_URL}/auth/change-password`, null, {
    params: { oldPassword, newPassword },
  });
  return res.data;
};