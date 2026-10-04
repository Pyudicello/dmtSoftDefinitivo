package com.prevenia.user.api;

import com.prevenia.shared.security.AuthenticatedUser;
import com.prevenia.user.api.dto.CreateUserRequest;
import com.prevenia.user.api.dto.UserResponse;
import com.prevenia.user.application.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'CONSULTANT_ADMIN')")
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody CreateUserRequest request,
            @AuthenticationPrincipal AuthenticatedUser caller
    ) {
        log.debug("POST /api/v1/users requested by {}", caller.getEmail());
        UserResponse response = userService.createUser(request, caller);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'CONSULTANT_ADMIN')")
    public ResponseEntity<Page<UserResponse>> listUsers(
            @org.springframework.web.bind.annotation.RequestParam(required = false) com.prevenia.user.domain.UserRole role,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal AuthenticatedUser caller
    ) {
        log.debug("GET /api/v1/users requested by {} with role filter: {}", caller.getEmail(), role);
        Page<UserResponse> response = userService.listUsers(role, pageable, caller);
        return ResponseEntity.ok(response);
    }
}
