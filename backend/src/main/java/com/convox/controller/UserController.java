package com.convox.controller;

import com.convox.dto.request.ProfileUpdateRequest;
import com.convox.dto.response.UserResponse;
import com.convox.security.UserPrincipal;
import com.convox.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUser(id));
    }

    @PostMapping("/search")
    public ResponseEntity<List<UserResponse>> searchUsers(@RequestBody String query) {
        // Handle raw string or JSON wrap
        String cleanedQuery = query.replaceAll("[\"{}]", "").replace("query:", "");
        return ResponseEntity.ok(userService.searchUsers(cleanedQuery.trim()));
    }

    @PostMapping("/update-profile")
    public ResponseEntity<UserResponse> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody ProfileUpdateRequest request) {

        return ResponseEntity.ok(userService.updateProfile(principal.getId(), request.getDisplayName(), request.getPhotoUrl()));
    }
}
