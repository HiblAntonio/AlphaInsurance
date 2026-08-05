const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";
const CURRENT_USER_KEY = "currentUser";
const REFRESH_TOKEN_KEY = "refreshToken";
let silentRefreshTimer = null;

function decodeJwtPayload(token) {
    if (!token) return {};

    try {
        const base64Url = token.split(".")[1];
        if (!base64Url) return {};

        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
        const payload = decodeURIComponent(
            atob(paddedBase64)
                .split("")
                .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
                .join("")
        );
        return JSON.parse(payload);
    } catch {
        return {};
    }
}

function pickLoginUser(data) {
    const tokenPayload = decodeJwtPayload(data?.token);
    const source = data?.agent || data || {};

    return {
        id:
            tokenPayload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
            tokenPayload.nameid ||
            tokenPayload.sub ||
            "",
        username:
            source.username ||
            source.userName ||
            source.name ||
            tokenPayload.username ||
            tokenPayload.name ||
            tokenPayload.unique_name ||
            tokenPayload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
            "",
        role:
            source.role ||
            source.roleName ||
            tokenPayload.role ||
            tokenPayload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
            "",
    };
}

export async function login(agentId, password) {
    const response = await fetch(`${API_BASE_URL}/api/Auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: agentId, password }),
    });

    if (!response.ok) {
        throw new Error("Pogrešan identifikacijski broj ili lozinka.");
    }

    return response.json();
}

export function saveAuthSession(loginResponse) {
    const token = loginResponse?.token;
    const currentUser = pickLoginUser(loginResponse);

    if (token) localStorage.setItem("token", token);
    if (loginResponse?.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, loginResponse.refreshToken);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
}

export async function logout() {
    if (silentRefreshTimer) { clearTimeout(silentRefreshTimer); silentRefreshTimer = null; }
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (storedRefreshToken) {
        try {
            await fetch(`${API_BASE_URL}/api/Auth/logout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken: storedRefreshToken }),
            });
        } catch {}
    }
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem("token");
    localStorage.removeItem(CURRENT_USER_KEY);
}

export async function refreshAccessToken() {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!storedRefreshToken) throw new Error("Nema tokena za osvježavanje.");
    const response = await fetch(`${API_BASE_URL}/api/Auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
    });
    if (!response.ok) throw new Error("Osvježavanje sesije nije uspjelo.");
    const data = await response.json();
    saveAuthSession(data);
    return data.token;
}

export function setupSilentRefresh() {
    if (silentRefreshTimer) { clearTimeout(silentRefreshTimer); silentRefreshTimer = null; }
    const token = localStorage.getItem("token");
    if (!token) return;
    const payload = decodeJwtPayload(token);
    if (!payload.exp) return;
    const expiresInMs = payload.exp * 1000 - Date.now();
    const refreshInMs = expiresInMs - 2 * 60 * 1000;
    if (refreshInMs <= 0) {
        refreshAccessToken()
            .then(() => setupSilentRefresh())
            .catch(() => { logout().finally(() => { window.location.href = "/login"; }); });
        return;
    }
    silentRefreshTimer = setTimeout(() => {
        refreshAccessToken()
            .then(() => setupSilentRefresh())
            .catch(() => { logout().finally(() => { window.location.href = "/login"; }); });
    }, refreshInMs);
}

export async function changePassword(currentPassword, newPassword, confirmPassword) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/api/Auth/change-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Greška pri promjeni lozinke.");
    }
}

export function getCurrentUser() {
    const storedUser = localStorage.getItem(CURRENT_USER_KEY);

    if (storedUser) {
        try {
            return JSON.parse(storedUser);
        } catch {
            localStorage.removeItem(CURRENT_USER_KEY);
        }
    }

    const token = localStorage.getItem("token");
    return pickLoginUser({ token });
}
