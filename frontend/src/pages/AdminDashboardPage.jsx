import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { fetchAuditLogsApi, fetchObservationListApi } from "../api/adminApi";
import "../styles/admin.css";

function AdminDashboardPage() {
    const [logs, setLogs] = useState([]);
    const [observationList, setObservationList] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadData() {
            try {
                setErrorMessage("");
                const [auditLogs, observedUsers] = await Promise.all([
                    fetchAuditLogsApi(),
                    fetchObservationListApi(),
                ]);

                if (!cancelled) {
                    setLogs(auditLogs);
                    setObservationList(observedUsers);
                }
            } catch (error) {
                if (!cancelled) {
                    setErrorMessage(error.message || "Could not load admin dashboard.");
                }
            }
        }

        loadData();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="admin-page page-fade">
            <Navbar activePage="admin" />

            <section className="admin-shell">
                <div className="admin-header">
                    <h1>Admin Dashboard</h1>
                    <p>Audit logs and suspicious-user observation list persisted on the backend.</p>
                </div>

                {errorMessage && <p className="admin-error">{errorMessage}</p>}

                <div className="admin-grid">
                    <section className="admin-card">
                        <h2>Observation List</h2>

                        {observationList.length === 0 ? (
                            <p>No suspicious users detected.</p>
                        ) : (
                            <div className="admin-table-wrap">
                                <table className="admin-table">
                                    <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Reason</th>
                                        <th>Evidence</th>
                                        <th>Last detected</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {observationList.map((entry) => (
                                        <tr key={entry.userId}>
                                            <td>{entry.username}</td>
                                            <td>{entry.reason}</td>
                                            <td>{entry.evidenceCount}</td>
                                            <td>{new Date(entry.lastDetectedAt).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section className="admin-card">
                        <h2>Recent Audit Logs</h2>

                        <div className="admin-table-wrap">
                            <table className="admin-table">
                                <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Group</th>
                                    <th>Action</th>
                                    <th>Time</th>
                                    <th>Status</th>
                                </tr>
                                </thead>
                                <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id}>
                                        <td>{log.username}</td>
                                        <td>{log.groupName}</td>
                                        <td>{log.actionInformation}</td>
                                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                                        <td>{log.suspicious ? "Suspicious" : "Normal"}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </section>
        </div>
    );
}

export default AdminDashboardPage;
