const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const buildHeaders = (token) => {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || "Request failed";
    const fieldErrors = data?.errors?.fieldErrors || {};
    const entries = Object.entries(fieldErrors);
    if (entries.length > 0) {
      const [field, messages] = entries.find(([, msgs]) => msgs?.length) || [];
      if (field && messages?.length) {
        throw new Error(`${field}: ${messages[0]}`);
      }
    }
    const formErrors = data?.errors?.formErrors || [];
    if (formErrors.length > 0) {
      throw new Error(formErrors[0]);
    }
    throw new Error(message);
  }
  return data;
};

export const api = {
  login: async (payload) => {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  },
  registerStudent: async (payload) => {
    const response = await fetch(`${API_BASE}/api/auth/register-student`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  },
  registerParent: async (payload) => {
    const response = await fetch(`${API_BASE}/api/auth/register-parent`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  },
  registerAdmin: async (payload) => {
    const response = await fetch(`${API_BASE}/api/auth/register-admin`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  },
  getLogs: async ({ studentId, token, start, end }) => {
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    const response = await fetch(
      `${API_BASE}/api/students/${studentId}/logs?${params.toString()}`,
      { headers: buildHeaders(token) }
    );
    return handleResponse(response);
  },
  createLog: async ({ studentId, token, payload }) => {
    const response = await fetch(`${API_BASE}/api/students/${studentId}/logs`, {
      method: "POST",
      headers: buildHeaders(token),
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  },
  updateLog: async ({ studentId, logId, token, payload }) => {
    const response = await fetch(
      `${API_BASE}/api/students/${studentId}/logs/${logId}`,
      {
        method: "PUT",
        headers: buildHeaders(token),
        body: JSON.stringify(payload)
      }
    );
    return handleResponse(response);
  },
  getSummary: async ({ studentId, token }) => {
    const response = await fetch(
      `${API_BASE}/api/students/${studentId}/logs/summary`,
      { headers: buildHeaders(token) }
    );
    return handleResponse(response);
  },
  getNotes: async ({ studentId, token }) => {
    const response = await fetch(
      `${API_BASE}/api/students/${studentId}/notes`,
      { headers: buildHeaders(token) }
    );
    return handleResponse(response);
  },
  updateTarget: async ({ token, payload }) => {
    const response = await fetch(`${API_BASE}/api/students/me/target`, {
      method: "PATCH",
      headers: buildHeaders(token),
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  },
  getParentStudents: async ({ token }) => {
    const response = await fetch(`${API_BASE}/api/parents/me/students`, {
      headers: buildHeaders(token)
    });
    return handleResponse(response);
  },
  createNote: async ({ studentId, token, payload }) => {
    const response = await fetch(
      `${API_BASE}/api/students/${studentId}/notes`,
      {
        method: "POST",
        headers: buildHeaders(token),
        body: JSON.stringify(payload)
      }
    );
    return handleResponse(response);
  },
  updateNote: async ({ studentId, noteId, token, payload }) => {
    const response = await fetch(
      `${API_BASE}/api/students/${studentId}/notes/${noteId}`,
      {
        method: "PUT",
        headers: buildHeaders(token),
        body: JSON.stringify(payload)
      }
    );
    return handleResponse(response);
  },
  deleteNote: async ({ studentId, noteId, token }) => {
    const response = await fetch(
      `${API_BASE}/api/students/${studentId}/notes/${noteId}`,
      {
        method: "DELETE",
        headers: buildHeaders(token)
      }
    );
    return handleResponse(response);
  },
  listUsers: async ({ token, role }) => {
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    const response = await fetch(`${API_BASE}/api/admin/users?${params.toString()}`, {
      headers: buildHeaders(token)
    });
    return handleResponse(response);
  },
  resetStudentCode: async ({ token, studentId }) => {
    const response = await fetch(
      `${API_BASE}/api/admin/students/${studentId}/reset-code`,
      { method: "POST", headers: buildHeaders(token) }
    );
    return handleResponse(response);
  },
  linkParent: async ({ token, payload }) => {
    const response = await fetch(`${API_BASE}/api/admin/links`, {
      method: "POST",
      headers: buildHeaders(token),
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  },
  unlinkParent: async ({ token, payload }) => {
    const response = await fetch(`${API_BASE}/api/admin/links`, {
      method: "DELETE",
      headers: buildHeaders(token),
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  }
};
