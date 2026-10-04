package com.prevenia.alert.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertsSummaryResponse {

    private long criticalCount; // EXPIRED
    private long highCount;     // URGENT (0 to 7 days)
    private long mediumCount;   // UPCOMING (8 to 30 days)
    private long totalCount;
    private List<AlertItemResponse> alerts;
}
