import { Client } from "@stomp/stompjs";
import { getWsBaseUrl } from "../api/httpApi";

const WS_URL = `${getWsBaseUrl()}/ws`;

export function connectToChatRoom({ room, onMessage, onConnectionChange }) {
    const client = new Client({
        brokerURL: WS_URL,
        reconnectDelay: 3000,
        onConnect: () => {
            onConnectionChange?.(true);

            client.subscribe(`/topic/chat.${room}`, (message) => {
                try {
                    onMessage?.(JSON.parse(message.body));
                } catch (error) {
                    console.error("Invalid chat payload.", error);
                }
            });
        },
        onStompError: () => onConnectionChange?.(false),
        onWebSocketClose: () => onConnectionChange?.(false),
    });

    client.activate();

    return {
        send(payload) {
            if (!client.connected) {
                throw new Error("Chat connection is not ready yet.");
            }

            client.publish({
                destination: "/app/chat.send",
                body: JSON.stringify(payload),
            });
        },
        disconnect() {
            void client.deactivate();
        },
    };
}
