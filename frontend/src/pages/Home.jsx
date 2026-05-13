import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import TurntableHero from "../components/TurntableHero";
import PickupToggle from "../components/PickupToggle";
import PlaylistSection from "../components/PlaylistSection";
import PlaylistDetailsModal from "../components/PlaylistDetailsModal";
import "../styles/home.css";

function Home({ playlists, onDeletePlaylist }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);

    const playlistsPerPage = 2;
    const totalPages = Math.max(1, Math.ceil(playlists.length / playlistsPerPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const visiblePlaylists = useMemo(() => {
        const startIndex = (safeCurrentPage - 1) * playlistsPerPage;
        const endIndex = startIndex + playlistsPerPage;
        return playlists.slice(startIndex, endIndex);
    }, [playlists, safeCurrentPage]);

    const selectedPlaylist =
        playlists.find((playlist) => playlist.id === selectedPlaylistId) || null;

    const handleToggle = () => {
        setIsExpanded((prev) => !prev);
    };

    const handleDeleteAndCloseIfNeeded = (playlistId) => {
        onDeletePlaylist(playlistId);

        if (selectedPlaylistId === playlistId) {
            setSelectedPlaylistId(null);
        }

        const newPlaylistCount = playlists.length - 1;
        const newTotalPages = Math.max(1, Math.ceil(newPlaylistCount / playlistsPerPage));

        if (safeCurrentPage > newTotalPages) {
            setCurrentPage(newTotalPages);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleViewPlaylist = (playlist) => {
        setSelectedPlaylistId(playlist.id);
    };

    const handleCloseModal = () => {
        setSelectedPlaylistId(null);
    };

    return (
        <div className="home-page page-fade">
            <Navbar activePage="home" />

            <TurntableHero />

            <PickupToggle
                isExpanded={isExpanded}
                onToggle={handleToggle}
            />

            <div className={`playlist-section-shell ${isExpanded ? "expanded" : "collapsed"}`}>
                <PlaylistSection
                    playlists={visiblePlaylists}
                    currentPage={safeCurrentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    onDeletePlaylist={handleDeleteAndCloseIfNeeded}
                    onViewPlaylist={handleViewPlaylist}
                />
            </div>

            {selectedPlaylist && (
                <PlaylistDetailsModal
                    playlist={selectedPlaylist}
                    onClose={handleCloseModal}
                    onDelete={() => handleDeleteAndCloseIfNeeded(selectedPlaylist.id)}
                />
            )}
        </div>
    );
}

export default Home;