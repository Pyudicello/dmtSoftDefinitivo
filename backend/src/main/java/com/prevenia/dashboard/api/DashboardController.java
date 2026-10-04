package com.prevenia.dashboard.api;

import com.prevenia.company.api.dto.CompanyMetricsSummaryResponse;
import com.prevenia.dashboard.api.dto.DashboardSummaryResponse;
import com.prevenia.dashboard.application.DashboardService;
import com.prevenia.expiration.api.dto.ExpirationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/dashboard/summary")
    public ResponseEntity<DashboardSummaryResponse> getDashboardSummary() {
        log.debug("GET /api/v1/dashboard/summary");
        return ResponseEntity.ok(dashboardService.getDashboardSummary());
    }

    @GetMapping("/dashboard/upcoming-expirations")
    public ResponseEntity<List<ExpirationResponse>> getUpcomingExpirations(
            @RequestParam(name = "limit", defaultValue = "10") int limit) {
        log.debug("GET /api/v1/dashboard/upcoming-expirations?limit={}", limit);
        return ResponseEntity.ok(dashboardService.getUpcomingExpirations(limit));
    }

    @GetMapping("/companies/{companyId}/summary")
    public ResponseEntity<CompanyMetricsSummaryResponse> getCompanySummary(
            @PathVariable("companyId") UUID companyId) {
        log.debug("GET /api/v1/companies/{}/summary", companyId);
        return ResponseEntity.ok(dashboardService.getCompanyMetricsSummary(companyId));
    }
}
