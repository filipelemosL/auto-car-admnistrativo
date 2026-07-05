const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export const apiConfig = {
  apiBaseUrl,
  endpoints: {
    health: `${apiBaseUrl}/health`,
    appSnapshot: `${apiBaseUrl}/admin/snapshot`,
    clients: `${apiBaseUrl}/clients`,
    budgets: `${apiBaseUrl}/budgets`,
    serviceReports: `${apiBaseUrl}/service-reports`,
    reminders: `${apiBaseUrl}/reminders`,
    finance: `${apiBaseUrl}/finance`,
  },
};
