const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

function handleUnauthorized() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  window.location.href = "/login";
}

async function handleResponse(response) {
  if (response.status === 401) {
    handleUnauthorized();
    throw new Error("Neovlašteni pristup.");
  }
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Greška pri dohvaćanju podataka.");
  }

  return response.json();
}

async function handleEmptyResponse(response, fallbackMessage) {
  if (response.status === 401) {
    handleUnauthorized();
    throw new Error("Neovlašteni pristup.");
  }
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || fallbackMessage);
  }

  return true;
}

const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token")}`
});

export async function fetchPolicies({
  search = "",
  status = "",
  insuranceCompany = "",
  insuranceType = "",
  location = "",
  partner = "",
  priceFrom = 0,
  priceTo = Number.MAX_SAFE_INTEGER,
  dateFrom = "",
  dateTo = "",
  year = new Date().getFullYear(),
  isAsc = false,
  pageNumber = 1,
  pageSize = 10,
}) {
  const params = new URLSearchParams();

  const appendList = (key, val) => {
    const arr = Array.isArray(val) ? val : val ? [val] : [];
    arr.forEach((v) => params.append(key, v));
  };

  params.set("search", search);
  params.set("status", status);
  appendList("insuranceCompany", insuranceCompany);
  appendList("insuranceType", insuranceType);
  appendList("location", location);
  appendList("partner", partner);
  params.set("priceFrom", String(priceFrom));
  params.set("priceTo", String(priceTo));
  params.set("year", String(year));
  params.set("isAsc", String(isAsc));
  params.set("pageNumber", String(pageNumber));
  params.set("pageSize", String(pageSize));

  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);

  const response = await fetch(
    `${API_BASE_URL}/api/InsurancePolicies?${params.toString()}`,{
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    },
  );

  return handleResponse(response);
}

export async function fetchTabCounts(year, filters = {}) {
  const params = new URLSearchParams({ year });
  const appendList = (key, val) => {
    const arr = Array.isArray(val) ? val : val ? [val] : [];
    arr.forEach((v) => params.append(key, v));
  };
  appendList("insuranceCompany", filters.insuranceCompany);
  appendList("insuranceType", filters.insuranceType);
  appendList("location", filters.location);
  appendList("partner", filters.partner);
  if (filters.priceFrom)        params.set("priceFrom", filters.priceFrom);
  if (filters.priceTo)          params.set("priceTo", filters.priceTo);
  if (filters.dateFrom)         params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo)           params.set("dateTo", filters.dateTo);

  const response = await fetch(
    `${API_BASE_URL}/api/InsurancePolicies/tab-counts?${params.toString()}`,
    { headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } }
  );

  return handleResponse(response);
}

export async function fetchPolicyDetailsById(policyId) {
  const response = await fetch(
    `${API_BASE_URL}/api/InsurancePolicies/policyDetails/${policyId}`,
    {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    },
  );

  return handleResponse(response);
}

export async function createPolicy(policyRequest) {
  const response = await fetch(`${API_BASE_URL}/api/InsurancePolicies/CreatePolicy`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(policyRequest),
  });

  return handleEmptyResponse(response, "Greška pri kreiranju police.");
}

export async function extendPolicy(clientId, policy) {
  const response = await fetch(`${API_BASE_URL}/api/InsurancePolicies/ExtendPolicy`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, policy }),
  });

  return handleEmptyResponse(response, "Greška pri produživanju police.");
}

export async function updatePolicy(policyId, policy) {
  const params = new URLSearchParams();
  params.set("PolicyId", policyId);
  params.set("Policy.PolicyNumber", policy.policyNumber);
  params.set("Policy.Price", String(policy.price));
  params.set("Policy.StartingDate", policy.startingDate);
  params.set("Policy.InsuranceCompany", policy.insuranceCompany);
  params.set("Policy.InsuranceType", policy.insuranceType);
  params.set("Policy.Location", policy.location);
  params.set("Policy.Partner", policy.partner);
  if (policy.remark) params.set("Policy.Remark", policy.remark);

  const response = await fetch(
    `${API_BASE_URL}/api/InsurancePolicies/UpdatePolicy/${encodeURIComponent(policyId)}?${params.toString()}`,
    {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
    }
  );

  return handleEmptyResponse(response, "Greška pri ažuriranju police.");
}

