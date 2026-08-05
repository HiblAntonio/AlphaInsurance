const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token")}`,
  };
}

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || res.statusText);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const ENDPOINTS = {
  "Osiguravajuće kuće": "InsuranceCompany",
  "Partneri":           "Partner",
  "Vrste osiguranja":   "InsuranceType",
  "Prodajna mjesta":    "Location",
};

export function getEndpoint(tab) {
  return ENDPOINTS[tab];
}

export async function fetchLookupItems(tab) {
  const ep = ENDPOINTS[tab];
  const res = await fetch(`${API_BASE_URL}/api/${ep}`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function addLookupItem(tab, name) {
  const ep = ENDPOINTS[tab];
  const res = await fetch(`${API_BASE_URL}/api/${ep}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name }),
  });
  return handleResponse(res);
}

export async function updateLookupItem(tab, oldName, newName) {
  const ep = ENDPOINTS[tab];
  const res = await fetch(`${API_BASE_URL}/api/${ep}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ oldName, newName }),
  });
  return handleResponse(res);
}

export async function setLookupItemActive(tab, name, isActive) {
  const ep = ENDPOINTS[tab];
  const res = await fetch(`${API_BASE_URL}/api/${ep}/active`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ name, isActive }),
  });
  return handleResponse(res);
}
