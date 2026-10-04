package com.prevenia.alert.api;

import com.prevenia.alert.api.dto.AlertsSummaryResponse;
import com.prevenia.alert.application.AlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @GetMapping
    public ResponseEntity<AlertsSummaryResponse> getAlerts(
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) String priority
    ) {
        log.debug("GET /api/v1/alerts requested with companyId={}, priority={}", companyId, priority);
        AlertsSummaryResponse response = alertService.getAlerts(companyId, priority);
        return ResponseEntity.ok(response);
    }
}
