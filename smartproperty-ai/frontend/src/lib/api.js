import axios from 'axios';
const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '';
export const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});
// Dashboard
export const getDashboardKPIs = () => api.get('/api/dashboard/kpis');
export const getRevenueTrend = () => api.get('/api/dashboard/revenue-trend');
export const getOccupancyByProperty = () => api.get('/api/dashboard/occupancy-by-property');
// Properties
export const getProperties = () => api.get('/api/properties/');
export const getProperty = (id) => api.get(`/api/properties/${id}`);
export const createProperty = (data) => api.post('/api/properties/', data);
export const updateProperty = (id, data) => api.put(`/api/properties/${id}`, data);
export const deleteProperty = (id) => api.delete(`/api/properties/${id}`);
// Units
export const getUnits = (params) => api.get('/api/units/', { params });
export const getUnit = (id) => api.get(`/api/units/${id}`);
export const createUnit = (data) => api.post('/api/units/', data);
export const updateUnit = (id, data) => api.put(`/api/units/${id}`, data);
export const deleteUnit = (id) => api.delete(`/api/units/${id}`);
// Tenants
export const getTenants = () => api.get('/api/tenants/');
export const getTenant = (id) => api.get(`/api/tenants/${id}`);
export const createTenant = (data) => api.post('/api/tenants/', data);
export const updateTenant = (id, data) => api.put(`/api/tenants/${id}`, data);
export const deleteTenant = (id) => api.delete(`/api/tenants/${id}`);
export const getTenantLeases = (id) => api.get(`/api/tenants/${id}/leases`);
export const getTenantPayments = (id) => api.get(`/api/tenants/${id}/payments`);
// Leases
export const getLeases = (params) => api.get('/api/leases/', { params });
export const getLease = (id) => api.get(`/api/leases/${id}`);
export const createLease = (data) => api.post('/api/leases/', data);
export const updateLease = (id, data) => api.put(`/api/leases/${id}`, data);
export const getExpiringLeases = (days) => api.get('/api/leases/expiring', { params: { days } });
// Payments
export const getPayments = (params) => api.get('/api/payments/', { params });
export const createPayment = (data) => api.post('/api/payments/', data);
export const updatePayment = (id, data) => api.put(`/api/payments/${id}`, data);
export const getOverduePayments = () => api.get('/api/payments/overdue');
// Maintenance
export const getMaintenance = (params) => api.get('/api/maintenance/', { params });
export const createMaintenance = (data) => api.post('/api/maintenance/', data);
export const updateMaintenance = (id, data) => api.put(`/api/maintenance/${id}`, data);
export const deleteMaintenance = (id) => api.delete(`/api/maintenance/${id}`);
export const getDueMaintenance = (days) => api.get('/api/maintenance/due', { params: { days } });
// Calendar
export const getCalendarEvents = (month, year) => api.get('/api/calendar/events', { params: { month, year } });
// AI
export const queryAI = (query) => api.post('/api/ai/query', { query });
export const getAIAlerts = () => api.get('/api/ai/alerts');
export const getAIInsights = () => api.get('/api/ai/insights');
// Reports
export const getRevenueReport = () => api.get('/api/reports/revenue');
export const getOccupancyReport = () => api.get('/api/reports/occupancy');
export const getMaintenanceCostReport = () => api.get('/api/reports/maintenance-costs');
export const getVacancyReport = () => api.get('/api/reports/vacancy');
export const getRenewalPipeline = () => api.get('/api/reports/renewal-pipeline');
