package com.prevenia.permit;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.prevenia.auth.api.dto.LoginRequest;
import com.prevenia.auth.api.dto.LoginResponse;
import com.prevenia.permit.api.dto.CancelPermitRequest;
import com.prevenia.permit.api.dto.CreatePermitRequest;
import com.prevenia.permit.api.dto.RenewPermitRequest;
import com.prevenia.permit.api.dto.UpdatePermitRequest;
import com.prevenia.permit.domain.PermitStatus;
import com.prevenia.permit.domain.PermitType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
public class PermitIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static final UUID COMPANY_MACRO_ID = UUID.fromString("33333333-3333-3333-3333-333333333331");
    private static final UUID COMPANY_TECHCORP_ORG_B_ID = UUID.fromString("33333333-3333-3333-3333-333333333334");

    private String adminToken;
    private String techToken;
    private String clientToken;

    @BeforeEach
    void setUp() throws Exception {
        adminToken = obtainToken("admin@demo.com", "Demo1234!");
        techToken = obtainToken("martin@demo.com", "Demo1234!");
        clientToken = obtainToken("macro@demo.com", "Demo1234!");
    }

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

        LoginResponse loginResponse = objectMapper.readValue(result.getResponse().getContentAsString(), LoginResponse.class);
        return loginResponse.getAccessToken();
    }

    @Test
    @DisplayName("Create permit integrates with Expiration engine and calculates deadline status")
    void createPermit_integratesWithExpirationEngine() throws Exception {
        LocalDate issueDate = LocalDate.now().minusMonths(6);
        LocalDate expirationDate = LocalDate.now().plusMonths(6);

        CreatePermitRequest request = CreatePermitRequest.builder()
                .companyId(COMPANY_MACRO_ID)
                .type(PermitType.MUNICIPAL)
                .issuingAuthority("Municipalidad de San Isidro")
                .permitNumber("HAB-MUN-2026-881")
                .issueDate(issueDate)
                .expirationDate(expirationDate)
                .contactName("Lic. Fernández")
                .notes("Habilitación comercial general para planta industrial.")
                .documentReference("EXP-5590-2026")
                .build();

        MvcResult result = mockMvc.perform(post("/api/v1/companies/" + COMPANY_MACRO_ID + "/permits")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type", is("MUNICIPAL")))
                .andExpect(jsonPath("$.permitNumber", is("HAB-MUN-2026-881")))
                .andExpect(jsonPath("$.status", is("ACTIVE")))
                .andExpect(jsonPath("$.deadlineStatus", is("CURRENT")))
                .andExpect(jsonPath("$.expirationId", notNullValue()))
                .andReturn();

        JsonNode jsonNode = objectMapper.readTree(result.getResponse().getContentAsString());
        String expirationId = jsonNode.get("expirationId").asText();

        // Check linked Expiration in the core engine
        mockMvc.perform(get("/api/v1/expirations/" + expirationId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Habilitación/Visado: Municipalidad de San Isidro (HAB-MUN-2026-881)")))
                .andExpect(jsonPath("$.expirationDate", is(expirationDate.toString())))
                .andExpect(jsonPath("$.lifecycleStatus", is("ACTIVE")));
    }

    @Test
    @DisplayName("Permit with near expiration date classifies as URGENT or UPCOMING correctly")
    void permit_urgentDeadlineStatus() throws Exception {
        LocalDate issueDate = LocalDate.now().minusYears(1);
        LocalDate expirationDate = LocalDate.now().plusDays(5); // <= 7 days -> URGENT

        CreatePermitRequest request = CreatePermitRequest.builder()
                .companyId(COMPANY_MACRO_ID)
                .type(PermitType.FIRE_DEPARTMENT)
                .issuingAuthority("Dirección de Bomberos de la Policía")
                .permitNumber("BOMB-2025-0041")
                .issueDate(issueDate)
                .expirationDate(expirationDate)
                .build();

        mockMvc.perform(post("/api/v1/permits")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.deadlineStatus", is("URGENT")))
                .andExpect(jsonPath("$.daysUntilExpiration", is(5)));
    }

    @Test
    @DisplayName("Renewing a permit archives the previous permit and preserves history")
    void renewPermit_preservesHistoryAndCompletesPreviousExpiration() throws Exception {
        // 1. Create initial permit
        LocalDate oldIssue = LocalDate.now().minusYears(1);
        LocalDate oldExp = LocalDate.now().minusDays(1); // expired yesterday

        CreatePermitRequest initialReq = CreatePermitRequest.builder()
                .companyId(COMPANY_MACRO_ID)
                .type(PermitType.PROVINCIAL)
                .issuingAuthority("OPDS / Ministerio de Ambiente PBA")
                .permitNumber("OPDS-2025-01")
                .issueDate(oldIssue)
                .expirationDate(oldExp)
                .build();

        MvcResult initialResult = mockMvc.perform(post("/api/v1/permits")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(initialReq)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode initialJson = objectMapper.readTree(initialResult.getResponse().getContentAsString());
        String initialPermitId = initialJson.get("id").asText();
        String initialExpirationId = initialJson.get("expirationId").asText();

        // 2. Renew the permit
        LocalDate newIssue = LocalDate.now();
        LocalDate newExp = LocalDate.now().plusYears(2);

        RenewPermitRequest renewReq = RenewPermitRequest.builder()
                .permitNumber("OPDS-2026-02")
                .issueDate(newIssue)
                .expirationDate(newExp)
                .issuingAuthority("OPDS / Ministerio de Ambiente PBA")
                .notes("Renovación bianual concedida.")
                .documentReference("DISPOSICION-2026-991")
                .build();

        MvcResult renewResult = mockMvc.perform(post("/api/v1/permits/" + initialPermitId + "/renew")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(renewReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.permitNumber", is("OPDS-2026-02")))
                .andExpect(jsonPath("$.status", is("ACTIVE")))
                .andExpect(jsonPath("$.previousPermitId", is(initialPermitId)))
                .andExpect(jsonPath("$.previousPermitNumber", is("OPDS-2025-01")))
                .andReturn();

        // 3. Verify previous permit is now RENEWED
        mockMvc.perform(get("/api/v1/permits/" + initialPermitId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("RENEWED")))
                .andExpect(jsonPath("$.statusLabel", is("Renovada")));

        // 4. Verify previous linked expiration is COMPLETED
        mockMvc.perform(get("/api/v1/expirations/" + initialExpirationId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lifecycleStatus", is("COMPLETED")));

        // 5. Query company permit history to verify full audit trail is preserved
        mockMvc.perform(get("/api/v1/companies/" + COMPANY_MACRO_ID + "/permits/history")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    @DisplayName("Cancelling a permit sets status to CANCELLED and cancels linked expiration")
    void cancelPermit_cancelsLinkedExpiration() throws Exception {
        CreatePermitRequest request = CreatePermitRequest.builder()
                .companyId(COMPANY_MACRO_ID)
                .type(PermitType.OTHER)
                .issuingAuthority("Prefectura Naval Argentina")
                .permitNumber("PNA-2026-77")
                .issueDate(LocalDate.now().minusMonths(1))
                .expirationDate(LocalDate.now().plusMonths(5))
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/v1/permits")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode jsonNode = objectMapper.readTree(createResult.getResponse().getContentAsString());
        String permitId = jsonNode.get("id").asText();
        String expirationId = jsonNode.get("expirationId").asText();

        // Cancel permit
        CancelPermitRequest cancelReq = CancelPermitRequest.builder()
                .reason("Cese de actividad en zona portuaria")
                .build();

        mockMvc.perform(post("/api/v1/permits/" + permitId + "/cancel")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cancelReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CANCELLED")));

        // Linked Expiration should be cancelled
        mockMvc.perform(get("/api/v1/expirations/" + expirationId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lifecycleStatus", is("CANCELLED")));
    }

    @Test
    @DisplayName("Client user cannot create or renew permits")
    void clientUser_cannotWritePermits() throws Exception {
        CreatePermitRequest request = CreatePermitRequest.builder()
                .companyId(COMPANY_MACRO_ID)
                .type(PermitType.MUNICIPAL)
                .issuingAuthority("Municipalidad")
                .permitNumber("HAB-1")
                .issueDate(LocalDate.now())
                .expirationDate(LocalDate.now().plusYears(1))
                .build();

        mockMvc.perform(post("/api/v1/permits")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Cross-tenant permit write is rejected with 404")
    void crossTenantPermit_isRejected() throws Exception {
        CreatePermitRequest request = CreatePermitRequest.builder()
                .companyId(COMPANY_TECHCORP_ORG_B_ID)
                .type(PermitType.MUNICIPAL)
                .issuingAuthority("Municipalidad de Córdoba")
                .permitNumber("HAB-COR-99")
                .issueDate(LocalDate.now())
                .expirationDate(LocalDate.now().plusYears(1))
                .build();

        mockMvc.perform(post("/api/v1/permits")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }
}
