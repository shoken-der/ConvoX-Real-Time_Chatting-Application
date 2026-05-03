import { useEffect, useRef, useCallback, useState } from "react";
import { initiateSocketConnection } from "../services/ChatService";
import { useAuth } from "../contexts/AuthContext";

export default function useSocket() {
  const stompClient = useRef(null);
  const [connected, setConnected] = useState(false);
  const { currentUser } = useAuth();

  const connect = useCallback(async () => {
    if (stompClient.current?.connected) return stompClient.current;
    if (!currentUser?.id) return; // Note: using .id now, not .uid

    try {
      const client = initiateSocketConnection(currentUser.id);
      
      client.onConnect = () => {
        setConnected(true);
      };

      client.onDisconnect = () => {
        setConnected(false);
      };

      client.onStompError = (frame) => {
        console.error("STOMP Error", frame);
        setConnected(false);
      };

      client.activate();
      stompClient.current = client;
      return client;
    } catch (err) {
      console.error("Connection error", err);
    }
  }, [currentUser?.id]);

  const disconnect = useCallback(() => {
    if (stompClient.current) {
      stompClient.current.deactivate();
      stompClient.current = null;
      setConnected(false);
    }
  }, []);

  const emit = useCallback((event, data) => {
    if (stompClient.current && connected) {
      let destination = event;
      
      // Map legacy events to STOMP destinations
      if (event === "sendMessage") destination = "chat.sendMessage";
      else if (event === "typing") destination = "chat.typing";
      else if (event === "stopTyping") destination = "chat.stopTyping";
      else if (event === "reaction") destination = "chat.reaction";
      else if (event === "editMessage") destination = "chat.editMessage";
      else if (event === "deleteMessage") destination = "chat.deleteMessage";
      else if (event === "markSeen") destination = "chat.markSeen";

      stompClient.current.publish({
        destination: destination.startsWith("/app") ? destination : `/app/${destination}`,
        body: JSON.stringify(data),
      });
    }
  }, [connected]);

  const subscribe = useCallback((destination, callback) => {
    if (stompClient.current && connected) {
      const sub = stompClient.current.subscribe(destination, (message) => {
        callback(JSON.parse(message.body));
      });
      return sub;
    }
  }, [connected]);

  // Shim for socket.io style 'on'
  const on = useCallback((event, callback, chatId) => {
    if (!chatId) return;
    
    let destination;
    if (event === "getMessage") destination = `/topic/chat/${chatId}`;
    else if (event === "typing" || event === "stopTyping") destination = `/topic/chat/${chatId}/typing`;
    else if (event === "messageEdited") destination = `/topic/chat/${chatId}`; // Assuming edited messages come through the same topic
    else if (event === "messageDeleted") destination = `/topic/chat/${chatId}`;
    else if (event === "messageSeen") destination = `/topic/chat/${chatId}`;
    else return;

    return subscribe(destination, callback);
  }, [subscribe]);

  useEffect(() => {
    if (currentUser?.id) {
      connect();
    }
    return () => disconnect();
  }, [currentUser?.id, connect, disconnect]);

  return { socket: stompClient, connected, connect, disconnect, emit, on, subscribe };
}
