package com.prevenia.expiration.infrastructure.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.expiration")
@Getter
@Setter
public class ExpirationProperties {

    private int urgentDays = 7;
    private int upcomingDays = 30;

    @PostConstruct
    public void validate() {
        if (urgentDays < 0) {
            throw new IllegalStateException("app.expiration.urgent-days must be non-negative");
        }
        if (upcomingDays <= urgentDays) {
            throw new IllegalStateException("app.expiration.upcoming-days must be strictly greater than urgent-days");
        }
    }
}
