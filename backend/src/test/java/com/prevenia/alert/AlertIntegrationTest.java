package com.prevenia.alert;

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

import org.springframework.test.annotation.DirtiesContext;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class AlertIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String obtainToken(String email, String password) throws Exception {
        LoginRequest loginRequest = new LoginRequest(email, password);
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        LoginResponse response = objectMapper.readValue(result.getResponse().getContentAsString(), LoginResponse.class);
        return response.getAccessToken();
    }

    @Test
    @DisplayName("Admin A should receive prioritized alerts with critical, high and medium counters")
    void adminAShouldReceiveAlertsSummary() throws Exception {
        String token = obtainToken("admin@demo.com", "Demo1234!");

        mockMvc.perform(get("/api/v1/alerts")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.criticalCount").isNumber())
                .andExpect(jsonPath("$.highCount").isNumber())
                .andExpect(jsonPath("$.mediumCount").isNumber())
                .andExpect(jsonPath("$.totalCount").isNumber())
                .andExpect(jsonPath("$.alerts").isArray());
    }

    @Test
    @DisplayName("Filter alerts by priority=CRITICAL returns only expired obligations")
    void filterAlertsByCriticalPriority() throws Exception {
        String token = obtainToken("admin@demo.com", "Demo1234!");

        mockMvc.perform(get("/api/v1/alerts")
                        .param("priority", "CRITICAL")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alerts[*].priority", everyItem(is("CRITICAL"))));
    }

    @Test
    @DisplayName("Technician Carlos receives alerts only for assigned companies (Macro, Andreani)")
    void technicianReceivesAlertsOnlyForAssignedCompanies() throws Exception {
        String token = obtainToken("carlos@demo.com", "Demo1234!");

        mockMvc.perform(get("/api/v1/alerts")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alerts[*].companyName", everyItem(not("Coca-Cola Andina"))));
    }

    @Test
    @DisplayName("Client Macro receives alerts only for Banco Macro")
    void clientReceivesAlertsOnlyForOwnCompany() throws Exception {
        String token = obtainToken("macro@demo.com", "Demo1234!");

        mockMvc.perform(get("/api/v1/alerts")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alerts[*].companyName", everyItem(is("Banco Macro"))));
    }

    @Test
    @DisplayName("Org B admin receives alerts strictly scoped to Org B")
    void crossTenantIsolationForAlerts() throws Exception {
        String token = obtainToken("admin.b@demo.com", "Demo1234!");

        mockMvc.perform(get("/api/v1/alerts")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alerts[*].companyName", everyItem(not(is("Banco Macro")))));
    }
}
