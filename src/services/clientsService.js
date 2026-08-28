const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

async function handleResponse(response) {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Greška pri dohvaćanju ugovaratelja.");
  }

  return response.json();
}

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export async function fetchClients({
  search = "",
  isActive = true,
  isNotActive = true,
  hasBirthday = false,
  sortNewestFirst = false,
  pageNumber = 1,
  pageSize = 10,
}) {
  const params = new URLSearchParams();

  if (search) params.set("search", search);
  params.set("isActive", String(isActive));
  params.set("isNotActive", String(isNotActive));
  params.set("hasBirthday", String(hasBirthday));
  params.set("sortNewestFirst", String(sortNewestFirst));
  params.set("pageNumber", String(pageNumber));
  params.set("pageSize", String(pageSize));

  const response = await fetch(
    `${API_BASE_URL}/api/Clients/GetAllClients?${params.toString()}`,
    {
      headers: getAuthHeaders(),
    }
  );

  return handleResponse(response);
}

export async function fetchInactiveClientsCount() {
  const response = await fetch(`${API_BASE_URL}/api/Clients/InactiveClients`, {
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
}

export async function fetchRecentlyLostClientsCount() {
  const response = await fetch(`${API_BASE_URL}/api/Clients/RecentlyLostClients`, {
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
}

export async function fetchClientDetails(clientId) {
  const response = await fetch(
    `${API_BASE_URL}/api/Clients/ClientDetails/${encodeURIComponent(clientId)}`,
    {
      headers: getAuthHeaders(),
    }
  );

  return handleResponse(response);
}

export async function updateClient({
  clientId,
  oib,
  name,
  emailAddress,
  phoneNumber,
  dob,
}) {
  const params = new URLSearchParams();

  params.set("clientId", clientId);
  params.set("oib", oib);
  params.set("name", name);
  if (emailAddress) params.set("emailAddress", emailAddress);
  params.set("phoneNumber", phoneNumber);
  if (dob) params.set("dob", dob);

  const response = await fetch(
    `${API_BASE_URL}/api/Clients/UpdateClient?${params.toString()}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Greška pri ažuriranju ugovaratelja.");
  }

  return true;
}

export async function changeClient({ policyId, client }) {
  const response = await fetch(`${API_BASE_URL}/api/Clients/ChangeClient`, {
    method: "PATCH",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ policyId, client }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Greška pri izmjeni ugovaratelja.");
  }
  return true;
}

export async function fetchClientsByOib(oib) {
  const response = await fetch(
    `${API_BASE_URL}/api/Clients/getListOfClientsByOib/${encodeURIComponent(oib)}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (response.status === 404) {
    return [];
  }

  return handleResponse(response);
}
