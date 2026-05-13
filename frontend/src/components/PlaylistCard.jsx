import vinyl from "../assets/vinyl.svg";
import play from "../assets/PlayButton.svg";
import view from "../assets/ViewButton.svg";
import del from "../assets/DeleteButton.svg";

function PlaylistCard({ playlist, onDelete, onView }) {
    return (
        <div className="playlist-card">
            <div className="playlist-cover-area">
                <img src={playlist.cover} alt={playlist.name} className="playlist-cover" />
                <img src={vinyl} alt="" className="playlist-vinyl" />
            </div>

            <div className="playlist-name">{playlist.name}</div>
            <div className="playlist-songs">{playlist.songs.length}</div>
            <div className="playlist-creator">{playlist.creator}</div>

            <div className="playlist-actions">
                <button type="button" className="action-button" aria-label="Play playlist">
                    <img src={play} alt="" />
                </button>

                <button
                    type="button"
                    className="action-button"
                    aria-label="View playlist"
                    onClick={onView}
                >
                    <img src={view} alt="" />
                </button>

                <button
                    type="button"
                    className="action-button"
                    aria-label="Delete playlist"
                    onClick={onDelete}
                >
                    <img src={del} alt="" />
                </button>
            </div>
        </div>
    );
}

export default PlaylistCard;