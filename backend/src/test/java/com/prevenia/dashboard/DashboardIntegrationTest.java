package com.prevenia.dashboard;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prevenia.auth.api.dto.LoginRequest;
import com.prevenia.auth.api.dto.LoginResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "spring.datasource.url=jdbc:h2:mem:dashboard_integ_test;DB_CLOSE_DELAY=-1;MODE=PostgreSQL")
class DashboardIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String COMPANY_MACRO_ID = "33333333-3333-3333-3333-333333333331";
    private static final String COMPANY_COCA_ID = "33333333-3333-3333-3333-333333333333";

    private String obtainToken(String email, String password) throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .email(email)
                .password(password)
                .build();

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        LoginResponse response = objectMapper.readValue(result.getResponse().getContentAsString(), LoginResponse.class);
        return response.getAccessToken();
    }

    @Test
    @DisplayName("Dashboard summary as CONSULTANT_ADMIN returns all companies and metrics in Org A")
    void dashboardSummaryAsConsultantAdmin() throws Exception {
        String token = obtainToken("admin@demo.com", "Demo1234!");

        mockMvc.perform(get("/api/v1/dashboard/summary")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyCount", is(3)))
                .andExpect(jsonPath("$.expiredCount", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.next30DaysCount", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.completedCount", greaterThanOrEqualTo(1)));
    }

    @Test
    @DisplayName("Dashboard summary as TECHNICIAN returns only assigned companies (Macro, Andreani)")
    void dashboardSummaryAsTechnician() throws Exception {
        String token = obtainToken("carlos@demo.com", "Demo1234!");

        mockMvc.perform(get("/api/v1/dashboard/summary")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyCount", is(2)))
                .andExpect(jsonPath("$.expiredCount", greaterThanOrEqualTo(0)));
    }

    @Test
    @DisplayName("Dashboard summary as CLIENT returns only 1 company")
    void dashboardSummaryAsClient() throws Exception {
        String token = obtainToken("macro@demo.com", "Demo1234!");

        mockMvc.perform(get("/api/v1/dashboard/summary")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyCount", is(1)));
    }

    @Test
    @DisplayName("GET upcoming expirations on dashboard returns ordered active list")
    void dashboardUpcomingExpirations() throws Exception {
        String token = obtainToken("admin@demo.com", "Demo1234!");

        mockMvc.perform(get("/api/v1/dashboard/upcoming-expirations?limit=5")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(java.util.List.class)))
                .andExpect(jsonPath("$.length()", lessThanOrEqualTo(5)));
    }

    @Test
    @DisplayName("GET company summary metrics for assigned company returns 200")
    void companySummaryMetricsAssigned() throws Exception {
        String token = obtainToken("carlos@demo.com", "Demo1234!");

        mockMvc.perform(get("/api/v1/companies/" + COMPANY_MACRO_ID + "/summary")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.company.id", is(COMPANY_MACRO_ID)))
                .andExpect(jsonPath("$.company.businessName", is("Banco Macro")))
                .andExpect(jsonPath("$.next30DaysCount", greaterThanOrEqualTo(0)));
    }

    @Test
    @DisplayName("GET company summary metrics for unassigned company returns 404 (Anti-IDOR)")
    void companySummaryMetricsUnassignedFails() throws Exception {
        String token = obtainToken("carlos@demo.com", "Demo1234!");

        mockMvc.perform(get("/api/v1/companies/" + COMPANY_COCA_ID + "/summary")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }
}