export async function deletePolicy(policyId, deleteReason = "", deleteComment = "") {
  const params = new URLSearchParams();
  if (deleteReason) params.set("deleteReason", deleteReason);
  if (deleteComment) params.set("deleteComment", deleteComment);
  const response = await fetch(
    `${API_BASE_URL}/api/InsurancePolicies/DeletePolicy/${encodeURIComponent(policyId)}?${params.toString()}`,
    {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
    }
  );
  return handleEmptyResponse(response, "Greška pri brisanju police.");
}

export async function fetchDeletedPolicies() {
  const response = await fetch(
    `${API_BASE_URL}/api/InsurancePolicies/deleted`,
    { headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } }
  );
  return handleResponse(response);
}

export async function fetchDeletedPolicyById(policyId) {
  const response = await fetch(
    `${API_BASE_URL}/api/InsurancePolicies/deleted/${encodeURIComponent(policyId)}`,
    { headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } }
  );
  return handleResponse(response);
}

export async function restorePolicy(policyId) {
  const response = await fetch(
    `${API_BASE_URL}/api/InsurancePolicies/restore/${encodeURIComponent(policyId)}`,
    {
      method: "POST",
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
    }
  );
  return handleEmptyResponse(response, "Greška pri vraćanju police.");
}

export async function fetchDashboardFilterOptions() {
  const response = await fetch(
    `${API_BASE_URL}/api/InsurancePolicies/filter-options`,
    { headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } }
  );
  return handleResponse(response);
}

export async function fetchTodaysFilterOptions() {
  const response = await fetch(
    `${API_BASE_URL}/api/Statistics/todays-filter-options`,
    { headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } }
  );
  return handleResponse(response);
}

export async function fetchLatestPolicy() {
  const response = await fetch(
    `${API_BASE_URL}/api/Statistics/latest-policy`,
    { headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } }
  );
  if (response.status === 204) return null;
  return handleResponse(response);
}

