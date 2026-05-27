import Navbar from "../components/Navbar";
import ExpandedPlaylistCard from "../components/ExpandedPlaylistCard";
import "../styles/playlistGrid.css";

function RecommendedPage({ playlists, onAddPlaylist }) {
    return (
        <div className="playlist-grid-page page-fade">
            <Navbar activePage="recommended" />

            <section className="playlist-grid-section">
                <div className="playlist-grid-header">
                    <h1>Recommended playlists for you</h1>
                </div>

                <div className="expanded-playlist-list">
                    {playlists.map((playlist) => (
                        <ExpandedPlaylistCard
                            key={playlist.id}
                            playlist={playlist}
                            isRecommended={true}
                            onAdd={() => onAddPlaylist(playlist)}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}

export default RecommendedPage;