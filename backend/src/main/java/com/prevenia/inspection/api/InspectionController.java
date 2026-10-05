package com.prevenia.inspection.api;

import com.prevenia.inspection.api.dto.CreateInspectionRequest;
import com.prevenia.inspection.api.dto.InspectionFilterRequest;
import com.prevenia.inspection.api.dto.InspectionResponse;
import com.prevenia.inspection.api.dto.UpdateInspectionRequest;
import com.prevenia.inspection.application.InspectionService;
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
public class InspectionController {

    private final InspectionService inspectionService;

    @GetMapping("/inspections")
    public ResponseEntity<Page<InspectionResponse>> listInspections(
            @ModelAttribute InspectionFilterRequest filters,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<InspectionResponse> page = inspectionService.listInspections(filters, pageable);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/companies/{companyId}/inspections")
    public ResponseEntity<Page<InspectionResponse>> listCompanyInspections(
            @PathVariable UUID companyId,
            @ModelAttribute InspectionFilterRequest filters,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<InspectionResponse> page = inspectionService.listCompanyInspections(companyId, filters, pageable);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/inspections/{id}")
    public ResponseEntity<InspectionResponse> getInspectionById(@PathVariable UUID id) {
        InspectionResponse response = inspectionService.getInspectionById(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/inspections")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'CONSULTANT_ADMIN', 'TECHNICIAN')")
    public ResponseEntity<InspectionResponse> createInspection(@Valid @RequestBody CreateInspectionRequest request) {
        InspectionResponse response = inspectionService.createInspection(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/companies/{companyId}/inspections")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'CONSULTANT_ADMIN', 'TECHNICIAN')")
    public ResponseEntity<InspectionResponse> createCompanyInspection(
            @PathVariable UUID companyId,
            @Valid @RequestBody CreateInspectionRequest request) {
        request.setCompanyId(companyId);
        InspectionResponse response = inspectionService.createInspection(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/inspections/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'CONSULTANT_ADMIN', 'TECHNICIAN')")
    public ResponseEntity<InspectionResponse> updateInspection(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateInspectionRequest request) {
        InspectionResponse response = inspectionService.updateInspection(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/inspections/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'CONSULTANT_ADMIN', 'TECHNICIAN')")
    public ResponseEntity<Void> deleteInspection(@PathVariable UUID id) {
        inspectionService.deleteInspection(id);
        return ResponseEntity.noContent().build();
    }
}
