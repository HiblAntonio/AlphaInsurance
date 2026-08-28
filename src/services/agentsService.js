const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

async function handleResponse(response) {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Greška pri dohvaćanju djelatnika.");
  }

  return response.json();
}

async function handleEmptyResponse(response) {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Greška pri spremanju djelatnika.");
  }

  const text = await response.text();
  return text ? JSON.parse(text) : true;
}

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const getJsonHeaders = () => ({
  ...getAuthHeaders(),
  "Content-Type": "application/json",
});

export async function fetchAgents({
  search = "",
  role = "Svi",
  pageNumber = 1,
  pageSize = 9,
} = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (role && role !== "Svi") params.set("role", role);
  params.set("pageNumber", String(pageNumber));
  params.set("pageSize", String(pageSize));

  const response = await fetch(
    `${API_BASE_URL}/api/Agent/AgentList?${params.toString()}`,
    { headers: getAuthHeaders() }
  );

  return handleResponse(response);
}

export async function fetchAgentDetails(agentId) {
  const response = await fetch(
    `${API_BASE_URL}/api/Agent/AgentDetails/${encodeURIComponent(agentId)}`,
    { headers: getAuthHeaders() }
  );

  return handleResponse(response);
}

export async function fetchAgentLocations() {
  const response = await fetch(`${API_BASE_URL}/api/Location/active`, {
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
}

export async function addAgent(agent) {
  const response = await fetch(`${API_BASE_URL}/api/Agent/AddAgent`, {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify(agent),
  });

  return handleEmptyResponse(response);
}

export async function updateAgent(agentId, data) {
  const response = await fetch(`${API_BASE_URL}/api/Agent/${encodeURIComponent(agentId)}`, {
    method: "PUT",
    headers: getJsonHeaders(),
    body: JSON.stringify(data),
  });

  return handleEmptyResponse(response);
}

export async function setAgentActive(agentId, isActive) {
  const response = await fetch(`${API_BASE_URL}/api/Agent/${encodeURIComponent(agentId)}/active`, {
    method: "PATCH",
    headers: getJsonHeaders(),
    body: JSON.stringify({ isActive }),
  });

  return handleEmptyResponse(response);
}
