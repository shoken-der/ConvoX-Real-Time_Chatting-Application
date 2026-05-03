package com.convox.service;

import org.springframework.stereotype.Service;
import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PresenceService {
    private final Set<Long> onlineUsers = Collections.newSetFromMap(new ConcurrentHashMap<>());

    public void markOnline(Long userId) {
        onlineUsers.add(userId);
    }

    public void markOffline(Long userId) {
        onlineUsers.remove(userId);
    }

    public boolean isOnline(Long userId) {
        return onlineUsers.contains(userId);
    }

    public Set<Long> getOnlineUsers() {
        return onlineUsers;
    }
}
