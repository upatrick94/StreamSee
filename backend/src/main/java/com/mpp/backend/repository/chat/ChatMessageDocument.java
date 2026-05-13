package com.mpp.backend.repository.chat;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document("chat_messages")
public class ChatMessageDocument {
    @Id
    private String id;
    private String room;
    private Long userId;
    private String username;
    private String content;
    private Instant sentAt;

    public ChatMessageDocument(String room, Long userId, String username, String content, Instant sentAt) {
        this.room = room;
        this.userId = userId;
        this.username = username;
        this.content = content;
        this.sentAt = sentAt;
    }

    public String getId() { return id; }
    public String getRoom() { return room; }
    public Long getUserId() { return userId; }
    public String getUsername() { return username; }
    public String getContent() { return content; }
    public Instant getSentAt() { return sentAt; }
}
