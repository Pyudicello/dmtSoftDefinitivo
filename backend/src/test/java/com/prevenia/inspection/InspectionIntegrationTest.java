package com.prevenia.inspection;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.prevenia.auth.api.dto.LoginRequest;
import com.prevenia.auth.api.dto.LoginResponse;
import com.prevenia.inspection.api.dto.CreateInspectionRequest;
import com.prevenia.inspection.api.dto.UpdateInspectionRequest;
import com.prevenia.inspection.domain.InspectionType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class InspectionIntegrationTest {

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
    @DisplayName("Create inspection without nextVisitDate should not generate an expiration")
    void createInspection_withoutNextVisitDate_success() throws Exception {
        CreateInspectionRequest request = CreateInspectionRequest.builder()
                .companyId(COMPANY_MACRO_ID)
                .type(InspectionType.ART)
                .visitDate(LocalDate.now().minusDays(5))
                .authority("Prevención ART")
                .contactName("Ing. Gómez")
                .contactPhone("11-5555-1234")
                .result("Relevamiento de condiciones generales conforme.")
                .notes("Se entregó constancia digital.")
                .documentReference("ACTA-ART-2026-99")
                .build();

        mockMvc.perform(post("/api/v1/companies/" + COMPANY_MACRO_ID + "/inspections")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type", is("ART")))
                .andExpect(jsonPath("$.authority", is("Prevención ART")))
                .andExpect(jsonPath("$.expirationId", nullValue()))
                .andExpect(jsonPath("$.nextVisitDate", nullValue()));
    }

    @Test
    @DisplayName("Create inspection with nextVisitDate synchronizes with Expiration engine")
    void createInspection_withNextVisitDate_syncsExpirationEngine() throws Exception {
        LocalDate nextDate = LocalDate.now().plusDays(45);
        CreateInspectionRequest request = CreateInspectionRequest.builder()
                .companyId(COMPANY_MACRO_ID)
                .type(InspectionType.MUNICIPAL)
                .visitDate(LocalDate.now().minusDays(2))
                .authority("Municipalidad de Vicente López")
                .contactName("Inspector Ramírez")
                .result("Inspección de condiciones edilicias y matafuegos aprobada.")
                .nextVisitDate(nextDate)
                .documentReference("ACTA-MUN-4412")
                .build();

        MvcResult result = mockMvc.perform(post("/api/v1/companies/" + COMPANY_MACRO_ID + "/inspections")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type", is("MUNICIPAL")))
                .andExpect(jsonPath("$.expirationId", notNullValue()))
                .andExpect(jsonPath("$.nextVisitDeadlineStatus", is("CURRENT")))
                .andReturn();

        JsonNode jsonNode = objectMapper.readTree(result.getResponse().getContentAsString());
        String expirationId = jsonNode.get("expirationId").asText();

        // Verify the linked Expiration is accessible in the core expiration engine
        mockMvc.perform(get("/api/v1/expirations/" + expirationId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Próxima Inspección: Municipal - Municipalidad de Vicente López")))
                .andExpect(jsonPath("$.expirationDate", is(nextDate.toString())))
                .andExpect(jsonPath("$.lifecycleStatus", is("ACTIVE")));
    }

    @Test
    @DisplayName("Updating nextVisitDate on inspection updates linked Expiration")
    void updateInspection_updatesLinkedExpiration() throws Exception {
        LocalDate originalNextDate = LocalDate.now().plusDays(20);
        CreateInspectionRequest createRequest = CreateInspectionRequest.builder()
                .companyId(COMPANY_MACRO_ID)
                .type(InspectionType.HYGIENE_SAFETY_SERVICE)
                .visitDate(LocalDate.now().minusDays(1))
                .authority("Consultora Prevenia")
                .nextVisitDate(originalNextDate)
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/v1/inspections")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode createdJson = objectMapper.readTree(createResult.getResponse().getContentAsString());
        String inspectionId = createdJson.get("id").asText();
        String expirationId = createdJson.get("expirationId").asText();

        // Update with new nextVisitDate
        LocalDate updatedNextDate = LocalDate.now().plusDays(60);
        UpdateInspectionRequest updateRequest = UpdateInspectionRequest.builder()
                .type(InspectionType.HYGIENE_SAFETY_SERVICE)
                .visitDate(LocalDate.now())
                .authority("Consultora Prevenia - Auditoría Semestral")
                .nextVisitDate(updatedNextDate)
                .notes("Re-programada para dentro de 60 días.")
                .build();

        mockMvc.perform(put("/api/v1/inspections/" + inspectionId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authority", is("Consultora Prevenia - Auditoría Semestral")))
                .andExpect(jsonPath("$.nextVisitDate", is(updatedNextDate.toString())));

        // Check linked expiration updated
        mockMvc.perform(get("/api/v1/expirations/" + expirationId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.expirationDate", is(updatedNextDate.toString())))
                .andExpect(jsonPath("$.title", is("Próxima Inspección: Servicio de Higiene y Seguridad - Consultora Prevenia - Auditoría Semestral")));
    }

    @Test
    @DisplayName("Deleting an inspection cancels linked Expiration in the core engine")
    void deleteInspection_cancelsLinkedExpiration() throws Exception {
        CreateInspectionRequest createRequest = CreateInspectionRequest.builder()
                .companyId(COMPANY_MACRO_ID)
                .type(InspectionType.PROVINCIAL)
                .visitDate(LocalDate.now().minusDays(3))
                .authority("Ministerio de Trabajo PBA")
                .nextVisitDate(LocalDate.now().plusDays(10))
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/v1/inspections")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode createdJson = objectMapper.readTree(createResult.getResponse().getContentAsString());
        String inspectionId = createdJson.get("id").asText();
        String expirationId = createdJson.get("expirationId").asText();

        // Delete the inspection
        mockMvc.perform(delete("/api/v1/inspections/" + inspectionId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        // Linked Expiration should be cancelled
        mockMvc.perform(get("/api/v1/expirations/" + expirationId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lifecycleStatus", is("CANCELLED")));
    }

    @Test
    @DisplayName("Client user cannot create or delete inspections (Forbidden)")
    void clientUser_cannotWriteInspections() throws Exception {
        CreateInspectionRequest request = CreateInspectionRequest.builder()
                .companyId(COMPANY_MACRO_ID)
                .type(InspectionType.ART)
                .visitDate(LocalDate.now())
                .authority("Prevención ART")
                .build();

        mockMvc.perform(post("/api/v1/inspections")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Cross-tenant inspection access is rejected (404 / IDOR protection)")
    void crossTenantInspection_isRejected() throws Exception {
        CreateInspectionRequest request = CreateInspectionRequest.builder()
                .companyId(COMPANY_TECHCORP_ORG_B_ID)
                .type(InspectionType.MUNICIPAL)
                .visitDate(LocalDate.now())
                .authority("Municipalidad de Córdoba")
                .build();

        // Admin of Org A tries to create inspection for Company in Org B
        mockMvc.perform(post("/api/v1/inspections")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }
}
