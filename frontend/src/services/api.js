const rawBase = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const cleanBase = rawBase.replace(/\/+$/, "");
const API_BASE = cleanBase.endsWith("/api") ? cleanBase : `${cleanBase}/api`;

export async function fetchJson(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error ${response.status}: ${errorBody}`);
  }
  return response.json();
}

export const api = {
  // Health
  getHealth: () => fetchJson("/health"),
  getSupabaseHealth: () => fetchJson("/health/supabase"),

  // Dashboard & Analytics
  getDashboardSummary: () => fetchJson("/analytics/summary"),
  getHeatmapData: () => fetchJson("/analytics/heatmap"),
  getAnalyticsBreakdown: () => fetchJson("/analytics/breakdown"),

  // Buses
  getBuses: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/buses${query ? `?${query}` : ""}`);
  },
  getBusDetail: (busId) => fetchJson(`/buses/${busId}`),
  uploadBusFootage: async (busId, formData) => {
    const response = await fetch(`${API_BASE}/buses/${busId}/upload-footage`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload Error ${response.status}: ${errorText}`);
    }
    return response.json();
  },

  // Events
  getEvents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/events${query ? `?${query}` : ""}`);
  },
  getEvent: (eventId) => fetchJson(`/events/${eventId}`),
  createEvent: (data) => fetchJson("/events", { method: "POST", body: JSON.stringify(data) }),

  // Issues
  getIssues: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/issues${query ? `?${query}` : ""}`);
  },
  getIssue: (issueId) => fetchJson(`/issues/${issueId}`),
  updateIssueStatus: (issueId, data) => fetchJson(`/issues/${issueId}/status`, { method: "PATCH", body: JSON.stringify(data) }),
  assignIssue: (issueId, data) => fetchJson(`/issues/${issueId}/assign`, { method: "POST", body: JSON.stringify(data) }),
  recheckIssue: (issueId, data) => fetchJson(`/issues/${issueId}/recheck`, { method: "POST", body: JSON.stringify(data) }),

  // Traffic
  getTrafficSummary: () => fetchJson("/traffic/summary"),
  getTrafficHeatmap: () => fetchJson("/traffic/heatmap"),
  getTrafficObservations: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/traffic/observations${query ? `?${query}` : ""}`);
  },
  getOriginDestinationFlows: () => fetchJson("/traffic/od"),
  getRouteDelays: () => fetchJson("/traffic/routes"),
  getBottlenecks: () => fetchJson("/traffic/bottlenecks"),

  // Incidents
  getIncidents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/incidents${query ? `?${query}` : ""}`);
  },
  simulateAnpr: () => fetchJson("/incidents/simulate-anpr", { method: "POST" }),
  simulateHitAndRun: () => fetchJson("/incidents/simulate-hit-and-run", { method: "POST" }),
  simulatePedestrian: () => fetchJson("/incidents/simulate-pedestrian", { method: "POST" }),
  simulateSchoolCrossing: () => fetchJson("/incidents/simulate-school-crossing", { method: "POST" }),
  dispatchIncidentAlert: (incidentId, notes = "Intervention requested by Control Officer") =>
    fetchJson(`/incidents/${incidentId}/alert`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    }),

  // Simulation & Fleet Demo
  advanceFleet: () => fetchJson("/simulation/advance-fleet", { method: "POST" }),
  runDemoStep: (step) => fetchJson(`/simulation/sih-demo/step/${step}`, { method: "POST" }),
  runSihStep: (step) => fetchJson(`/simulation/sih-demo/step/${step}`, { method: "POST" }),
  resetDatabase: () => fetchJson("/simulation/reset-db", { method: "POST" }),
  importRealDataset: () => fetchJson("/simulation/import-real-dataset", { method: "POST" }),
};

