package com.mpp.backend.service;

import com.mpp.backend.dto.ChatMessageRequest;
import com.mpp.backend.dto.ChatMessageResponse;
import com.mpp.backend.repository.chat.ChatMessageDocument;
import com.mpp.backend.repository.chat.ChatMessageRepository;
import com.mpp.backend.repository.security.UserAccountEntity;
import org.springframework.stereotype.Service;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class ChatService {

    private final ChatMessageRepository chatRepository;
    private final AuthorizationService authorizationService;
    private final AuditLogService auditLogService;
    private final AtomicLong fallbackIdSequence = new AtomicLong(1);
    private final Map<String, CopyOnWriteArrayList<ChatMessageDocument>> fallbackMessagesByRoom = new ConcurrentHashMap<>();

    public ChatService(ChatMessageRepository chatRepository, AuthorizationService authorizationService, AuditLogService auditLogService) {
        this.chatRepository = chatRepository;
        this.authorizationService = authorizationService;
        this.auditLogService = auditLogService;
    }

    public ChatMessageResponse save(ChatMessageRequest request) {
        authorizationService.ensurePermission(request.authToken(), request.userId(), "CHAT_USE");
        UserAccountEntity user = authorizationService.requireUser(request.userId());

        ChatMessageDocument message = new ChatMessageDocument(
                request.room().trim(),
                user.getId(),
                user.getUsername(),
                request.content().trim(),
                Instant.now()
        );

        ChatMessageDocument saved = persist(message);
        auditLogService.logAuthenticatedAction(user.getId(), "SEND_CHAT_MESSAGE room=" + saved.getRoom());
        return map(saved);
    }

    public List<ChatMessageResponse> recent(String authToken, Long userId, String room) {
        authorizationService.ensurePermission(authToken, userId, "CHAT_USE");
        auditLogService.logAuthenticatedAction(userId, "READ_CHAT room=" + room);
        return loadRecent(room).stream().map(this::map).toList();
    }

    private ChatMessageDocument persist(ChatMessageDocument message) {
        try {
            return chatRepository.save(message);
        } catch (RuntimeException ignored) {
            return saveFallback(message);
        }
    }

    private List<ChatMessageDocument> loadRecent(String room) {
        try {
            return chatRepository.findTop50ByRoomOrderBySentAtAsc(room);
        } catch (RuntimeException ignored) {
            return readFallback(room);
        }
    }

    private ChatMessageDocument saveFallback(ChatMessageDocument message) {
        assignIdIfMissing(message, "local-" + fallbackIdSequence.getAndIncrement());
        fallbackMessagesByRoom
                .computeIfAbsent(message.getRoom(), ignored -> new CopyOnWriteArrayList<>())
                .add(message);
        return message;
    }

    private List<ChatMessageDocument> readFallback(String room) {
        return fallbackMessagesByRoom
                .getOrDefault(room, new CopyOnWriteArrayList<>())
                .stream()
                .sorted(Comparator.comparing(ChatMessageDocument::getSentAt))
                .limit(50)
                .toList();
    }

    private void assignIdIfMissing(ChatMessageDocument message, String id) {
        if (message.getId() != null && !message.getId().isBlank()) {
            return;
        }

        try {
            Field idField = ChatMessageDocument.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(message, id);
        } catch (ReflectiveOperationException exception) {
            throw new IllegalStateException("Could not assign fallback chat id.", exception);
        }
    }

    private ChatMessageResponse map(ChatMessageDocument document) {
        return new ChatMessageResponse(
                document.getId(),
                document.getRoom(),
                document.getUserId(),
                document.getUsername(),
                document.getContent(),
                document.getSentAt()
        );
    }
}