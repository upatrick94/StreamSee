import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import vinyl from "../assets/vinyl.svg";
import "../styles/history.css";
import { fetchPlaylistHistoryApi } from "../api/playlistsApi";
import { hasPermission, readAuthSession } from "../api/authApi";

function getRatingStars(playlist) {
    const songCount = playlist.songs.length;
    if (songCount >= 5) return 4;
    if (songCount >= 4) return 3;
    if (songCount >= 2) return 2;
    return 1;
}

function PlaylistHistoryPage({ playlists, onRestorePlaylistSnapshot }) {
    const { playlistId } = useParams();
    const navigate = useNavigate();
    const session = readAuthSession();
    const canRestore = hasPermission(session, "PLAYLIST_RESTORE");

    const playlist = useMemo(
        () => playlists.find((item) => item.id === Number(playlistId)),
        [playlists, playlistId]
    );

    const [historyEntries, setHistoryEntries] = useState([]);
    const [manuallySelectedEntryId, setManuallySelectedEntryId] = useState(null);
    const [restoreMessage, setRestoreMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        async function loadHistory() {
            if (!playlistId) return;

            try {
                setErrorMessage("");
                const data = await fetchPlaylistHistoryApi(playlistId);
                setHistoryEntries(data.content);
            } catch (error) {
                setErrorMessage(error.message || "Could not load playlist history.");
            }
        }

        void loadHistory();
    }, [playlistId]);

    const selectedEntryId = useMemo(() => {
        if (
            manuallySelectedEntryId &&
            historyEntries.some((entry) => entry.id === manuallySelectedEntryId)
        ) {
            return manuallySelectedEntryId;
        }

        return historyEntries.length > 0
            ? historyEntries[historyEntries.length - 1].id
            : null;
    }, [historyEntries, manuallySelectedEntryId]);

    if (!playlist) {
        return (
            <div className="history-page page-fade">
                <Navbar activePage="playlists" />
                <section className="history-wrapper">
                    <h1 className="history-title">Playlist History</h1>
                    <p className="history-empty-text">Playlist not found.</p>
                </section>
            </div>
        );
    }

    const handleConfirmRestore = async () => {
        if (!selectedEntryId || !onRestorePlaylistSnapshot || !canRestore) return;

        try {
            setRestoreMessage("");
            setErrorMessage("");

            await onRestorePlaylistSnapshot(playlist.id, selectedEntryId);

            const updatedHistory = await fetchPlaylistHistoryApi(playlist.id);
            setHistoryEntries(updatedHistory.content);

            setRestoreMessage("Snapshot restored successfully.");
        } catch (error) {
            setRestoreMessage("");
            setErrorMessage(error.message || "Could not restore snapshot.");
        }
    };

    return (
        <div className="history-page page-fade">
            <Navbar activePage="playlists" />

            <section className="history-wrapper">
                <h1 className="history-title">Playlist History</h1>

                <div className="history-summary-card">
                    <div className="history-summary-header">
                        <span></span>
                        <span>Name</span>
                        <span>Songs</span>
                        <span>Created by</span>
                        <span>Duration</span>
                        <span>Rating</span>
                    </div>

                    <div className="history-summary-row">
                        <div className="history-cover-cell">
                            <img src={playlist.cover} alt={playlist.name} className="history-cover" />
                            <img src={vinyl} alt="" className="history-vinyl" />
                        </div>

                        <div>{playlist.name}</div>
                        <div>{playlist.songs.length}</div>
                        <div>{playlist.creator}</div>
                        <div>{playlist.duration}</div>
                        <div className="history-stars">{"★".repeat(getRatingStars(playlist))}</div>
                    </div>
                </div>

                <div className="history-timeline">
                    <div className="history-line"></div>

                    {historyEntries.map((entry, index) => {
                        const isLeft = index % 2 === 0;
                        const isSelected = entry.id === selectedEntryId;

                        return (
                            <div key={entry.id} className={`history-timeline-item ${isLeft ? "left" : "right"}`}>
                                <button
                                    type="button"
                                    className={`history-dot ${isSelected ? "selected" : ""}`}
                                    onClick={() => {
                                        setManuallySelectedEntryId(entry.id);
                                        setRestoreMessage("");
                                        setErrorMessage("");
                                    }}
                                    aria-label={`Select snapshot ${entry.action} ${entry.highlight}`}
                                ></button>

                                <button
                                    type="button"
                                    className={`history-event-card ${isSelected ? "selected" : ""}`}
                                    onClick={() => {
                                        setManuallySelectedEntryId(entry.id);
                                        setRestoreMessage("");
                                        setErrorMessage("");
                                    }}
                                >
                                    <span className="history-event-action">{entry.action}</span>
                                    <span className="history-event-highlight">{entry.highlight}</span>
                                    <span className="history-event-date">{entry.date}</span>
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="history-actions">
                    <button
                        type="button"
                        className="history-confirm-button"
                        onClick={handleConfirmRestore}
                        disabled={!selectedEntryId || !onRestorePlaylistSnapshot || !canRestore}
                    >
                        {canRestore ? "Confirm restore" : "Restore requires admin"}
                    </button>

                    <button
                        type="button"
                        className="history-back-button"
                        onClick={() => navigate("/playlists")}
                    >
                        Back
                    </button>
                </div>

                {restoreMessage && <p className="history-restore-message">{restoreMessage}</p>}
                {errorMessage && <p className="history-restore-message">{errorMessage}</p>}
            </section>
        </div>
    );
}

export default PlaylistHistoryPage;
