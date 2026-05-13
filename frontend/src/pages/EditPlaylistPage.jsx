import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/playlistForm.css";
import {
    fetchPlaylistByIdApi,
} from "../api/playlistsApi";
import {
    formatPlaylistDuration,
    formatSongDuration,
    normalizeSongs,
    parseSongDuration,
    validatePlaylistForm,
} from "../utils/playlistHelpers";

function buildStatsFromSongs(songs) {
    const normalizedSongs = normalizeSongs(songs);
    const totalDurationSeconds = normalizedSongs.reduce(
        (sum, song) => sum + (song.durationSeconds || parseSongDuration(song.duration)),
        0
    );

    const uniqueArtists = new Set(
        normalizedSongs.map((song) => song.artist.trim().toLowerCase())
    ).size;

    const longestSong = normalizedSongs.reduce((longest, song) => {
        if (!longest || song.durationSeconds > longest.durationSeconds) {
            return song;
        }

        return longest;
    }, null);

    return {
        totalSongs: normalizedSongs.length,
        totalDuration: formatPlaylistDuration(totalDurationSeconds),
        uniqueArtists,
        longestSong,
    };
}

function EditPlaylistPage({ playlists, onUpdatePlaylist }) {
    const { playlistId } = useParams();
    const navigate = useNavigate();

    const playlistFromProps = useMemo(
        () => playlists.find((item) => item.id === Number(playlistId)),
        [playlists, playlistId]
    );

    const [playlist, setPlaylist] = useState(playlistFromProps || null);
    const [name, setName] = useState("");
    const [creator, setCreator] = useState("");
    const [cover, setCover] = useState("");
    const [description, setDescription] = useState("");
    const [genresText, setGenresText] = useState("");
    const [songs, setSongs] = useState([]);
    const [errors, setErrors] = useState({});
    const [songErrors, setSongErrors] = useState({});
    const [submitError, setSubmitError] = useState("");
    const [loadError, setLoadError] = useState("");
    const [isLoading, setIsLoading] = useState(!playlistFromProps);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        function hydrateForm(playlistData) {
            setPlaylist(playlistData);
            setName(playlistData.name || "");
            setCreator(playlistData.creator || "");
            setCover(playlistData.cover || "");
            setDescription(playlistData.description || "");
            setGenresText((playlistData.genres || []).join(", "));
            setSongs(
                (playlistData.songs || []).map((song) => ({
                    id: song.id,
                    title: song.title,
                    artist: song.artist,
                    duration: formatSongDuration(song.durationSeconds),
                }))
            );
        }

        let cancelled = false;

        async function loadPlaylist() {
            try {
                setIsLoading(true);
                setLoadError("");

                const freshPlaylist = await fetchPlaylistByIdApi(Number(playlistId));

                if (!cancelled) {
                    hydrateForm(freshPlaylist);
                }
            } catch (error) {
                if (!cancelled) {
                    setLoadError(error.message || "Could not load playlist.");
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        if (playlistFromProps) {
            hydrateForm(playlistFromProps);
        }

        void loadPlaylist();

        return () => {
            cancelled = true;
        };
    }, [playlistFromProps, playlistId]);

    const liveSongStats = useMemo(() => buildStatsFromSongs(songs), [songs]);

    const handleSongChange = (songId, field, value) => {
        setSongs((prev) =>
            prev.map((song) => (song.id === songId ? { ...song, [field]: value } : song))
        );

        setSongErrors((prev) => {
            if (!prev[songId]) {
                return prev;
            }

            return {
                ...prev,
                [songId]: {
                    ...prev[songId],
                    [field]: "",
                },
            };
        });
    };

    const handleAddSongRow = () => {
        setSongs((prev) => [
            ...prev,
            {
                id: Date.now(),
                title: "",
                artist: "",
                duration: "",
            },
        ]);
    };

    const handleRemoveSongRow = (songId) => {
        setSongs((prev) => prev.filter((song) => song.id !== songId));
        setSongErrors((prev) => {
            const updated = { ...prev };
            delete updated[songId];
            return updated;
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const validation = validatePlaylistForm({
            name,
            creator,
            cover,
            description,
            genresText,
            songs,
        });

        setErrors(validation.errors);
        setSongErrors(validation.songErrors);
        setSubmitError("");

        if (!validation.isValid || !playlist) {
            return;
        }

        try {
            setIsSubmitting(true);

            const updatedPlaylist = await onUpdatePlaylist(playlist.id, {
                name: name.trim(),
                creator: creator.trim(),
                cover: cover.trim(),
                description: description.trim(),
                genres: genresText
                    .split(",")
                    .map((genre) => genre.trim())
                    .filter(Boolean),
                songs,
            });

            setPlaylist(updatedPlaylist);
            navigate(`/playlists/${playlist.id}/history`);
        } catch (error) {
            setSubmitError(error.message || "Could not update playlist.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="playlist-form-page page-fade">
                <Navbar activePage="home" />
                <section className="playlist-form-wrapper">
                    <p>Loading playlist...</p>
                </section>
            </div>
        );
    }

    if (loadError || !playlist) {
        return (
            <div className="playlist-form-page page-fade">
                <Navbar activePage="home" />

                <section className="playlist-form-wrapper">
                    <div className="playlist-form-header">
                        <h1>Playlist not found</h1>
                        <p>{loadError || "The playlist you are trying to edit does not exist."}</p>
                    </div>

                    <div className="playlist-form-actions">
                        <button
                            type="button"
                            className="playlist-form-primary-button"
                            onClick={() => navigate("/home")}
                        >
                            Back to home
                        </button>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="playlist-form-page page-fade">
            <Navbar activePage="home" />

            <section className="playlist-form-wrapper">
                <div className="playlist-form-header">
                    <h1>Edit Playlist</h1>
                    <p>
                        This now supports full nested song CRUD inside the playlist update:
                        add songs, edit songs, and remove songs without breaking existing song ids.
                    </p>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "0.9rem",
                        marginBottom: "1.5rem",
                    }}
                >
                    <div className="playlist-form-field">
                        <label>Song count</label>
                        <div>{liveSongStats.totalSongs}</div>
                    </div>

                    <div className="playlist-form-field">
                        <label>Total duration</label>
                        <div>{liveSongStats.totalDuration}</div>
                    </div>

                    <div className="playlist-form-field">
                        <label>Unique artists</label>
                        <div>{liveSongStats.uniqueArtists}</div>
                    </div>

                    <div className="playlist-form-field">
                        <label>Longest song</label>
                        <div>
                            {liveSongStats.longestSong
                                ? `${liveSongStats.longestSong.title} (${formatSongDuration(liveSongStats.longestSong.durationSeconds)})`
                                : "No songs yet"}
                        </div>
                    </div>
                </div>

                <form className="playlist-form" onSubmit={handleSubmit} noValidate>
                    <div className="playlist-form-grid">
                        <div className="playlist-form-field">
                            <label htmlFor="playlist-name">Playlist name</label>
                            <input
                                id="playlist-name"
                                type="text"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                            />
                            {errors.name && <p className="playlist-form-error">{errors.name}</p>}
                        </div>

                        <div className="playlist-form-field">
                            <label htmlFor="playlist-creator">Created by</label>
                            <input
                                id="playlist-creator"
                                type="text"
                                value={creator}
                                onChange={(event) => setCreator(event.target.value)}
                            />
                            {errors.creator && <p className="playlist-form-error">{errors.creator}</p>}
                        </div>
                    </div>

                    <div className="playlist-form-field">
                        <label htmlFor="playlist-cover">Cover image URL</label>
                        <input
                            id="playlist-cover"
                            type="url"
                            value={cover}
                            onChange={(event) => setCover(event.target.value)}
                            placeholder="https://example.com/cover.jpg"
                        />
                        {errors.cover && <p className="playlist-form-error">{errors.cover}</p>}
                    </div>

                    <div className="playlist-form-field">
                        <label htmlFor="playlist-description">Description</label>
                        <textarea
                            id="playlist-description"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            rows="4"
                        />
                        {errors.description && (
                            <p className="playlist-form-error">{errors.description}</p>
                        )}
                    </div>

                    <div className="playlist-form-field">
                        <label htmlFor="playlist-genres">Genres (comma separated)</label>
                        <input
                            id="playlist-genres"
                            type="text"
                            value={genresText}
                            onChange={(event) => setGenresText(event.target.value)}
                        />
                        {errors.genres && <p className="playlist-form-error">{errors.genres}</p>}
                    </div>

                    <div className="playlist-songs-editor">
                        <div className="playlist-songs-editor-header">
                            <h2>Songs</h2>
                            <button
                                type="button"
                                className="playlist-form-secondary-button"
                                onClick={handleAddSongRow}
                            >
                                Add song row
                            </button>
                        </div>

                        {errors.songs && <p className="playlist-form-error">{errors.songs}</p>}

                        {songs.length === 0 ? (
                            <p className="playlist-empty-text">This playlist has no songs yet.</p>
                        ) : (
                            songs.map((song) => (
                                <div key={song.id} className="playlist-song-row">
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Song title"
                                            value={song.title}
                                            onChange={(event) =>
                                                handleSongChange(song.id, "title", event.target.value)
                                            }
                                        />
                                        {songErrors[song.id]?.title && (
                                            <p className="playlist-form-error">
                                                {songErrors[song.id].title}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Artist"
                                            value={song.artist}
                                            onChange={(event) =>
                                                handleSongChange(song.id, "artist", event.target.value)
                                            }
                                        />
                                        {songErrors[song.id]?.artist && (
                                            <p className="playlist-form-error">
                                                {songErrors[song.id].artist}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Duration (mm:ss)"
                                            value={song.duration}
                                            onChange={(event) =>
                                                handleSongChange(song.id, "duration", event.target.value)
                                            }
                                        />
                                        {songErrors[song.id]?.duration && (
                                            <p className="playlist-form-error">
                                                {songErrors[song.id].duration}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        className="playlist-form-remove-button"
                                        onClick={() => handleRemoveSongRow(song.id)}
                                    >
                                        Delete song
                                    </button>
                                </div>
                            ))
                        )}

                        {submitError && <p className="playlist-form-error">{submitError}</p>}
                    </div>

                    <div className="playlist-form-actions">
                        <button
                            type="button"
                            className="playlist-form-secondary-button"
                            onClick={() => navigate("/playlists")}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="playlist-form-primary-button"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Saving..." : "Save changes"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}

export default EditPlaylistPage;
