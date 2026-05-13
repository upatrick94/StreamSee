package com.mpp.backend.service;

import com.mpp.backend.dto.ChatMessageRequest;
import com.mpp.backend.dto.ChatMessageResponse;
import com.mpp.backend.dto.LoginRequest;
import com.mpp.backend.repository.chat.ChatMessageDocument;
import com.mpp.backend.repository.chat.ChatMessageRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;

@SpringBootTest
@ActiveProfiles("test")
class ChatServiceTest {

    @Autowired
    private ChatService chatService;

    @Autowired
    private AuthService authService;

    @MockBean
    private ChatMessageRepository chatMessageRepository;

    @Test
    void shouldPersistChatMessage() throws Exception {
        given(chatMessageRepository.save(any(ChatMessageDocument.class))).willAnswer(invocation -> {
            ChatMessageDocument document = invocation.getArgument(0);
            setId(document, "msg-1");
            return document;
        });

        given(chatMessageRepository.findTop50ByRoomOrderBySentAtAsc(eq("global"))).willReturn(List.of(
                savedDocument("msg-1", "global", 2L, "user", "hello from mongo")
        ));

        Long userId = authService.login(new LoginRequest("user", "user123"), "127.0.0.1").userId();

        ChatMessageResponse saved = chatService.save(new ChatMessageRequest(userId, "global", "hello from mongo"));

        assertThat(saved.room()).isEqualTo("global");
        assertThat(saved.username()).isEqualTo("user");
        assertThat(chatService.recent(userId, "global"))
                .extracting(ChatMessageResponse::content)
                .contains("hello from mongo");
    }

    private static ChatMessageDocument savedDocument(
            String id,
            String room,
            Long userId,
            String username,
            String content
    ) throws Exception {
        ChatMessageDocument document = new ChatMessageDocument(
                room,
                userId,
                username,
                content,
                Instant.parse("2026-05-05T10:00:00Z")
        );
        setId(document, id);
        return document;
    }

    private static void setId(ChatMessageDocument document, String id) throws Exception {
        Field idField = ChatMessageDocument.class.getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(document, id);
    }
}