export async function fetchTodayStatistics({
  search = "",
  user = "",
  location = "",
  period = "last7",
  year = new Date().getFullYear(),
  includeAdminBreakdown = false,
  pageNumber = 1,
  pageSize = 9,
}) {
  const todayPoliciesParams = new URLSearchParams();

  todayPoliciesParams.set("search", search);
  todayPoliciesParams.set("agentName", user);
  todayPoliciesParams.set("location", location);
  todayPoliciesParams.set("pageNumber", String(pageNumber));
  todayPoliciesParams.set("pageSize", String(pageSize));

  const requestOptions = {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
  };

  const baseRequests = [
    fetch(`${API_BASE_URL}/api/Statistics/yearly-comparison?year=${year}`, requestOptions).then(handleResponse),
    fetch(`${API_BASE_URL}/api/Statistics/todays-stats`, requestOptions).then(handleResponse),
    fetch(`${API_BASE_URL}/api/Statistics/premium-sum?year=${year}`, requestOptions).then(handleResponse),
    fetch(`${API_BASE_URL}/api/Statistics/todays-policies?${todayPoliciesParams.toString()}`, requestOptions).then(handleResponse),
  ];

  const adminRequests = includeAdminBreakdown ? [
    fetch(`${API_BASE_URL}/api/Statistics/top-partners?year=${year}`, requestOptions).then(handleResponse),
    fetch(`${API_BASE_URL}/api/Statistics/policies-chart-data?period=${period}`, requestOptions).then(handleResponse),
    fetch(`${API_BASE_URL}/api/Statistics/unrenewed-policies?period=${period}`, requestOptions).then(handleResponse),
    fetch(`${API_BASE_URL}/api/Statistics/expiring-policies`, requestOptions).then(handleResponse),
  ] : [];

  const [
    yearlyComparison,
    todaysStats,
    premiumSums,
    todayPolicies,
    topPartners = [],
    chartData = [],
    unrenewedPolicies = { count: 0, priceSum: 0 },
    expiringPolicies = { count: 0, priceSum: 0 },
  ] = await Promise.all([...baseRequests, ...adminRequests]);

  const expiringArr = Array.isArray(expiringPolicies) ? expiringPolicies : [];
  const expiringSummary = expiringArr.length > 0
    ? {
        count: expiringArr.reduce((s, i) => s + (i.count ?? 0), 0),
        priceSum: expiringArr.reduce((s, i) => s + (Number(i.priceSum) || 0), 0),
        byType: expiringArr.map((i) => ({ type: i.policyType ?? i.PolicyType ?? "", count: i.count ?? 0 })),
      }
    : { count: expiringPolicies?.count ?? 0, priceSum: Number(expiringPolicies?.priceSum) || 0, byType: [] };

  return {
    items: todayPolicies.items ?? [],
    totalPages: todayPolicies.totalPages ?? 1,
    summary: {
      yearPoliciesCount: yearlyComparison.currentYear ?? 0,
      todayPoliciesCount: todaysStats.todaysPolicies ?? 0,
      todayPremiumSum: premiumSums.todaysSum ?? 0,
      yearPremiumSum: premiumSums.yearlySum ?? 0,
      averagePoliciesPerDay: 0,
      todayVsAverageDifference: todaysStats.dayComparison ?? 0,
      beliManastirPoliciesCount: 0,
    },
    locationChart: chartData ?? [],
    unrenewedPolicies: {
      count: unrenewedPolicies.count ?? 0,
      priceSum: unrenewedPolicies.priceSum ?? 0,
    },
    expiringPolicies: expiringSummary,
    topPartners: topPartners ?? [],
  };
}

export async function fetchSalesStatistics({
  year = new Date().getFullYear(),
  dateFrom = "",
  dateTo = "",
  insuranceCompany = "",
  insuranceType = "",
  partner = "",
  location = "",
}) {
  const params = new URLSearchParams();

  params.set("year", String(year));
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  if (insuranceCompany) params.set("insuranceCompany", insuranceCompany);
  if (insuranceType) params.set("insuranceType", insuranceType);
  if (partner) params.set("partner", partner);
  if (location) params.set("location", location);

  const queryString = params.toString();
  const requestOptions = {
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    }
  };

  const [companiesRaw, partnersRaw, locationsRaw, creationStats] = await Promise.all([
    fetch(`${API_BASE_URL}/api/Statistics/sales/insurance-company-stats?${queryString}`, requestOptions).then(handleResponse),
    fetch(`${API_BASE_URL}/api/Statistics/sales/partner-stats?${queryString}`, requestOptions).then(handleResponse),
    fetch(`${API_BASE_URL}/api/Statistics/sales/location-stats?${queryString}`, requestOptions).then(handleResponse),
    fetch(`${API_BASE_URL}/api/Statistics/sales/creation-stats?${queryString}`, requestOptions).then(handleResponse),
  ]);

  return {
    insuranceCompanies: (companiesRaw ?? []).map(item => ({ ...item, name: item.companyName })),
    partners: (partnersRaw ?? []).map(item => ({ ...item, name: item.partnerName })),
    locations: (locationsRaw ?? []).map(item => ({ ...item, name: item.locationName })),
    creationStats: creationStats ?? { newCount: 0, renewedCount: 0, newPercentage: 0, renewedPercentage: 0 },
  };
}

export async function fetchSalesChartData({
  period = "ytd",
  year = new Date().getFullYear(),
  dateFrom = "",
  dateTo = "",
  insuranceCompany = "",
  insuranceType = "",
  partner = "",
  location = "",
}) {
  const params = new URLSearchParams();

  params.set("period", period);
  params.set("year", String(year));
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  if (insuranceCompany) params.set("insuranceCompany", insuranceCompany);
  if (insuranceType) params.set("insuranceType", insuranceType);
  if (partner) params.set("partner", partner);
  if (location) params.set("location", location);

  const response = await fetch(
    `${API_BASE_URL}/api/Statistics/sales/chart?${params.toString()}`,
    {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    }
  );

  return handleResponse(response);
}

