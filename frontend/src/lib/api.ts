export const API_BASE_URL = 'http://localhost:8000';

// Helper to include auth token
function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(username: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json(); // { access_token: string }
}

export async function getMe(token?: string) {
  const headers = token ? { Authorization: `Bearer ${token}` } : authHeaders();
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { ...headers },
  });
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json(); // UserResponse
}

// Hosted Zones
export async function fetchHostedZones(params: { search?: string; page?: number; pageSize?: number } = {}) {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.page) query.append('page', params.page.toString());
  if (params.pageSize) query.append('page_size', params.pageSize.toString());
  const res = await fetch(`${API_BASE_URL}/api/hosted-zones?${query.toString()}`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch hosted zones');
  return res.json(); // HostedZoneListResponse
}

export async function createHostedZone(data: { name: string; comment?: string }) {
  const res = await fetch(`${API_BASE_URL}/api/hosted-zones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create hosted zone');
  return res.json();
}

export async function updateHostedZone(zoneId: string, data: { name?: string; comment?: string }) {
  const res = await fetch(`${API_BASE_URL}/api/hosted-zones/${zoneId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update hosted zone');
  return res.json();
}

export async function deleteHostedZone(zoneId: string) {
  const res = await fetch(`${API_BASE_URL}/api/hosted-zones/${zoneId}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to delete hosted zone');
  return res.json();
}

// DNS Records
export async function fetchDNSRecords(zoneId: string, params: { search?: string; type?: string; page?: number; pageSize?: number } = {}) {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.type) query.append('type', params.type);
  if (params.page) query.append('page', params.page.toString());
  if (params.pageSize) query.append('page_size', params.pageSize.toString());
  const res = await fetch(`${API_BASE_URL}/api/hosted-zones/${zoneId}/records?${query.toString()}`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch DNS records');
  return res.json();
}

export async function createDNSRecord(zoneId: string, data: any) {
  const res = await fetch(`${API_BASE_URL}/api/hosted-zones/${zoneId}/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create DNS record');
  return res.json();
}

export async function updateDNSRecord(zoneId: string, recordId: string, data: any) {
  const res = await fetch(`${API_BASE_URL}/api/hosted-zones/${zoneId}/records/${recordId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update DNS record');
  return res.json();
}

export async function deleteDNSRecord(zoneId: string, recordId: string) {
  const res = await fetch(`${API_BASE_URL}/api/hosted-zones/${zoneId}/records/${recordId}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to delete DNS record');
  return res.json();
}
