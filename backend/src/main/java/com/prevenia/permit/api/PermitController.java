package com.prevenia.permit.api;

import com.prevenia.permit.api.dto.CancelPermitRequest;
import com.prevenia.permit.api.dto.CreatePermitRequest;
import com.prevenia.permit.api.dto.PermitFilterRequest;
import com.prevenia.permit.api.dto.PermitResponse;
import com.prevenia.permit.api.dto.RenewPermitRequest;
import com.prevenia.permit.api.dto.UpdatePermitRequest;
import com.prevenia.permit.application.PermitService;
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
public class PermitController {

    private final PermitService permitService;

    @GetMapping("/permits")
    public ResponseEntity<Page<PermitResponse>> listPermits(
            @ModelAttribute PermitFilterRequest filters,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<PermitResponse> page = permitService.listPermits(filters, pageable);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/companies/{companyId}/permits")
    public ResponseEntity<Page<PermitResponse>> listCompanyPermits(
            @PathVariable UUID companyId,
            @ModelAttribute PermitFilterRequest filters,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<PermitResponse> page = permitService.listCompanyPermits(companyId, filters, pageable);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/companies/{companyId}/permits/history")
    public ResponseEntity<Page<PermitResponse>> getCompanyPermitHistory(
            @PathVariable UUID companyId,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<PermitResponse> page = permitService.getCompanyPermitHistory(companyId, pageable);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/permits/{id}")
    public ResponseEntity<PermitResponse> getPermitById(@PathVariable UUID id) {
        PermitResponse response = permitService.getPermitById(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/permits")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'CONSULTANT_ADMIN', 'TECHNICIAN')")
    public ResponseEntity<PermitResponse> createPermit(@Valid @RequestBody CreatePermitRequest request) {
        PermitResponse response = permitService.createPermit(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/companies/{companyId}/permits")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'CONSULTANT_ADMIN', 'TECHNICIAN')")
    public ResponseEntity<PermitResponse> createCompanyPermit(
            @PathVariable UUID companyId,
            @Valid @RequestBody CreatePermitRequest request) {
        request.setCompanyId(companyId);
        PermitResponse response = permitService.createPermit(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/permits/{id}/renew")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'CONSULTANT_ADMIN', 'TECHNICIAN')")
    public ResponseEntity<PermitResponse> renewPermit(
            @PathVariable UUID id,
            @Valid @RequestBody RenewPermitRequest request) {
        PermitResponse response = permitService.renewPermit(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/permits/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'CONSULTANT_ADMIN', 'TECHNICIAN')")
    public ResponseEntity<PermitResponse> updatePermit(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePermitRequest request) {
        PermitResponse response = permitService.updatePermit(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/permits/{id}/cancel")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'CONSULTANT_ADMIN', 'TECHNICIAN')")
    public ResponseEntity<PermitResponse> cancelPermit(
            @PathVariable UUID id,
            @RequestBody(required = false) CancelPermitRequest request) {
        PermitResponse response = permitService.cancelPermit(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/permits/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'CONSULTANT_ADMIN', 'TECHNICIAN')")
    public ResponseEntity<Void> deletePermit(@PathVariable UUID id) {
        permitService.deletePermit(id);
        return ResponseEntity.noContent().build();
    }
}