export async function fetchPremiumComparison({
  years = [],
  dateFrom = "",
  dateTo = "",
  insuranceCompany = "",
  insuranceType = "",
  partner = "",
  location = "",
}) {
  const params = new URLSearchParams();

  if (years.length > 0) params.set("years", years.join(","));
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  if (insuranceCompany) params.set("insuranceCompany", insuranceCompany);
  if (insuranceType) params.set("insuranceType", insuranceType);
  if (partner) params.set("partner", partner);
  if (location) params.set("location", location);

  const response = await fetch(
    `${API_BASE_URL}/api/Statistics/sales/premium-comparison?${params.toString()}`,
    { headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } }
  );

  return handleResponse(response);
}

export async function fetchStatisticsFilterOptions() {
  const requestOptions = {
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    }
  };

  const toNames = (items) => (items ?? []).map((i) => (typeof i === "string" ? i : i.name));

  const [insuranceCompanies, partners, insuranceTypes, locations] = await Promise.all([
    fetch(`${API_BASE_URL}/api/InsuranceCompany`, requestOptions).then(handleResponse),
    fetch(`${API_BASE_URL}/api/Partner`, requestOptions).then(handleResponse),
    fetch(`${API_BASE_URL}/api/InsuranceType`, requestOptions).then(handleResponse),
    fetch(`${API_BASE_URL}/api/Location`, requestOptions).then(handleResponse),
  ]);

  return {
    insuranceCompanies: toNames(insuranceCompanies),
    partners: toNames(partners),
    insuranceTypes: toNames(insuranceTypes),
    locations: toNames(locations),
  };
}

export async function fetchActivePolicyOptions() {
  const requestOptions = {
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    }
  };

  const [insuranceCompanies, partners, insuranceTypes, locations] = await Promise.all([
    fetch(`${API_BASE_URL}/api/InsuranceCompany/active`, requestOptions).then(handleResponse),
    fetch(`${API_BASE_URL}/api/Partner/active`, requestOptions).then(handleResponse),
    fetch(`${API_BASE_URL}/api/InsuranceType/active`, requestOptions).then(handleResponse),
    fetch(`${API_BASE_URL}/api/Location/active`, requestOptions).then(handleResponse),
  ]);

  return {
    insuranceCompanies: insuranceCompanies ?? [],
    partners: partners ?? [],
    insuranceTypes: insuranceTypes ?? [],
    locations: locations ?? [],
  };
}

export async function fetchAgentSummary() {
  const response = await fetch(
    `${API_BASE_URL}/api/Statistics/agent-summary`,
    { headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } }
  );
  return handleResponse(response);
}

export async function fetchBSkadencaData({ year, comparisonYear, insuranceCompany = "", insuranceType = "", location = "", dateFrom = "", dateTo = "" } = {}) {
  const params = new URLSearchParams();
  if (year)           params.set("year", year);
  if (comparisonYear) params.set("comparisonYear", comparisonYear);
  if (insuranceCompany) params.set("insuranceCompany", insuranceCompany);
  if (insuranceType)    params.set("insuranceType", insuranceType);
  if (location)         params.set("location", location);
  if (dateFrom)         params.set("dateFrom", dateFrom);
  if (dateTo)           params.set("dateTo", dateTo);

  const response = await fetch(
    `${API_BASE_URL}/api/Statistics/bskadenca?${params.toString()}`,
    { headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } }
  );
  return handleResponse(response);
}

export async function fetchTodayPoliciesCount() {
  const response = await fetch(
    `${API_BASE_URL}/api/Statistics/todays-stats`,
    { headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } }
  );
  const data = await handleResponse(response);
  return data?.todaysPolicies ?? 0;
}
