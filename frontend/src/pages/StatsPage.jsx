import React, { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import vinyl from "../assets/vinyl.svg";
import del from "../assets/DeleteButton.svg";
import "../styles/stats.css";

function getDeterministicColor(seed) {
    const text = String(seed || "playlist");
    let hash = 0;

    for (let index = 0; index < text.length; index += 1) {
        hash = text.charCodeAt(index) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 55%)`;
}

function buildColoredPlaylist(playlist) {
    return {
        ...playlist,
        color: getDeterministicColor(`${playlist.id}-${playlist.name}-${playlist.creator}`),
    };
}

function getTotalMinutes(playlist) {
    const totalSeconds = (playlist.songs || []).reduce(
        (sum, song) => sum + (song.durationSeconds || 0),
        0
    );

    return Math.max(1, Math.round(totalSeconds / 60));
}

function getListeningTime(playlist, index) {
    const baseMinutes = getTotalMinutes(playlist);
    const multipliers = [4, 3.2, 2.6, 2.1, 1.8, 1.5];
    const multiplier = multipliers[index] || 1.4;

    return Math.round(baseMinutes * multiplier);
}

function getRating(listeningTime, totalMinutes) {
    const ratio = listeningTime / Math.max(totalMinutes, 1);

    if (ratio >= 3) return 5;
    if (ratio >= 2.4) return 4;
    if (ratio >= 1.8) return 3;
    if (ratio >= 1.2) return 2;
    return 1;
}

function formatMinutesFromSeconds(totalSeconds) {
    return `${Math.round((totalSeconds || 0) / 60)} min`;
}

function formatDurationFromSeconds(totalSeconds) {
    const minutes = Math.floor((totalSeconds || 0) / 60);
    const seconds = (totalSeconds || 0) % 60;

    if (minutes === 0) {
        return `${seconds}s`;
    }

    if (seconds === 0) {
        return `${minutes}m`;
    }

    return `${minutes}m ${seconds}s`;
}

function StatsPage({
                       playlists,
                       statistics,
                       onDeletePlaylist,
                       generatorStatus,
                       liveConnected,
                       onStartGenerator,
                       onStopGenerator,
                   }) {
    const [activeView, setActiveView] = useState("table");
    const [splitRightView, setSplitRightView] = useState("chart");
    const [generatorBatchSize, setGeneratorBatchSize] = useState("3");
    const [generatorIntervalSeconds, setGeneratorIntervalSeconds] = useState("5");
    const [generatorError, setGeneratorError] = useState("");

    const batchSizePlaceholder = String(generatorStatus?.batchSize ?? 3);
    const intervalPlaceholder = String(generatorStatus?.intervalSeconds ?? 5);

    const basePlaylists = useMemo(() => {
        return playlists.map(buildColoredPlaylist);
    }, [playlists]);

    const statsData = useMemo(() => {
        const rows = basePlaylists.map((playlist, index) => {
            const totalMinutes = getTotalMinutes(playlist);
            const listeningTime = getListeningTime(playlist, index);
            const rating = getRating(listeningTime, totalMinutes);

            return {
                id: playlist.id,
                name: playlist.name,
                cover: playlist.cover,
                creator: playlist.creator,
                songsCount: playlist.songs.length,
                duration: playlist.duration,
                listeningTime,
                rating,
                color: playlist.color,
            };
        });

        const totalListeningMinutes = rows.reduce((sum, row) => sum + row.listeningTime, 0);

        return {
            rows,
            totalListeningMinutes,
        };
    }, [basePlaylists]);

    const pieGradient = useMemo(() => {
        if (statsData.rows.length === 0) {
            return "conic-gradient(#d9d9d9 0deg 360deg)";
        }

        let currentDeg = 0;

        const segments = statsData.rows.map((row) => {
            const percentage =
                statsData.totalListeningMinutes === 0
                    ? 0
                    : (row.listeningTime / statsData.totalListeningMinutes) * 100;

            const sweep = (percentage / 100) * 360;
            const start = currentDeg;
            const end = currentDeg + sweep;
            currentDeg = end;

            return `${row.color} ${start}deg ${end}deg`;
        });

        return `conic-gradient(${segments.join(", ")})`;
    }, [statsData]);

    const percentageLabels = useMemo(() => {
        return statsData.rows.map((row) => ({
            id: row.id,
            percentage:
                statsData.totalListeningMinutes === 0
                    ? 0
                    : Math.round((row.listeningTime / statsData.totalListeningMinutes) * 100),
            color: row.color,
        }));
    }, [statsData]);

    const topGenres = statistics?.topGenres || [];
    const maxGenreCount = Math.max(1, ...topGenres.map((item) => item.count));

    const renderStars = (count) => {
        return "★".repeat(count);
    };

    const handleSplitDelete = (id) => {
        const isRealPlaylist = playlists.some((playlist) => playlist.id === id);

        if (isRealPlaylist && onDeletePlaylist) {
            onDeletePlaylist(id);
        }
    };

    const handleStartGenerator = async () => {
        try {
            setGeneratorError("");

            const batchSize = Number(generatorBatchSize || batchSizePlaceholder);
            const intervalSeconds = Number(generatorIntervalSeconds || intervalPlaceholder);

            await onStartGenerator(batchSize, intervalSeconds);
        } catch (error) {
            setGeneratorError(error.message || "Could not start generator.");
        }
    };

    const handleStopGenerator = async () => {
        try {
            setGeneratorError("");
            await onStopGenerator();
        } catch (error) {
            setGeneratorError(error.message || "Could not stop generator.");
        }
    };

    const renderGeneratorPanel = () => (
        <div
            className="stats-card"
            style={{
                marginBottom: "2rem",
                padding: "1.65rem 1.85rem",
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "1.5rem",
                    flexWrap: "wrap",
                }}
            >
                <div style={{ maxWidth: "540px" }}>
                    <h2 style={{ margin: 0 }}>Live Generator</h2>
                    <p style={{ margin: "0.5rem 0 0", opacity: 0.82, lineHeight: 1.55 }}>
                        WebSocket: {liveConnected ? "connected" : "disconnected"} | Generator:{" "}
                        {generatorStatus?.running ? "running" : "stopped"}
                    </p>
                </div>

                <div className="playlist-header-buttons" style={{ margin: 0 }}>
                    <button className="view-stats" type="button" onClick={handleStartGenerator}>
                        Start Generator
                    </button>

                    <button className="view-stats" type="button" onClick={handleStopGenerator}>
                        Stop Generator
                    </button>
                </div>
            </div>

            <div
                style={{
                    display: "grid",
                    gap: "1.1rem",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 220px))",
                    marginTop: "1.35rem",
                }}
            >
                <label style={{ display: "grid", gap: "0.4rem" }}>
                    <span>Batch size</span>
                    <input
                        type="number"
                        min="1"
                        max="25"
                        value={generatorBatchSize}
                        placeholder={batchSizePlaceholder}
                        onChange={(event) => setGeneratorBatchSize(event.target.value)}
                    />
                </label>

                <label style={{ display: "grid", gap: "0.4rem" }}>
                    <span>Interval (seconds)</span>
                    <input
                        type="number"
                        min="1"
                        max="60"
                        value={generatorIntervalSeconds}
                        placeholder={intervalPlaceholder}
                        onChange={(event) => setGeneratorIntervalSeconds(event.target.value)}
                    />
                </label>
            </div>

            {generatorError && (
                <p style={{ color: "#7a1414", marginTop: "0.9rem", marginBottom: 0 }}>
                    {generatorError}
                </p>
            )}
        </div>
    );

    const renderCompactHomeLikeHeader = ({ showRating = true }) => (
        <div
            className={`stats-compact-table-head ${showRating ? "" : "stats-compact-table-head-simple"}`.trim()}
        >
            <span></span>
            <span>Name</span>
            <span>Songs</span>
            <span>Created by</span>
            {showRating && <span className="stats-rating-cell">Rating</span>}
        </div>
    );

    const renderCompactHomeLikeRows = ({ showRating = true }) => (
        <div className="stats-compact-table-body">
            {statsData.rows.map((row) => (
                <div
                    key={row.id}
                    className={`stats-compact-table-row ${showRating ? "" : "stats-compact-table-row-simple"}`.trim()}
                >
                    <div className="stats-cover-cell">
                        <img src={row.cover} alt={row.name} className="stats-cover" />
                        <img src={vinyl} alt="" className="stats-vinyl" />
                    </div>

                    <div className="stats-compact-name-cell">
                        <div style={{ fontWeight: 700, lineHeight: 1.15 }}>{row.name}</div>
                    </div>

                    <div style={{ fontWeight: 700 }}>{row.songsCount}</div>

                    <div style={{ fontWeight: 700 }}>{row.creator}</div>

                    {showRating && (
                        <div className="stats-rating stats-rating-cell">{renderStars(row.rating)}</div>
                    )}
                </div>
            ))}
        </div>
    );

    const renderTableView = () => (
        <div className="stats-card" style={{ padding: "1.95rem 2rem" }}>
            <div className="stats-subtitle" style={{ marginBottom: 0 }}>
                <h2>Most listened playlists</h2>
                <p>You have listened to {statsData.totalListeningMinutes} minutes of music</p>
            </div>

            <div style={{ marginTop: "1.35rem" }}>
                {renderCompactHomeLikeHeader({ showRating: true })}
                {renderCompactHomeLikeRows({ showRating: true })}
            </div>

            <div className="stats-footnote" style={{ marginTop: "1.2rem" }}>
                *Ratings reflect current playlist listening activity.
            </div>
        </div>
    );

    const renderChartOnlyCard = () => (
        <div className="stats-card" style={{ padding: "1.9rem 1.9rem 1.55rem" }}>
            <div className="stats-subtitle">
                <h2>Listening Distribution</h2>
                <p>Share of listening time across playlists</p>
            </div>

            <div className="stats-pie-area" style={{ gap: "1.25rem" }}>
                <div className="stats-pie" style={{ background: pieGradient }}></div>

                <div className="stats-pie-legend">
                    {percentageLabels.map((item) => (
                        <div key={item.id} className="stats-legend-item">
                            <span
                                className="stats-legend-color"
                                style={{ background: item.color }}
                            ></span>
                            <span>{item.percentage}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderAlbumsCardForChartView = () => (
        <div className="stats-card" style={{ padding: "1.95rem 2rem" }}>
            <div className="stats-subtitle" style={{ marginBottom: 0 }}>
                <h2>Albums</h2>
                <p>Playlist overview</p>
            </div>

            <div style={{ marginTop: "1.35rem" }}>
                {renderCompactHomeLikeHeader({ showRating: false })}
                {renderCompactHomeLikeRows({ showRating: false })}
            </div>
        </div>
    );

    const renderChartView = () => (
        <div
            style={{
                display: "grid",
                gap: "1.75rem",
                gridTemplateColumns: "minmax(320px, 0.9fr) minmax(0, 1.15fr)",
                alignItems: "start",
            }}
        >
            {renderChartOnlyCard()}
            {renderAlbumsCardForChartView()}
        </div>
    );

    const renderServerStatsView = () => (
        <div className="stats-card" style={{ padding: "1.95rem 2rem" }}>
            <div className="stats-subtitle">
                <h2>Server Statistics</h2>
                <p>Live backend numbers for generated and synchronized playlists</p>
            </div>

            {!statistics ? (
                <p>Statistics are not available right now.</p>
            ) : (
                <div style={{ display: "grid", gap: "1.2rem" }}>
                    <div
                        style={{
                            display: "grid",
                            gap: "1rem",
                            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                        }}
                    >
                        <div>
                            <strong>Total playlists</strong>
                            <div style={{ marginTop: "0.25rem" }}>{statistics.totalPlaylists}</div>
                        </div>

                        <div>
                            <strong>Total songs</strong>
                            <div style={{ marginTop: "0.25rem" }}>{statistics.totalSongs}</div>
                        </div>

                        <div>
                            <strong>Total duration</strong>
                            <div style={{ marginTop: "0.25rem" }}>
                                {formatMinutesFromSeconds(statistics.totalDurationSeconds)}
                            </div>
                        </div>

                        <div>
                            <strong>Avg songs / playlist</strong>
                            <div style={{ marginTop: "0.25rem" }}>{statistics.averageSongsPerPlaylist}</div>
                        </div>
                    </div>

                    <div>
                        <strong>Average duration / playlist</strong>
                        <div style={{ marginTop: "0.25rem" }}>
                            {formatDurationFromSeconds(statistics.averageDurationSecondsPerPlaylist)}
                        </div>
                    </div>

                    <div style={{ display: "grid", gap: "0.75rem" }}>
                        <strong>Top genres</strong>

                        {topGenres.length === 0 ? (
                            <p style={{ margin: 0 }}>No genre data available yet.</p>
                        ) : (
                            topGenres.map((genreItem, index) => {
                                const width = Math.round((genreItem.count / maxGenreCount) * 100);
                                const color = getDeterministicColor(`${genreItem.genre}-${index}`);

                                return (
                                    <div key={genreItem.genre} style={{ display: "grid", gap: "0.35rem" }}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                gap: "1rem",
                                            }}
                                        >
                                            <span>{genreItem.genre}</span>
                                            <span>{genreItem.count}</span>
                                        </div>

                                        <div
                                            style={{
                                                height: "10px",
                                                borderRadius: "999px",
                                                background: "#ececec",
                                                overflow: "hidden",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    height: "100%",
                                                    width: `${width}%`,
                                                    borderRadius: "999px",
                                                    background: color,
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div>
                        <strong>Longest playlist</strong>

                        {statistics.longestPlaylist ? (
                            <div style={{ marginTop: "0.55rem", display: "grid", gap: "0.3rem" }}>
                                <div>{statistics.longestPlaylist.name}</div>
                                <div>Creator: {statistics.longestPlaylist.creator}</div>
                                <div>Songs: {statistics.longestPlaylist.songsCount}</div>
                                <div>
                                    Duration:{" "}
                                    {formatDurationFromSeconds(
                                        statistics.longestPlaylist.totalDurationSeconds
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div style={{ marginTop: "0.55rem" }}>No playlist available.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    const renderSplitView = () => (
        <div className="stats-split-layout" style={{ gap: "1.75rem" }}>
            <div>{renderTableView()}</div>
            <div>{splitRightView === "chart" ? renderChartOnlyCard() : renderServerStatsView()}</div>
        </div>
    );

    return (
        <div className="stats-page page-fade">
            <Navbar activePage="home" />

            <section className="stats-wrapper" style={{ display: "grid", gap: "1.6rem" }}>
                <div className="stats-header" style={{ marginBottom: 0 }}>
                    <div>
                        <h1>Playlist Statistics</h1>
                        <p>Track your playlists and watch live server-generated updates appear here.</p>
                    </div>

                    <div className="playlist-header-buttons">
                        <button className="view-stats" type="button" onClick={() => setActiveView("table")}>
                            Table View
                        </button>

                        <button className="view-stats" type="button" onClick={() => setActiveView("chart")}>
                            Chart View
                        </button>

                        <button className="view-stats" type="button" onClick={() => setActiveView("split")}>
                            Split View
                        </button>
                    </div>
                </div>

                {renderGeneratorPanel()}

                {activeView === "split" && (
                    <div
                        className="playlist-header-buttons"
                        style={{ marginBottom: 0, flexWrap: "wrap" }}
                    >
                        <button
                            className="view-stats"
                            type="button"
                            onClick={() => setSplitRightView("stats")}
                        >
                            Stats View
                        </button>

                        <button
                            className="view-stats"
                            type="button"
                            onClick={() => setSplitRightView("chart")}
                        >
                            Chart View
                        </button>
                    </div>
                )}

                {activeView === "table" && renderTableView()}
                {activeView === "chart" && renderChartView()}
                {activeView === "split" && renderSplitView()}

                <div className="stats-delete-list" style={{ marginTop: "0.25rem" }}>
                    {statsData.rows.map((row) => (
                        <button
                            key={row.id}
                            type="button"
                            className="stats-delete-item"
                            onClick={() => handleSplitDelete(row.id)}
                        >
                            <img src={del} alt="" />
                            <span>{row.name}</span>
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
}

export default StatsPage;
