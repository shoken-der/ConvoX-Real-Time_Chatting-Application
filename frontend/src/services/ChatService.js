import axios from "axios";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const API_URL = (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim()) || "http://localhost:8080";
export const baseURL = `${API_URL}/api`;


const getUserToken = () => {
  return localStorage.getItem("token");
};

export const initiateSocketConnection = (userId) => {
  const token = getUserToken();
  const stompClient = new Client({
    webSocketFactory: () => new SockJS(`${API_URL}/ws`),
    connectHeaders: {
      userId: userId ? userId.toString() : null,
      Authorization: token ? `Bearer ${token}` : null
    },
    debug: (str) => {
      // Quiet STOMP logs in production
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  return stompClient;
};

const createHeader = () => {
  const token = getUserToken();

  const payloadHeader = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
  return payloadHeader;
};

export const getAllUsers = async () => {
  const header = createHeader();

  try {
    const res = await axios.get(`${baseURL}/user`, header);
    return res.data || [];
  } catch (e) {
    console.error("ChatService - Get All Users Error:", e.response?.data || e.message);
    return [];
  }
};

export const getUser = async (userId) => {
  const header = createHeader();

  try {
    const res = await axios.get(`${baseURL}/user/${userId}`, header);
    return res.data;
  } catch (e) {
    console.error("Get User Error:", e);
    return null;
  }
};

export const searchUsers = async (query) => {
  const header = createHeader();

  try {
    const res = await axios.post(`${baseURL}/user/search`, { query }, header);
    return res.data || [];
  } catch (e) {
    console.error("Search Users Error:", e);
    return [];
  }
};

export const getChatRooms = async (userId) => {
  const header = createHeader();

  try {
    const res = await axios.get(`${baseURL}/room/${userId}`, header);
    return res.data || [];
  } catch (e) {
    console.error("ChatService - Get Chat Rooms Error:", e.response?.data || e.message);
    return [];
  }
};

export const getChatRoomOfUsers = async (firstUserId, secondUserId) => {
  const header = createHeader();

  try {
    const res = await axios.get(
      `${baseURL}/room/${firstUserId}/${secondUserId}`,
      header
    );
    return res.data;
  } catch (e) {
    console.error("ChatService - Get Room of Users Error:", e.response?.data || e.message);
    return null;
  }
};

export const createChatRoom = async (members) => {
  const header = createHeader();

  try {
    const res = await axios.post(`${baseURL}/room`, members, header);
    return res.data;
  } catch (e) {
    console.error("ChatService - Create Room Error:", e.response?.data || e.message);
    throw e;
  }
};

export const getMessagesOfChatRoom = async (chatRoomId, page = 0, limit = 50) => {
  const header = createHeader();

  try {
    const res = await axios.get(`${baseURL}/message/${chatRoomId}?page=${page}&limit=${limit}`, header);
    return res.data || [];
  } catch (e) {
    console.error("ChatService - Get Messages Error:", e.response?.data || e.message);
    return [];
  }
};

export const sendMessage = async (messageBody) => {
  const header = createHeader();

  try {
    const res = await axios.post(`${baseURL}/message`, messageBody, header);
    return res.data;
  } catch (e) {
    console.error("Send Message Error:", e);
    throw e;
  }
};

export const toggleReaction = async (messageId, reactionData) => {
  const header = createHeader();

  try {
    const res = await axios.post(
      `${baseURL}/message/${messageId}/react`,
      reactionData,
      header
    );
    return res.data;
  } catch (e) {
    console.error("Toggle Reaction Error:", e);
    throw e;
  }
};

export const editMessage = async (messageId, text) => {
  const header = createHeader();
  try {
    const res = await axios.put(`${baseURL}/message/${messageId}`, { text }, header);
    return res.data;
  } catch (e) {
    console.error("Edit Service Error:", e);
    throw e;
  }
};

export const deleteMessage = async (messageId, userId) => {
  const header = createHeader();
  try {
    const res = await axios.delete(`${baseURL}/message/${messageId}?userId=${userId}`, header);
    return res.data;
  } catch (e) {
    console.error("Delete Service Error:", e);
    throw e;
  }
};

export const markMessageSeen = async (messageId, userId) => {
  const header = createHeader();
  try {
    const res = await axios.patch(`${baseURL}/message/${messageId}/seen`, { userId }, header);
    return res.data;
  } catch (e) {
    console.error("Seen Service Error:", e);
    throw e;
  }
};

export const deleteChatRoom = async (chatRoomId) => {
  const header = createHeader();
  try {
    const res = await axios.delete(`${baseURL}/room/${chatRoomId}`, header);
    return res.data;
  } catch (e) {
    console.error("Delete Chat Room Error:", e);
    throw e;
  }
};

export const hideChatRoom = async (chatRoomId, userId) => {
  const header = createHeader();
  try {
    const res = await axios.patch(`${baseURL}/room/${chatRoomId}/hide?userId=${userId}`, {}, header);
    return res.data;
  } catch (e) {
    console.error("Hide Chat Room Error:", e);
    throw e;
  }
};

export const uploadFile = async (file, onProgress) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    };

    reader.onload = () => {
      onProgress(100);
      resolve({
        url: reader.result,
        fileType: file.type,
        fileSize: file.size
      });
    };

    reader.onerror = (err) => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
};
