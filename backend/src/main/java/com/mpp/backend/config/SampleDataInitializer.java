package com.mpp.backend.config;

import org.springframework.context.annotation.Profile;
import com.mpp.backend.model.Playlist;
import com.mpp.backend.model.Song;
import com.mpp.backend.service.PlaylistService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
@Profile("!test")
public class SampleDataInitializer implements ApplicationRunner {

    private final PlaylistService playlistService;

    public SampleDataInitializer(PlaylistService playlistService) {
        this.playlistService = playlistService;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (playlistService.getStatistics().totalPlaylists() > 0) {
            return;
        }

        playlistService.seedPlaylist(playlist(
                1L,
                "Late Night Drive",
                "Patrick",
                "https://i.pinimg.com/736x/4e/7a/23/4e7a239fef280d6cb60865c284308a91.jpg",
                "Music for late-night drives, quiet roads, and city lights.",
                List.of("Synthwave", "Chillwave", "Electronic"),
                List.of(
                        song(11L, "Nightcall", "Kavinsky", 257),
                        song(12L, "Midnight City", "M83", 244),
                        song(13L, "After Dark", "Mr. Kitty", 290)
                ),
                "2026-03-02T10:00:00Z",
                "2026-03-10T10:00:00Z"
        ));

        playlistService.seedPlaylist(playlist(
                2L,
                "Workout Music",
                "Andrei",
                "https://i.pinimg.com/736x/1c/ec/ce/1ceccef3eccc82a65f8ec44e25b539ff.jpg",
                "High-energy tracks for gym sessions, running, and training.",
                List.of("Hip-Hop", "EDM", "Pop"),
                List.of(
                        song(21L, "POWER", "Kanye West", 292),
                        song(22L, "Till I Collapse", "Eminem", 298),
                        song(23L, "Titanium", "David Guetta", 245)
                ),
                "2026-02-20T10:00:00Z",
                "2026-03-14T10:00:00Z"
        ));

        playlistService.seedPlaylist(playlist(
                3L,
                "Morning Focus",
                "Bianca",
                "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80",
                "Steady tracks for focused work, early study sessions, and a clean start to the day.",
                List.of("Indie", "Ambient", "Lo-fi"),
                List.of(
                        song(31L, "Awake", "Tycho", 282),
                        song(32L, "Intro", "The xx", 127),
                        song(33L, "A Walk", "Tycho", 301)
                ),
                "2026-01-08T09:00:00Z",
                "2026-03-01T08:00:00Z"
        ));

        playlistService.seedPlaylist(playlist(
                4L,
                "Sunday Jazz",
                "Mara",
                "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=900&q=80",
                "Warm jazz standards and soft modern arrangements for slow weekend afternoons.",
                List.of("Jazz", "Soul", "Instrumental"),
                List.of(
                        song(41L, "Blue in Green", "Miles Davis", 327),
                        song(42L, "Take Five", "Dave Brubeck", 324),
                        song(43L, "What You Won't Do for Love", "Bobby Caldwell", 287)
                ),
                "2026-01-18T11:30:00Z",
                "2026-02-27T13:45:00Z"
        ));

        playlistService.seedPlaylist(playlist(
                5L,
                "Rainy Evening",
                "Stefan",
                "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=80",
                "Quiet songs for rainy windows, dim lights, and relaxed evenings at home.",
                List.of("Acoustic", "Alternative", "Indie"),
                List.of(
                        song(51L, "Holocene", "Bon Iver", 336),
                        song(52L, "Cherry Wine", "Hozier", 241),
                        song(53L, "Skinny Love", "Birdy", 201)
                ),
                "2026-01-22T18:15:00Z",
                "2026-03-03T20:00:00Z"
        ));

        playlistService.seedPlaylist(playlist(
                6L,
                "City Pop Escape",
                "Radu",
                "https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?auto=format&fit=crop&w=900&q=80",
                "Bright city pop and disco grooves for summer nights and neon skylines.",
                List.of("City Pop", "Disco", "Funk"),
                List.of(
                        song(61L, "Plastic Love", "Mariya Takeuchi", 465),
                        song(62L, "Stay With Me", "Miki Matsubara", 296),
                        song(63L, "Last Summer Whisper", "Anri", 287)
                ),
                "2026-02-02T14:00:00Z",
                "2026-03-04T14:30:00Z"
        ));

        playlistService.seedPlaylist(playlist(
                7L,
                "Coding Session",
                "Teo",
                "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80",
                "Minimal distractions and steady momentum for long coding blocks and debugging sessions.",
                List.of("Electronic", "Lo-fi", "Ambient"),
                List.of(
                        song(71L, "Open Eye Signal", "Jon Hopkins", 449),
                        song(72L, "Emerald Rush", "Jon Hopkins", 304),
                        song(73L, "Night Owl", "Galimatias", 222)
                ),
                "2026-02-05T08:45:00Z",
                "2026-03-05T09:10:00Z"
        ));

        playlistService.seedPlaylist(playlist(
                8L,
                "Road Trip",
                "Ioana",
                "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
                "Big choruses, open roads, and songs that make long drives feel shorter.",
                List.of("Rock", "Pop", "Alternative"),
                List.of(
                        song(81L, "Go Your Own Way", "Fleetwood Mac", 223),
                        song(82L, "Mr. Brightside", "The Killers", 222),
                        song(83L, "Shut Up and Dance", "WALK THE MOON", 199)
                ),
                "2026-02-08T07:20:00Z",
                "2026-03-06T07:40:00Z"
        ));

        playlistService.seedPlaylist(playlist(
                9L,
                "Afterparty Lights",
                "Vlad",
                "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80",
                "Fast dance tracks and late-night energy for crowded rooms and bright lights.",
                List.of("House", "Dance", "EDM"),
                List.of(
                        song(91L, "One More Time", "Daft Punk", 320),
                        song(92L, "Intoxicated", "Martin Solveig", 256),
                        song(93L, "Where Are U Now", "Jack U", 250)
                ),
                "2026-02-11T23:00:00Z",
                "2026-03-07T23:30:00Z"
        ));

        playlistService.seedPlaylist(playlist(
                10L,
                "Golden Hour",
                "Ana",
                "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
                "Soft pop and mellow indie tracks for sunsets, walks, and warm evening colors.",
                List.of("Pop", "Indie", "Dream Pop"),
                List.of(
                        song(101L, "Golden Hour", "JVKE", 209),
                        song(102L, "Apocalypse", "Cigarettes After Sex", 290),
                        song(103L, "Sunsetz", "Cigarettes After Sex", 215)
                ),
                "2026-02-14T17:45:00Z",
                "2026-03-08T18:00:00Z"
        ));

        playlistService.seedPlaylist(playlist(
                11L,
                "Retro Arcade",
                "Darius",
                "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80",
                "Punchy retro synths and arcade-inspired beats for a playful, nostalgic mood.",
                List.of("Synthwave", "Retrowave", "Electronic"),
                List.of(
                        song(111L, "Turbo Killer", "Carpenter Brut", 230),
                        song(112L, "Days of Thunder", "The Midnight", 276),
                        song(113L, "Resonance", "HOME", 212)
                ),
                "2026-02-17T16:25:00Z",
                "2026-03-09T16:50:00Z"
        ));

        playlistService.seedPlaylist(playlist(
                12L,
                "Indie Hearts",
                "Elena",
                "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80",
                "Modern indie favorites with emotional hooks and memorable melodies.",
                List.of("Indie", "Alternative", "Pop"),
                List.of(
                        song(121L, "The Less I Know The Better", "Tame Impala", 216),
                        song(122L, "Somebody Else", "The 1975", 347),
                        song(123L, "Electric Feel", "MGMT", 230)
                ),
                "2026-02-21T12:10:00Z",
                "2026-03-10T12:35:00Z"
        ));

        playlistService.seedPlaylist(playlist(
                13L,
                "Night Runner",
                "Sonia",
                "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
                "Fast beats for evening runs, tunnel vision, and one more kilometer after dark.",
                List.of("Electronic", "House", "Workout"),
                List.of(
                        song(131L, "Strobe", "deadmau5", 634),
                        song(132L, "Pursuit", "Gesaffelstein", 260),
                        song(133L, "Genesis", "Justice", 233)
                ),
                "2026-02-24T19:10:00Z",
                "2026-03-11T19:35:00Z"
        ));
    }

    private Playlist playlist(
            long id,
            String name,
            String creator,
            String coverUrl,
            String description,
            List<String> genres,
            List<Song> songs,
            String createdAt,
            String updatedAt
    ) {
        return new Playlist(
                id,
                name,
                creator,
                coverUrl,
                description,
                genres,
                songs,
                Instant.parse(createdAt),
                Instant.parse(updatedAt)
        );
    }

    private Song song(long id, String title, String artist, int durationSeconds) {
        return new Song(id, title, artist, durationSeconds);
    }
}
