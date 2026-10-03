package com.prevenia.company.api;

import com.prevenia.company.api.dto.CreateCompanyRequest;
import com.prevenia.company.api.dto.CompanyResponse;
import com.prevenia.company.application.CompanyService;
import com.prevenia.shared.security.AuthenticatedUser;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;

    @PostMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'CONSULTANT_ADMIN')")
    public ResponseEntity<CompanyResponse> createCompany(
            @Valid @RequestBody CreateCompanyRequest request,
            @AuthenticationPrincipal AuthenticatedUser caller
    ) {
        log.debug("POST /api/v1/companies received from {}", caller.getEmail());
        CompanyResponse response = companyService.createCompany(request, caller);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<Page<CompanyResponse>> listCompanies(
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal AuthenticatedUser caller
    ) {
        log.debug("GET /api/v1/companies received from {}", caller.getEmail());
        Page<CompanyResponse> response = companyService.listCompanies(pageable, caller);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CompanyResponse> getCompanyById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthenticatedUser caller
    ) {
        log.debug("GET /api/v1/companies/{} received from {}", id, caller.getEmail());
        CompanyResponse response = companyService.getCompanyById(id, caller);
        return ResponseEntity.ok(response);
    }
}
