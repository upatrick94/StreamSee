import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { readAuthSession } from "../api/authApi";
import { fetchChatMessagesApi } from "../api/chatApi";
import { connectToChatRoom } from "../services/chatLiveUpdates";
import "../styles/chat.css";

const CHAT_CACHE_KEY = "mpp.chat.cache";

function formatTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function readChatCache() {
    try {
        return JSON.parse(window.localStorage.getItem(CHAT_CACHE_KEY) || "{}");
    } catch {
        return {};
    }
}

function writeChatCache(cache) {
    window.localStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(cache));
}

function getCachedMessages(room) {
    const cache = readChatCache();
    return cache[room] || [];
}

function isOptimisticMessage(message) {
    return typeof message.id === "string" && message.id.startsWith("local-");
}

function buildMessageKey(message) {
    if (message.id && !isOptimisticMessage(message)) {
        return `server:${message.id}`;
    }

    return [
        message.room ?? "",
        message.userId ?? "",
        message.username ?? "",
        message.content ?? "",
        message.sentAt ?? "",
    ].join("|");
}

function isSameMessageAsOptimistic(optimisticMessage, serverMessage) {
    if (!isOptimisticMessage(optimisticMessage)) {
        return false;
    }

    if (
        optimisticMessage.room !== serverMessage.room ||
        optimisticMessage.userId !== serverMessage.userId ||
        optimisticMessage.username !== serverMessage.username ||
        optimisticMessage.content !== serverMessage.content
    ) {
        return false;
    }

    const optimisticTime = new Date(optimisticMessage.sentAt).getTime();
    const serverTime = new Date(serverMessage.sentAt).getTime();

    return Math.abs(serverTime - optimisticTime) <= 15000;
}

function mergeMessages(currentMessages, incomingMessages) {
    const merged = [...currentMessages];

    for (const incoming of incomingMessages) {
        const optimisticIndex = merged.findIndex((message) =>
            isSameMessageAsOptimistic(message, incoming)
        );

        if (optimisticIndex >= 0) {
            merged[optimisticIndex] = incoming;
            continue;
        }

        const incomingKey = buildMessageKey(incoming);
        const alreadyExists = merged.some((message) => buildMessageKey(message) === incomingKey);

        if (!alreadyExists) {
            merged.push(incoming);
        }
    }

    return merged.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
}

function ChatPage() {
    const session = readAuthSession();
    const [room, setRoom] = useState("global");
    const [messages, setMessages] = useState(() => getCachedMessages("global"));
    const [content, setContent] = useState("");
    const [connected, setConnected] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const clientRef = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const cache = readChatCache();
        cache[room] = messages;
        writeChatCache(cache);
    }, [messages, room]);

    useEffect(() => {
        let cancelled = false;

        async function loadMessages() {
            try {
                setErrorMessage("");
                const data = await fetchChatMessagesApi(room);

                if (!cancelled) {
                    setMessages(data);
                }
            } catch (error) {
                if (!cancelled) {
                    setErrorMessage(error.message || "Could not load chat messages.");
                }
            }
        }

        loadMessages();

        clientRef.current?.disconnect();

        clientRef.current = connectToChatRoom({
            room,
            onConnectionChange: setConnected,
            onMessage: (message) => {
                setMessages((current) => mergeMessages(current, [message]));
            },
        });

        return () => {
            cancelled = true;
            clientRef.current?.disconnect();
        };
    }, [room]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleRoomChange = (event) => {
        const nextRoom = event.target.value;
        setRoom(nextRoom);
        setMessages(getCachedMessages(nextRoom));
        setErrorMessage("");
    };

    const handleSend = (event) => {
        event.preventDefault();

        const trimmed = content.trim();
        if (!trimmed || !session?.userId || !session?.token) {
            return;
        }

        const optimisticMessage = {
            id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            room,
            userId: session.userId,
            username: session.username,
            content: trimmed,
            sentAt: new Date().toISOString(),
        };

        setErrorMessage("");
        setMessages((current) => mergeMessages(current, [optimisticMessage]));
        setContent("");

        try {
            clientRef.current?.send({
                authToken: session.token,
                userId: session.userId,
                room,
                content: trimmed,
            });
        } catch (error) {
            setErrorMessage(error.message || "Could not send message.");
            setContent(trimmed);
        }
    };

    return (
        <div className="chat-page page-fade">
            <Navbar activePage="chat" />

            <section className="chat-shell">
                <div className="chat-header">
                    <div>
                        <h1>Real-Time Chat</h1>
                        <p>
                            Logged in as <strong>{session?.username}</strong> | Socket: {connected ? "connected" : "connecting"}
                        </p>
                    </div>

                    <label className="chat-room-picker">
                        Room
                        <select value={room} onChange={handleRoomChange}>
                            <option value="global">global</option>
                            <option value="music">music</option>
                            <option value="admins">admins</option>
                        </select>
                    </label>
                </div>

                {errorMessage && <p className="chat-error">{errorMessage}</p>}

                <div className="chat-messages">
                    {messages.map((message) => {
                        const mine = message.userId === session?.userId;

                        return (
                            <article
                                key={buildMessageKey(message)}
                                className={`chat-message ${mine ? "mine" : ""}`}
                            >
                                <div className="chat-message-meta">
                                    <strong>{message.username}</strong>
                                    <span>{formatTime(message.sentAt)}</span>
                                </div>
                                <p>{message.content}</p>
                            </article>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chat-compose" onSubmit={handleSend}>
                    <input
                        type="text"
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        placeholder="Send a message..."
                        maxLength={500}
                    />
                    <button type="submit">Send</button>
                </form>
            </section>
        </div>
    );
}

export default ChatPage;