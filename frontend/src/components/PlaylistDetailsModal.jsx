import { useNavigate } from "react-router-dom";

function PlaylistDetailsModal({ playlist, onClose, onDelete }) {
    const navigate = useNavigate();

    const handleEditClick = () => {
        onClose();
        navigate(`/playlists/${playlist.id}/edit`);
    };

    const handleHistoryClick = () => {
        onClose();
        navigate(`/playlists/${playlist.id}/history`);
    };

    return (
        <div className="playlist-modal-overlay" onClick={onClose}>
            <div
                className="playlist-modal"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="playlist-modal-left">
                    <img
                        src={playlist.cover}
                        alt={playlist.name}
                        className="playlist-modal-cover"
                    />

                    <h3 className="playlist-modal-title">{playlist.name}</h3>

                    <p className="playlist-modal-meta">Created by {playlist.creator}</p>
                    <p className="playlist-modal-meta">
                        {playlist.songs.length} songs • {playlist.duration}
                    </p>
                </div>

                <div className="playlist-modal-right">
                    <div className="playlist-modal-section">
                        <h4>Description</h4>
                        <p>{playlist.description}</p>
                    </div>

                    <div className="playlist-modal-section">
                        <h4>Genres</h4>
                        <p>{playlist.genres.join(", ")}</p>
                    </div>

                    <div className="playlist-modal-section">
                        <h4>Top Songs</h4>
                        <ol className="playlist-modal-songs-list">
                            {playlist.topSongs.map((song, index) => (
                                <li key={index}>{song}</li>
                            ))}
                        </ol>
                    </div>

                    <div className="playlist-modal-dates">
                        <p><strong>Created:</strong> {playlist.createdAt}</p>
                        <p><strong>Updated:</strong> {playlist.updatedAt}</p>
                    </div>

                    <div className="playlist-modal-actions">
                        <button type="button" className="modal-action-button" onClick={onDelete}>
                            Delete playlist
                        </button>

                        <button type="button" className="modal-action-button" disabled>
                            Add playlist
                        </button>

                        <button
                            type="button"
                            className="modal-action-button"
                            onClick={handleEditClick}
                        >
                            Edit playlist
                        </button>

                        <button
                            type="button"
                            className="modal-action-button"
                            onClick={handleHistoryClick}
                        >
                            History
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PlaylistDetailsModal;