import { useNavigate } from "react-router-dom";
import PlaylistCard from "./PlaylistCard";
import Pagination from "./Pagination";

function PlaylistSection({
                             playlists,
                             currentPage,
                             totalPages,
                             onPageChange,
                             onDeletePlaylist,
                             onViewPlaylist,
                         }) {
    const navigate = useNavigate();

    return (
        <section className="playlist-section">
            <div className="playlist-header">
                <h2>Your Playlists</h2>

                <div className="playlist-header-buttons">
                    <button
                        className="view-stats"
                        type="button"
                        onClick={() => navigate("/stats")}
                    >
                        View Stats
                    </button>

                    <button
                        className="view-stats"
                        type="button"
                        onClick={() => navigate("/playlists")}
                    >
                        Expand View
                    </button>

                    <button
                        className="view-stats"
                        type="button"
                        onClick={() => navigate("/recommended")}
                    >
                        Add Playlists
                    </button>

                    <button
                        className="view-stats"
                        type="button"
                        onClick={() => navigate("/playlists/new")}
                    >
                        Create Playlist
                    </button>
                </div>
            </div>

            <div className="playlist-table-header">
                <span className="playlist-column-cover"></span>
                <span className="playlist-column-name">Name</span>
                <span className="playlist-column-songs">Songs</span>
                <span className="playlist-column-creator">Created by</span>
                <span className="playlist-column-actions"></span>
            </div>

            <div className="playlist-list">
                {playlists.map((playlist) => (
                    <PlaylistCard
                        key={playlist.id}
                        playlist={playlist}
                        onDelete={() => onDeletePlaylist(playlist.id)}
                        onView={() => onViewPlaylist(playlist)}
                    />
                ))}
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
            />
        </section>
    );
}

export default PlaylistSection;