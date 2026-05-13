import { apiFetch } from "./httpApi";

export function fetchAuditLogsApi() {
    return apiFetch("/api/admin/audit-logs");
}

export function fetchObservationListApi() {
    return apiFetch("/api/admin/observation-list");
}
