package com.mpp.backend.controller;

import com.mpp.backend.dto.ChatMessageRequest;
import com.mpp.backend.dto.ChatMessageResponse;
import com.mpp.backend.service.ChatService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(ChatService chatService, SimpMessagingTemplate messagingTemplate) {
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    @GetMapping("/messages")
    public List<ChatMessageResponse> recentMessages(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "global") String room
    ) {
        return chatService.recent(userId, room);
    }

    @MessageMapping("/chat.send")
    public void send(ChatMessageRequest request) {
        ChatMessageResponse saved = chatService.save(request);
        messagingTemplate.convertAndSend("/topic/chat." + saved.room(), saved);
    }
}
