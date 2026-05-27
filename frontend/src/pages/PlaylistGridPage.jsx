import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import ExpandedPlaylistCard from "../components/ExpandedPlaylistCard";
import { fetchPlaylists, prefetchPlaylistsPage } from "../api/playlistsApi";
import "../styles/playlistGrid.css";

const PAGE_SIZE = 12;

function mergeUniquePlaylists(currentPlaylists, nextPlaylists) {
    const byId = new Map(currentPlaylists.map((playlist) => [playlist.id, playlist]));

    for (const playlist of nextPlaylists) {
        byId.set(playlist.id, playlist);
    }

    return Array.from(byId.values());
}

function PlaylistGridPage({ onDeletePlaylist }) {
    const [playlists, setPlaylists] = useState([]);
    const [currentPage, setCurrentPage] = useState(-1);
    const [totalPages, setTotalPages] = useState(0);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const sentinelRef = useRef(null);

    const hasMore = useMemo(() => {
        return currentPage + 1 < totalPages;
    }, [currentPage, totalPages]);

    const loadPage = useCallback(async (pageToLoad) => {
        if (pageToLoad < 0) {
            return;
        }

        const setLoadingState = pageToLoad === 0 ? setIsInitialLoading : setIsLoadingMore;
        setLoadingState(true);

        try {
            setErrorMessage("");
            const pageData = await fetchPlaylists(pageToLoad, PAGE_SIZE);

            setPlaylists((currentItems) =>
                pageToLoad === 0
                    ? pageData.content
                    : mergeUniquePlaylists(currentItems, pageData.content)
            );
            setCurrentPage(pageData.page);
            setTotalPages(pageData.totalPages);

            if (pageData.page + 1 < pageData.totalPages) {
                void prefetchPlaylistsPage(pageData.page + 1, PAGE_SIZE);
            }
        } catch (error) {
            setErrorMessage(error.message || "Could not load playlists.");
        } finally {
            setLoadingState(false);
        }
    }, []);

    useEffect(() => {
        void loadPage(0);
    }, [loadPage]);

    useEffect(() => {
        const node = sentinelRef.current;

        if (!node || !hasMore || isInitialLoading || isLoadingMore) {
            return undefined;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];

                if (entry?.isIntersecting) {
                    void loadPage(currentPage + 1);
                }
            },
            {
                rootMargin: "300px 0px",
                threshold: 0.1,
            }
        );

        observer.observe(node);

        return () => {
            observer.disconnect();
        };
    }, [currentPage, hasMore, isInitialLoading, isLoadingMore, loadPage]);

    const handleDelete = async (playlistId) => {
        const deleted = await onDeletePlaylist(playlistId);

        if (deleted) {
            setPlaylists((currentItems) => currentItems.filter((playlist) => playlist.id !== playlistId));
        }
    };

    return (
        <div className="playlist-grid-page page-fade">
            <Navbar activePage="playlists" />

            <section className="playlist-grid-section">
                <div className="playlist-grid-header">
                    <h1>Extended View</h1>
                </div>

                {errorMessage && <p className="playlist-form-error">{errorMessage}</p>}

                {isInitialLoading ? (
                    <p>Loading playlists...</p>
                ) : (
                    <>
                        <div className="expanded-playlist-list">
                            {playlists.map((playlist) => (
                                <ExpandedPlaylistCard
                                    key={playlist.id}
                                    playlist={playlist}
                                    onDelete={() => void handleDelete(playlist.id)}
                                />
                            ))}
                        </div>

                        {hasMore && <div ref={sentinelRef} style={{ height: "1px" }} />}

                        {isLoadingMore && <p style={{ marginTop: "1rem" }}>Loading more playlists...</p>}

                        {!hasMore && playlists.length > 0 && (
                            <p style={{ marginTop: "1rem", opacity: 0.75 }}>
                                You reached the end of the playlist list.
                            </p>
                        )}
                    </>
                )}
            </section>
        </div>
    );
}

export default PlaylistGridPage;
