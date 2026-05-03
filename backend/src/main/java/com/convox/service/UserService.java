package com.convox.service;

import com.convox.dto.response.UserResponse;
import java.util.List;

public interface UserService {
    List<UserResponse> getAllUsers();
    UserResponse getUser(Long id);
    List<UserResponse> searchUsers(String query);
    UserResponse updateProfile(Long userId, String displayName, String photoUrl);
}
