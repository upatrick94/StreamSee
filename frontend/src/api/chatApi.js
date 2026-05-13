import { apiFetch } from "./httpApi";

export function fetchChatMessagesApi(room = "global") {
    return apiFetch(`/api/chat/messages?room=${encodeURIComponent(room)}`);
}
