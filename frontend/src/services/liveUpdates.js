import { Client } from "@stomp/stompjs";
import { getWsBaseUrl } from "../api/httpApi";

const WS_URL = `${getWsBaseUrl()}/ws`;

export function connectToPlaylistUpdates({ onBatch, onConnectionChange }) {
    const client = new Client({
        brokerURL: WS_URL,
        reconnectDelay: 3000,
        onConnect: () => {
            onConnectionChange?.(true);

            client.subscribe("/topic/playlists-updated", (message) => {
                try {
                    onBatch?.(JSON.parse(message.body));
                } catch (error) {
                    console.error("Invalid websocket payload.", error);
                }
            });
        },
        onStompError: () => onConnectionChange?.(false),
        onWebSocketClose: () => onConnectionChange?.(false),
    });

    client.activate();

    return () => {
        void client.deactivate();
    };
}
