import { useEffect, useState } from "react";
import socket from "socket";

export default function ChatBox() {
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        // On connection
        socket.on("connect", () => {
            console.log("✅ Connected to socket");
        });

        // Receive private message
        socket.on("private_message", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        return () => {
            socket.off("connect");
            socket.off("private_message");
        };
    }, []);

    return (
        <div>
            <h2>Chat</h2>
            <ul>
                {messages.map((m, i) => (
                    <li key={i}>
                        <strong>{m.from}</strong>: {m.text}
                    </li>
                ))}
            </ul>
        </div>
    );
}
