package com.mpp.backend.repository.chat;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ChatMessageRepository extends MongoRepository<ChatMessageDocument, String> {
    List<ChatMessageDocument> findTop50ByRoomOrderBySentAtAsc(String room);
}
