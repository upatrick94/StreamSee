import { useNavigate } from "react-router-dom";
import { hasPermission, readAuthSession } from "../api/authApi";

function ExpandedPlaylistCard({
                                  playlist,
                                  onDelete,
                                  isRecommended = false,
                                  onAdd,
                              }) {
    const navigate = useNavigate();
    const session = readAuthSession();
    const canDelete = hasPermission(session, "PLAYLIST_DELETE");

    const handleEditClick = () => {
        navigate(`/playlists/${playlist.id}/edit`);
    };

    const handleHistoryClick = () => {
        navigate(`/playlists/${playlist.id}/history`);
    };

    return (
        <article className="expanded-playlist-card">
            <div className="expanded-playlist-left">
                <img
                    src={playlist.cover}
                    alt={playlist.name}
                    className="expanded-playlist-cover"
                />

                <h2 className="expanded-playlist-title">{playlist.name}</h2>

                <p className="expanded-playlist-meta">Created by {playlist.creator}</p>
                <p className="expanded-playlist-meta">
                    {playlist.songs.length} songs • {playlist.duration}
                </p>
            </div>

            <div className="expanded-playlist-right">
                <div className="expanded-playlist-section">
                    <h3>Description</h3>
                    <p>{playlist.description}</p>
                </div>

                <div className="expanded-playlist-section">
                    <h3>Genres</h3>
                    <p>{playlist.genres.join(", ")}</p>
                </div>

                <div className="expanded-playlist-section">
                    <h3>Top Songs</h3>
                    <ol className="expanded-playlist-songs-list">
                        {playlist.topSongs.map((song, index) => (
                            <li key={index}>{song}</li>
                        ))}
                    </ol>
                </div>

                <div className="expanded-playlist-dates">
                    <p>Created: {playlist.createdAt}</p>
                    <p>Updated: {playlist.updatedAt}</p>
                </div>

                <div className="expanded-playlist-actions">
                    {isRecommended ? (
                        <button
                            type="button"
                            className="expanded-action-button"
                            onClick={onAdd}
                        >
                            Add playlist
                        </button>
                    ) : (
                        <>
                            {canDelete && (
                                <button
                                    type="button"
                                    className="expanded-action-button"
                                    onClick={onDelete}
                                >
                                    Delete playlist
                                </button>
                            )}

                            <button
                                type="button"
                                className="expanded-action-button"
                                onClick={handleEditClick}
                            >
                                Edit playlist
                            </button>

                            <button
                                type="button"
                                className="expanded-action-button"
                                onClick={handleHistoryClick}
                            >
                                History
                            </button>
                        </>
                    )}
                </div>
            </div>
        </article>
    );
}

export default ExpandedPlaylistCard;
