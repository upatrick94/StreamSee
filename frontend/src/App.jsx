import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import About from "./pages/About";
import Home from "./pages/Home";
import PlaylistGridPage from "./pages/PlaylistGridPage";
import RecommendedPage from "./pages/RecommendedPage";
import CreatePlaylistPage from "./pages/CreatePlaylistPage";
import EditPlaylistPage from "./pages/EditPlaylistPage";
import StatsPage from "./pages/StatsPage";
import PlaylistHistoryPage from "./pages/PlaylistHistoryPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChatPage from "./pages/ChatPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import AuthCodePage from "./pages/AuthCodePage";

import sundayChillCover from "./assets/Clear Music.jpg";
import throwbackMixCover from "./assets/vibing cd playlist cover.jpg";
import { buildPlaylist } from "./utils/playlistHelpers";
import {
    createPlaylistApi,
    deletePlaylistApi,
    fetchPlaylists,
    fetchStatisticsApi,
    invalidatePlaylistsCache,
    mapPlaylistResponse,
    pingServerApi,
    restorePlaylistSnapshotApi,
    updatePlaylistApi,
} from "./api/playlistsApi";
import {
    fetchGeneratorStatusApi,
    startGeneratorApi,
    stopGeneratorApi,
} from "./api/generatorApi";
import { connectToPlaylistUpdates } from "./services/liveUpdates";
import {
    createTempPlaylistId,
    enqueueOperation,
    readCachedPlaylists,
    readPendingOperations,
    writeCachedPlaylists,
    writePendingOperations,
} from "./services/offlineQueue";
import {
    getTopPreferences,
    personalizeRecommendedPlaylists,
    readActivityProfile,
    trackPageVisit,
    trackPlaylistAction,
} from "./utils/browserActivityCookies";
import {
    clearAuthSession,
    hasPermission,
    isSessionExpired,
    readAuthSession,
    touchAuthSession,
} from "./api/authApi";

function isConnectivityError(error) {
    if (!error) return false;
    if (error instanceof TypeError) return true;
    return /failed to fetch|networkerror|load failed|network request failed/i.test(error.message || "");
}

