package com.prevenia.dashboard.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {
    private long companyCount;
    private long expiredCount;
    private long next7DaysCount;
    private long next30DaysCount;
    private long completedCount;
}
