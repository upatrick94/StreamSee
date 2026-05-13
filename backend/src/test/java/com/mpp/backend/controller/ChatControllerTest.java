package com.mpp.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mpp.backend.dto.ChatMessageRequest;
import com.mpp.backend.dto.ChatMessageResponse;
import com.mpp.backend.service.ChatService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = ChatController.class)
@Import(com.mpp.backend.error.RestExceptionHandler.class)
class ChatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ChatService chatService;

    @MockBean
    private SimpMessagingTemplate messagingTemplate;

    @Test
    void shouldReturnRecentMessages() throws Exception {
        given(chatService.recent(2L, "global")).willReturn(List.of(
                new ChatMessageResponse("abc", "global", 2L, "user", "hello", Instant.parse("2026-05-04T10:00:00Z"))
        ));

        mockMvc.perform(get("/api/chat/messages")
                        .header("X-User-Id", "2")
                        .param("room", "global"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].content").value("hello"));
    }

    @Test
    void shouldPublishSavedMessageToTopic() {
        ChatMessageRequest request = new ChatMessageRequest(2L, "global", "hello");
        ChatMessageResponse response = new ChatMessageResponse("abc", "global", 2L, "user", "hello", Instant.parse("2026-05-04T10:00:00Z"));

        given(chatService.save(request)).willReturn(response);

        ChatController controller = new ChatController(chatService, messagingTemplate);
        controller.send(request);

        then(messagingTemplate).should().convertAndSend(eq("/topic/chat.global"), eq(response));
    }
}
