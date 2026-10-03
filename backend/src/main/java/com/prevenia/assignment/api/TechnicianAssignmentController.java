package com.prevenia.assignment.api;

import com.prevenia.assignment.api.dto.TechnicianSummaryDto;
import com.prevenia.assignment.application.AssignmentService;
import com.prevenia.shared.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/companies/{companyId}/technicians")
@RequiredArgsConstructor
public class TechnicianAssignmentController {

    private final AssignmentService assignmentService;

    @PostMapping("/{userId}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'CONSULTANT_ADMIN')")
    public ResponseEntity<Void> assignTechnician(
            @PathVariable UUID companyId,
            @PathVariable UUID userId,
            @AuthenticationPrincipal AuthenticatedUser caller
    ) {
        log.debug("POST /api/v1/companies/{}/technicians/{} by {}", companyId, userId, caller.getEmail());
        assignmentService.assignTechnician(companyId, userId, caller);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'CONSULTANT_ADMIN')")
    public ResponseEntity<Void> unassignTechnician(
            @PathVariable UUID companyId,
            @PathVariable UUID userId,
            @AuthenticationPrincipal AuthenticatedUser caller
    ) {
        log.debug("DELETE /api/v1/companies/{}/technicians/{} by {}", companyId, userId, caller.getEmail());
        assignmentService.unassignTechnician(companyId, userId, caller);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<TechnicianSummaryDto>> getAssignedTechnicians(
            @PathVariable UUID companyId,
            @AuthenticationPrincipal AuthenticatedUser caller
    ) {
        log.debug("GET /api/v1/companies/{}/technicians by {}", companyId, caller.getEmail());
        List<TechnicianSummaryDto> response = assignmentService.getAssignedTechnicians(companyId, caller);
        return ResponseEntity.ok(response);
    }
}
