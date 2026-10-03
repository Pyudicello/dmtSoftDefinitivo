package com.prevenia.system.api;

import com.prevenia.system.api.dto.SystemInfoResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Slf4j
@RestController
@RequestMapping("/api/v1/system")
public class SystemInfoController {

    @Value("${app.info.name:PREVENIA}")
    private String applicationName;

    @Value("${app.info.version:0.1.0}")
    private String applicationVersion;

    @Value("${spring.profiles.active:local}")
    private String activeProfile;

    @GetMapping("/info")
    public ResponseEntity<SystemInfoResponse> getSystemInfo() {
        log.debug("GET /api/v1/system/info invoked");
        SystemInfoResponse response = SystemInfoResponse.builder()
                .application(applicationName)
                .version(applicationVersion)
                .environment(activeProfile)
                .status("UP")
                .timestamp(OffsetDateTime.now(ZoneOffset.UTC))
                .build();
        return ResponseEntity.ok(response);
    }
}
