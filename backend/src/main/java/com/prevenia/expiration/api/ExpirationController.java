package com.prevenia.expiration.api;

import com.prevenia.expiration.api.dto.CancelExpirationRequest;
import com.prevenia.expiration.api.dto.CompleteExpirationRequest;
import com.prevenia.expiration.api.dto.CreateExpirationRequest;
import com.prevenia.expiration.api.dto.ExpirationFilterRequest;
import com.prevenia.expiration.api.dto.ExpirationResponse;
import com.prevenia.expiration.api.dto.UpdateExpirationRequest;
import com.prevenia.expiration.application.ExpirationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ExpirationController {

    private final ExpirationService expirationService;

    @GetMapping("/expirations")
    public ResponseEntity<Page<ExpirationResponse>> listExpirations(
            @ModelAttribute ExpirationFilterRequest filters,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ExpirationResponse> page = expirationService.listExpirations(filters, pageable);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/expirations/{id}")
    public ResponseEntity<ExpirationResponse> getExpirationById(@PathVariable UUID id) {
        ExpirationResponse response = expirationService.getExpirationById(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/expirations")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'CONSULTANT_ADMIN', 'TECHNICIAN')")
    public ResponseEntity<ExpirationResponse> createExpiration(@Valid @RequestBody CreateExpirationRequest request) {
        ExpirationResponse response = expirationService.createExpiration(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/expirations/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'CONSULTANT_ADMIN', 'TECHNICIAN')")
    public ResponseEntity<ExpirationResponse> updateExpiration(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateExpirationRequest request) {
        ExpirationResponse response = expirationService.updateExpiration(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/expirations/{id}/complete")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'CONSULTANT_ADMIN', 'TECHNICIAN')")
    public ResponseEntity<ExpirationResponse> completeExpiration(
            @PathVariable UUID id,
            @RequestBody(required = false) CompleteExpirationRequest request) {
        ExpirationResponse response = expirationService.completeExpiration(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/expirations/{id}/cancel")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'CONSULTANT_ADMIN', 'TECHNICIAN')")
    public ResponseEntity<ExpirationResponse> cancelExpiration(
            @PathVariable UUID id,
            @RequestBody(required = false) CancelExpirationRequest request) {
        ExpirationResponse response = expirationService.cancelExpiration(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/expirations/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'CONSULTANT_ADMIN', 'TECHNICIAN')")
    public ResponseEntity<Void> deleteExpiration(@PathVariable UUID id) {
        expirationService.deleteExpiration(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/expirations/upcoming")
    public ResponseEntity<Page<ExpirationResponse>> listUpcomingExpirations(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ExpirationResponse> page = expirationService.listUpcomingExpirations(pageable);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/expirations/expired")
    public ResponseEntity<Page<ExpirationResponse>> listExpiredExpirations(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ExpirationResponse> page = expirationService.listExpiredExpirations(pageable);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/companies/{companyId}/expirations")
    public ResponseEntity<Page<ExpirationResponse>> listCompanyExpirations(
            @PathVariable UUID companyId,
            @ModelAttribute ExpirationFilterRequest filters,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ExpirationResponse> page = expirationService.listCompanyExpirations(companyId, filters, pageable);
        return ResponseEntity.ok(page);
    }
}
