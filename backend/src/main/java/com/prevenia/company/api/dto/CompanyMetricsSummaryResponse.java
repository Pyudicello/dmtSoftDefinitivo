package com.prevenia.company.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyMetricsSummaryResponse {
    private CompanyResponse company;
    private long expiredCount;
    private long next7DaysCount;
    private long next30DaysCount;
    private long currentCount;
    private long completedCount;
}
