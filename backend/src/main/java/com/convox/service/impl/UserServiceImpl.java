package com.convox.service.impl;

import com.convox.dto.response.UserResponse;
import com.convox.entity.User;
import com.convox.mapper.EntityMapper;
import com.convox.repository.UserRepository;
import com.convox.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EntityMapper entityMapper;

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(entityMapper::toUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    public UserResponse getUser(Long id) {
        User user = userRepository.findById(id).orElseThrow();
        return entityMapper.toUserResponse(user);
    }

    @Override
    public List<UserResponse> searchUsers(String query) {
        return userRepository.searchUsers(query).stream()
                .map(entityMapper::toUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    public UserResponse updateProfile(Long userId, String displayName, String photoUrl) {

        User user = userRepository.findById(userId).orElseThrow();
        user.setDisplayName(displayName);
        user.setPhotoUrl(photoUrl);
        user.setProfileCompleted(true);
        User savedUser = userRepository.save(user);

        return entityMapper.toUserResponse(savedUser);
    }
}