function formatDisplayDate(date = new Date()) {
    const day = String(date.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

function buildOfflinePlaylist(playlistId, playlistData, existingPlaylist = null) {
    const today = formatDisplayDate();

    return buildPlaylist({
        ...(existingPlaylist || {}),
        ...playlistData,
        id: playlistId,
        cover: playlistData.cover?.trim() || "",
        createdAt: existingPlaylist?.createdAt || today,
        updatedAt: today,
    });
}

function ProtectedRoute({ authenticated, children }) {
    return authenticated ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ authenticated, allowed, children }) {
    if (!authenticated) {
        return <Navigate to="/login" replace />;
    }

    return allowed ? children : <Navigate to="/home" replace />;
}

function App() {
    const location = useLocation();
    const authSession = readAuthSession();
    const isAuthenticated = Boolean(authSession?.userId && authSession?.token);
    const canViewAdmin = hasPermission(authSession, "AUDIT_VIEW");

    const [playlists, setPlaylists] = useState([]);
    const [pendingOperations, setPendingOperations] = useState(() => readPendingOperations());
    const [statistics, setStatistics] = useState(null);
    const [isLoading, setIsLoading] = useState(isAuthenticated);
    const [loadError, setLoadError] = useState("");
    const [actionError, setActionError] = useState("");
    const [syncMessage, setSyncMessage] = useState("");
    const [connectionState, setConnectionState] = useState(() =>
        typeof navigator !== "undefined" && navigator.onLine ? "checking" : "offline"
    );
    const [activityProfile, setActivityProfile] = useState(() => readActivityProfile());
    const [generatorStatus, setGeneratorStatus] = useState({
        running: false,
        batchSize: 3,
        intervalSeconds: 5,
    });
    const [liveConnected, setLiveConnected] = useState(false);

    const playlistsRef = useRef(playlists);
    const pendingOperationsRef = useRef(pendingOperations);

    const [recommendedPlaylists, setRecommendedPlaylists] = useState([
        buildPlaylist({
            id: 101,
            name: "Chill Vibes",
            creator: "Alex",
            cover: sundayChillCover,
            description: "Relaxing chill music for late afternoons and quiet evenings.",
            genres: ["Lo-fi", "Chill"],
            createdAt: "01 Apr 2026",
            updatedAt: "01 Apr 2026",
            songs: [
                { id: 1011, title: "Sunset Lover", artist: "Petit Biscuit", durationSeconds: 238 },
                { id: 1012, title: "Space Song", artist: "Beach House", durationSeconds: 321 },
                { id: 1013, title: "Coffee", artist: "beabadoobee", durationSeconds: 151 },
            ],
        }),
        buildPlaylist({
            id: 102,
            name: "Party Hits",
            creator: "Mike",
            cover: throwbackMixCover,
            description: "Big energy tracks for parties, road trips, and dancing.",
            genres: ["Pop", "Dance"],
            createdAt: "01 Apr 2026",
            updatedAt: "01 Apr 2026",
            songs: [
                { id: 1021, title: "Yeah!", artist: "Usher", durationSeconds: 250 },
                { id: 1022, title: "SexyBack", artist: "Justin Timberlake", durationSeconds: 242 },
                { id: 1023, title: "Party Rock Anthem", artist: "LMFAO", durationSeconds: 262 },
            ],
        }),
    ]);

    useEffect(() => {
        if (!authSession) {
            clearAuthSession();
        }
    }, [authSession]);

    useEffect(() => {
        playlistsRef.current = playlists;
        writeCachedPlaylists(playlists);
    }, [playlists]);

    useEffect(() => {
        pendingOperationsRef.current = pendingOperations;
        writePendingOperations(pendingOperations);
    }, [pendingOperations]);

    useEffect(() => {
        const updatedProfile = trackPageVisit(location.pathname);
        setActivityProfile(updatedProfile);
    }, [location.pathname]);

    useEffect(() => {
        if (!isAuthenticated) {
            return undefined;
        }

        const handleActivity = () => {
            touchAuthSession();
        };

        const intervalId = window.setInterval(() => {
            const session = readAuthSession();
            if (!session || isSessionExpired(session)) {
                clearAuthSession();
                window.location.assign("/login");
            }
        }, 1000);

        const events = ["click", "keydown", "mousemove", "scroll", "touchstart"];

        events.forEach((eventName) => {
            window.addEventListener(eventName, handleActivity);
        });

        return () => {
            window.clearInterval(intervalId);
            events.forEach((eventName) => {
                window.removeEventListener(eventName, handleActivity);
            });
        };
    }, [isAuthenticated]);

    const clearActionError = () => setActionError("");

    const loadServerData = useCallback(async () => {
        const [firstPlaylistPage, generatorData, serverStatistics] = await Promise.all([
            fetchPlaylists(0, 12, { force: true }),
            fetchGeneratorStatusApi(),
            fetchStatisticsApi(),
        ]);

        invalidatePlaylistsCache();
        setPlaylists(firstPlaylistPage.content);
        setGeneratorStatus(generatorData);
        setStatistics(serverStatistics);
        setConnectionState("online");
        setLoadError("");
    }, []);

    const refreshStatistics = useCallback(async () => {
        try {
            const serverStatistics = await fetchStatisticsApi();
            setStatistics(serverStatistics);
        } catch (error) {
            if (!isConnectivityError(error)) {
                setActionError(error.message || "Could not refresh statistics.");
            }
        }
    }, []);

    const syncPendingChanges = useCallback(async () => {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
            setConnectionState("offline");
            return false;
        }

        try {
            setConnectionState("syncing");
            await pingServerApi();

            let queue = [...pendingOperationsRef.current];

            while (queue.length > 0) {
                const operation = queue[0];

                if (operation.type === "create") {
                    const createdPlaylist = await createPlaylistApi(operation.payload);

                    setPlaylists((currentPlaylists) =>
                        currentPlaylists.map((playlist) =>
                            playlist.id === operation.playlistId ? createdPlaylist : playlist
                        )
                    );

                    queue = queue
                        .slice(1)
                        .map((item) =>
                            item.playlistId === operation.playlistId
                                ? { ...item, playlistId: createdPlaylist.id }
                                : item
                        );

                    setPendingOperations(queue);
                    continue;
                }

                if (operation.type === "update") {
                    await updatePlaylistApi(operation.playlistId, operation.payload);
                    queue = queue.slice(1);
                    setPendingOperations(queue);
                    continue;
                }

                if (operation.type === "delete") {
                    if (operation.playlistId > 0) {
                        await deletePlaylistApi(operation.playlistId);
                    }

                    queue = queue.slice(1);
                    setPendingOperations(queue);
                }
            }

            await loadServerData();
            setSyncMessage("Offline changes synchronized with the server.");
            return true;
        } catch (error) {
            if (isConnectivityError(error)) {
                setConnectionState(typeof navigator !== "undefined" && navigator.onLine ? "server-unreachable" : "offline");
                return false;
            }

            if (/permission|unauthorized|forbidden/i.test(error.message || "")) {
                clearAuthSession();
                window.location.assign("/login");
                return false;
            }

            setActionError(error.message || "Could not synchronize offline changes.");
            setConnectionState("online");
            return false;
        }
    }, [loadServerData]);

    const verifyConnectionAndRefresh = useCallback(async () => {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
            setConnectionState("offline");
            return;
        }

        try {
            await pingServerApi();

            if (pendingOperationsRef.current.length > 0) {
                await syncPendingChanges();
                return;
            }

            await loadServerData();
        } catch (error) {
            if (isConnectivityError(error)) {
                setConnectionState("server-unreachable");
                return;
            }

            if (/permission|unauthorized|forbidden/i.test(error.message || "")) {
                clearAuthSession();
                window.location.assign("/login");
                return;
            }

            setActionError(error.message || "Could not refresh data from the server.");
        }
    }, [loadServerData, syncPendingChanges]);

    useEffect(() => {
        if (!isAuthenticated) {
            setIsLoading(false);
            return;
        }

        let isCancelled = false;

        async function bootstrap() {
            try {
                if (typeof navigator !== "undefined" && !navigator.onLine) {
                    setPlaylists(readCachedPlaylists());
                    setConnectionState("offline");
                    return;
                }

                await verifyConnectionAndRefresh();
            } catch (error) {
                const cachedPlaylists = readCachedPlaylists();

                if (!isCancelled && cachedPlaylists.length > 0) {
                    setPlaylists(cachedPlaylists);
                }

                if (!isCancelled) {
                    if (isConnectivityError(error)) {
                        setConnectionState(typeof navigator !== "undefined" && navigator.onLine ? "server-unreachable" : "offline");
                    } else {
                        setLoadError(error.message || "Could not load playlists.");
                    }
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        }

        void bootstrap();

        return () => {
            isCancelled = true;
        };
    }, [isAuthenticated, verifyConnectionAndRefresh]);

    useEffect(() => {
        if (!isAuthenticated) {
            return undefined;
        }

        function handleOnline() {
            setSyncMessage("");
            setConnectionState("checking");
            void verifyConnectionAndRefresh();
        }

        function handleOffline() {
            setConnectionState("offline");
        }

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [isAuthenticated, verifyConnectionAndRefresh]);

    useEffect(() => {
        if (!isAuthenticated) {
            return undefined;
        }

        const intervalId = window.setInterval(() => {
            if (typeof navigator !== "undefined" && navigator.onLine) {
                void verifyConnectionAndRefresh();
            }
        }, 15000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [isAuthenticated, verifyConnectionAndRefresh]);

    useEffect(() => {
        if (!isAuthenticated) {
            return undefined;
        }

        const disconnect = connectToPlaylistUpdates({
            onConnectionChange: setLiveConnected,
            onBatch: (payload) => {
                invalidatePlaylistsCache();

                if (payload?.playlists?.length) {
                    const incomingPlaylists = payload.playlists.map(mapPlaylistResponse);

                    setPlaylists((currentPlaylists) => {
                        const nextPlaylists = [...currentPlaylists];

                        for (const playlist of incomingPlaylists) {
                            const existingIndex = nextPlaylists.findIndex((item) => item.id === playlist.id);

                            if (existingIndex >= 0) {
                                nextPlaylists[existingIndex] = playlist;
                            } else {
                                nextPlaylists.push(playlist);
                            }
                        }

                        return nextPlaylists;
                    });
                }

                if (payload?.statistics) {
                    setStatistics(payload.statistics);
                } else {
                    void refreshStatistics();
                }
            },
        });

        return disconnect;
    }, [isAuthenticated, refreshStatistics]);

    const handleDeletePlaylist = async (playlistId) => {
        const playlistToDelete = playlistsRef.current.find((playlist) => playlist.id === playlistId);

        try {
            clearActionError();
            setSyncMessage("");

            if (playlistToDelete) {
                const updatedProfile = trackPlaylistAction("delete", playlistToDelete);
                setActivityProfile(updatedProfile);
            }

            if (connectionState === "online") {
                await deletePlaylistApi(playlistId);
                setPlaylists((currentPlaylists) => currentPlaylists.filter((playlist) => playlist.id !== playlistId));
                await refreshStatistics();
                return true;
            }

            setPlaylists((currentPlaylists) => currentPlaylists.filter((playlist) => playlist.id !== playlistId));
            setPendingOperations((currentQueue) =>
                enqueueOperation(currentQueue, {
                    type: "delete",
                    playlistId,
                    queuedAt: Date.now(),
                })
            );
            setSyncMessage("Delete saved locally. It will sync when the server is reachable.");
            return true;
        } catch (error) {
            if (isConnectivityError(error)) {
                setConnectionState(typeof navigator !== "undefined" && navigator.onLine ? "server-unreachable" : "offline");

                setPlaylists((currentPlaylists) => currentPlaylists.filter((playlist) => playlist.id !== playlistId));
                setPendingOperations((currentQueue) =>
                    enqueueOperation(currentQueue, {
                        type: "delete",
                        playlistId,
                        queuedAt: Date.now(),
                    })
                );
                setSyncMessage("Delete saved locally. It will sync when the server is reachable.");
                return true;
            }

            setActionError(error.message || "Could not delete playlist.");
            return false;
        }
    };

    const handleAddPlaylist = (playlist) => {
        const builtPlaylist = buildPlaylist(playlist);

        const updatedProfile = trackPlaylistAction("add", builtPlaylist);
        setActivityProfile(updatedProfile);

        setPlaylists((currentPlaylists) => [...currentPlaylists, builtPlaylist]);
        setRecommendedPlaylists((currentRecommendations) =>
            currentRecommendations.filter((playlistItem) => playlistItem.id !== playlist.id)
        );
    };

    const handleCreatePlaylist = async (playlistData) => {
        clearActionError();
        setSyncMessage("");

        try {
            if (connectionState === "online") {
                const createdPlaylist = await createPlaylistApi(playlistData);
                setPlaylists((currentPlaylists) => [...currentPlaylists, createdPlaylist]);
                await refreshStatistics();
                return createdPlaylist.id;
            }
        } catch (error) {
            if (!isConnectivityError(error)) {
                throw error;
            }

            setConnectionState(typeof navigator !== "undefined" && navigator.onLine ? "server-unreachable" : "offline");
        }

        const tempId = createTempPlaylistId();
        const offlinePlaylist = buildOfflinePlaylist(tempId, playlistData);

        setPlaylists((currentPlaylists) => [...currentPlaylists, offlinePlaylist]);
        setPendingOperations((currentQueue) =>
            enqueueOperation(currentQueue, {
                type: "create",
                playlistId: tempId,
                payload: playlistData,
                queuedAt: Date.now(),
            })
        );
        setSyncMessage("Playlist saved locally. It will sync when the server is reachable.");

        return tempId;
    };

    const handleUpdatePlaylist = async (playlistId, updatedData) => {
        clearActionError();
        setSyncMessage("");

        try {
            if (connectionState === "online") {
                const updatedPlaylist = await updatePlaylistApi(playlistId, updatedData);

                setPlaylists((currentPlaylists) =>
                    currentPlaylists.map((playlist) =>
                        playlist.id === playlistId ? updatedPlaylist : playlist
                    )
                );
                await refreshStatistics();
                return updatedPlaylist;
            }
        } catch (error) {
            if (!isConnectivityError(error)) {
                throw error;
            }

            setConnectionState(typeof navigator !== "undefined" && navigator.onLine ? "server-unreachable" : "offline");
        }

        const existingPlaylist = playlistsRef.current.find((playlist) => playlist.id === playlistId);
        const offlinePlaylist = buildOfflinePlaylist(playlistId, updatedData, existingPlaylist);

        setPlaylists((currentPlaylists) =>
            currentPlaylists.map((playlist) =>
                playlist.id === playlistId ? offlinePlaylist : playlist
            )
        );
        setPendingOperations((currentQueue) =>
            enqueueOperation(currentQueue, {
                type: "update",
                playlistId,
                payload: updatedData,
                queuedAt: Date.now(),
            })
        );
        setSyncMessage("Playlist changes saved locally. They will sync when the server is reachable.");

        return offlinePlaylist;
    };

    const handleRestorePlaylistSnapshot = async (playlistId, historyEntryId) => {
        clearActionError();
        setSyncMessage("");

        if (connectionState !== "online") {
            throw new Error("Snapshot restore requires a working connection to the server.");
        }

        const restoredPlaylist = await restorePlaylistSnapshotApi(playlistId, historyEntryId);

        setPlaylists((currentPlaylists) =>
            currentPlaylists.map((playlist) =>
                playlist.id === playlistId ? restoredPlaylist : playlist
            )
        );
        await refreshStatistics();

        return restoredPlaylist;
    };

    const handleStartGenerator = async (batchSize, intervalSeconds) => {
        clearActionError();

        if (connectionState !== "online") {
            throw new Error("Generator controls require a working connection to the server.");
        }

        const status = await startGeneratorApi(batchSize, intervalSeconds);
        setGeneratorStatus(status);
    };

    const handleStopGenerator = async () => {
        clearActionError();

        if (connectionState !== "online") {
            throw new Error("Generator controls require a working connection to the server.");
        }

        const status = await stopGeneratorApi();
        setGeneratorStatus(status);
    };

    const personalizedRecommendedPlaylists = useMemo(() => {
        return personalizeRecommendedPlaylists(recommendedPlaylists, activityProfile);
    }, [recommendedPlaylists, activityProfile]);

    const topPreferences = useMemo(() => {
        return getTopPreferences(activityProfile);
    }, [activityProfile]);

    const connectionBanner = useMemo(() => {
        if (!isAuthenticated) {
            return null;
        }

        if (connectionState === "offline") {
            return {
                background: "#fff1c7",
                color: "#6c5200",
                border: "1px solid #edd27b",
                text: "Offline mode. CRUD changes are stored locally on this device.",
            };
        }

        if (connectionState === "server-unreachable") {
            return {
                background: "#ffe5e5",
                color: "#7a1414",
                border: "1px solid #f2b3b3",
                text: "Server unreachable. Local changes will be synchronized when the connection returns.",
            };
        }

        if (connectionState === "syncing") {
            return {
                background: "#e7f3ff",
                color: "#114c8d",
                border: "1px solid #b8d6f5",
                text: "Synchronizing offline changes with the server...",
            };
        }

        if (pendingOperations.length > 0) {
            return {
                background: "#e7f3ff",
                color: "#114c8d",
                border: "1px solid #b8d6f5",
                text: `${pendingOperations.length} local change(s) waiting to sync.`,
            };
        }

        if (syncMessage) {
            return {
                background: "#e6f8ec",
                color: "#165a2f",
                border: "1px solid #b9e2c9",
                text: syncMessage,
            };
        }

        return null;
    }, [connectionState, isAuthenticated, pendingOperations.length, syncMessage]);

    if (isAuthenticated && isLoading) {
        return <div style={{ padding: "2rem" }}>Loading playlists...</div>;
    }

    if (isAuthenticated && loadError) {
        return <div style={{ padding: "2rem" }}>Backend error: {loadError}</div>;
    }

    return (
        <>
            {connectionBanner && (
                <div
                    style={{
                        margin: "1rem",
                        padding: "0.9rem 1rem",
                        borderRadius: "12px",
                        background: connectionBanner.background,
                        color: connectionBanner.color,
                        border: connectionBanner.border,
                    }}
                >
                    {connectionBanner.text}
                </div>
            )}

            {actionError && isAuthenticated && (
                <div
                    style={{
                        margin: "1rem",
                        padding: "0.9rem 1rem",
                        borderRadius: "12px",
                        background: "#ffe5e5",
                        color: "#7a1414",
                        border: "1px solid #f2b3b3",
                    }}
                >
                    {actionError}
                </div>
            )}

            <Routes>
                <Route path="/" element={<Navigate to={isAuthenticated ? "/home" : "/login"} />} />
                <Route path="/login" element={isAuthenticated ? <Navigate to="/home" replace /> : <LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/auth-code" element={<AuthCodePage />} />
                <Route path="/about" element={<About />} />

                <Route
                    path="/home"
                    element={
                        <ProtectedRoute authenticated={isAuthenticated}>
                            <Home playlists={playlists} onDeletePlaylist={handleDeletePlaylist} />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/playlists"
                    element={
                        <ProtectedRoute authenticated={isAuthenticated}>
                            <PlaylistGridPage onDeletePlaylist={handleDeletePlaylist} />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/playlists/new"
                    element={
                        <ProtectedRoute authenticated={isAuthenticated}>
                            <CreatePlaylistPage onCreatePlaylist={handleCreatePlaylist} />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/playlists/:playlistId/edit"
                    element={
                        <ProtectedRoute authenticated={isAuthenticated}>
                            <EditPlaylistPage playlists={playlists} onUpdatePlaylist={handleUpdatePlaylist} />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/playlists/:playlistId/history"
                    element={
                        <ProtectedRoute authenticated={isAuthenticated}>
                            <PlaylistHistoryPage playlists={playlists} onRestorePlaylistSnapshot={handleRestorePlaylistSnapshot} />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/recommended"
                    element={
                        <ProtectedRoute authenticated={isAuthenticated}>
                            <RecommendedPage playlists={personalizedRecommendedPlaylists} onAddPlaylist={handleAddPlaylist} topPreferences={topPreferences} />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/stats"
                    element={
                        <ProtectedRoute authenticated={isAuthenticated}>
                            <StatsPage
                                playlists={playlists}
                                statistics={statistics}
                                onDeletePlaylist={handleDeletePlaylist}
                                generatorStatus={generatorStatus}
                                liveConnected={liveConnected}
                                onStartGenerator={handleStartGenerator}
                                onStopGenerator={handleStopGenerator}
                            />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/chat"
                    element={
                        <ProtectedRoute authenticated={isAuthenticated}>
                            <ChatPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin"
                    element={
                        <AdminRoute authenticated={isAuthenticated} allowed={canViewAdmin}>
                            <AdminDashboardPage />
                        </AdminRoute>
                    }
                />
            </Routes>
        </>
    );
}

export default App;
