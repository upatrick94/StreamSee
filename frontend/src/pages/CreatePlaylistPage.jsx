import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/playlistForm.css";
import { validatePlaylistForm } from "../utils/playlistHelpers";

function CreatePlaylistPage({ onCreatePlaylist }) {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [creator, setCreator] = useState("");
    const [cover, setCover] = useState("");
    const [description, setDescription] = useState("");
    const [genresText, setGenresText] = useState("");
    const [songs, setSongs] = useState([
        { id: 1, title: "", artist: "", duration: "" },
        { id: 2, title: "", artist: "", duration: "" },
        { id: 3, title: "", artist: "", duration: "" },
    ]);
    const [errors, setErrors] = useState({});
    const [songErrors, setSongErrors] = useState({});
    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSongChange = (songId, field, value) => {
        setSongs((prev) =>
            prev.map((song) =>
                song.id === songId ? { ...song, [field]: value } : song
            )
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

        if (!validation.isValid) {
            return;
        }

        try {
            setIsSubmitting(true);

            const newPlaylistId = await onCreatePlaylist({
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

            navigate(`/playlists/${newPlaylistId}/edit`);
        } catch (error) {
            setSubmitError(error.message || "Could not create playlist.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="playlist-form-page page-fade">
            <Navbar activePage="home" />

            <section className="playlist-form-wrapper">
                <div className="playlist-form-header">
                    <h1>Create Playlist</h1>
                    <p>Build a new playlist and choose the songs that belong to it.</p>
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
                            placeholder="Pop, Dance, Electronic"
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

                        {songs.map((song) => (
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
                                        <p className="playlist-form-error">{songErrors[song.id].title}</p>
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
                                        <p className="playlist-form-error">{songErrors[song.id].artist}</p>
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
                                        <p className="playlist-form-error">{songErrors[song.id].duration}</p>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    className="playlist-form-remove-button"
                                    onClick={() => handleRemoveSongRow(song.id)}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}

                        {submitError && <p className="playlist-form-error">{submitError}</p>}
                    </div>

                    <div className="playlist-form-actions">
                        <button
                            type="button"
                            className="playlist-form-secondary-button"
                            onClick={() => navigate("/home")}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="playlist-form-primary-button"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Creating..." : "Create playlist"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}

export default CreatePlaylistPage;
