package com.prevenia.expiration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.prevenia.auth.api.dto.LoginRequest;
import com.prevenia.auth.api.dto.LoginResponse;
import com.prevenia.expiration.api.dto.CancelExpirationRequest;
import com.prevenia.expiration.api.dto.CompleteExpirationRequest;
import com.prevenia.expiration.api.dto.CreateCategoryRequest;
import com.prevenia.expiration.api.dto.CreateExpirationRequest;
import com.prevenia.expiration.api.dto.UpdateExpirationRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "spring.datasource.url=jdbc:h2:mem:expiration_sec_test;DB_CLOSE_DELAY=-1;MODE=PostgreSQL")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class ExpirationSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // Known Seed IDs from V1, V2 and V3
    private static final UUID ORG_A_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID ORG_B_ID = UUID.fromString("11111111-1111-1111-1111-111111111112");

    private static final UUID COMPANY_MACRO_ID = UUID.fromString("33333333-3333-3333-3333-333333333331");
    private static final UUID COMPANY_ANDREANI_ID = UUID.fromString("33333333-3333-3333-3333-333333333332");
    private static final UUID COMPANY_COCA_COLA_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private static final UUID COMPANY_TECHCORP_ORG_B_ID = UUID.fromString("33333333-3333-3333-3333-333333333334");

    private static final UUID USER_CARLOS_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID USER_MARTIN_ID = UUID.fromString("22222222-2222-2222-2222-222222222223");

    private static final UUID CAT_MATAFUEGOS_ID = UUID.fromString("a0000000-0000-0000-0000-000000000001");
    private static final UUID CAT_CAPACITACION_ID = UUID.fromString("a0000000-0000-0000-0000-000000000002");


    // Expiration seeds
    private static final UUID EXP_MACRO_MATAFUEGOS_ID = UUID.fromString("44444444-4444-4444-4444-444444444441"); // Past (2026-09-08)
    private static final UUID EXP_MACRO_CAPACITACION_ID = UUID.fromString("44444444-4444-4444-4444-444444444442"); // Today (2026-09-09)
    private static final UUID EXP_MACRO_ART_ID = UUID.fromString("44444444-4444-4444-4444-444444444443"); // +6 days (2026-09-15)
    private static final UUID EXP_MACRO_ASCENSOR_COMPLETED_ID = UUID.fromString("44444444-4444-4444-4444-444444444446"); // Completed
    private static final UUID EXP_ANDREANI_AUTOELEVADOR_ID = UUID.fromString("44444444-4444-4444-4444-444444444447"); // +3 days
    private static final UUID EXP_COCA_COLA_SIMULACRO_ID = UUID.fromString("44444444-4444-4444-4444-444444444449"); // Martin assigned
    private static final UUID EXP_TECHCORP_ORG_B_ID = UUID.fromString("44444444-4444-4444-4444-444444444450"); // Org B

    private String platformAdminToken;
    private String consultantAdminAToken;
    private String consultantAdminBToken;
    private String technicianCarlosToken;
    private String technicianMartinToken;
    private String clientMacroToken;

    @BeforeEach
    void setUpTokens() throws Exception {
        platformAdminToken = loginAndGetToken("platform@prevenia.com", "Admin1234!");
        consultantAdminAToken = loginAndGetToken("admin@demo.com", "Demo1234!");
        consultantAdminBToken = loginAndGetToken("admin.b@demo.com", "Demo1234!");
        technicianCarlosToken = loginAndGetToken("carlos@demo.com", "Demo1234!");
        technicianMartinToken = loginAndGetToken("martin@demo.com", "Demo1234!");
        clientMacroToken = loginAndGetToken("macro@demo.com", "Demo1234!");
    }

    private String loginAndGetToken(String email, String password) throws Exception {
        LoginRequest request = LoginRequest.builder().email(email).password(password).build();
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();
        LoginResponse response = objectMapper.readValue(result.getResponse().getContentAsString(), LoginResponse.class);
        return response.getAccessToken();
    }

    @Test
    @Order(1)
    @DisplayName("1. Unauthenticated request to /api/v1/expirations must return 401 Unauthorized")
    void testUnauthenticatedAccessReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/expirations"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", is("UNAUTHORIZED")));
    }

    @Test
    @Order(2)
    @DisplayName("2. CONSULTANT_ADMIN (Org A) can list all expirations in Org A (Macro, Andreani, Coca-Cola)")
    void testConsultantAdminListsAllOrgExpirations() throws Exception {
        mockMvc.perform(get("/api/v1/expirations")
                        .header("Authorization", "Bearer " + consultantAdminAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(8))))
                .andExpect(jsonPath("$.content[*].company.id", hasItem(COMPANY_MACRO_ID.toString())))
                .andExpect(jsonPath("$.content[*].company.id", hasItem(COMPANY_ANDREANI_ID.toString())))
                .andExpect(jsonPath("$.content[*].company.id", hasItem(COMPANY_COCA_COLA_ID.toString())))
                .andExpect(jsonPath("$.content[*].company.id", not(hasItem(COMPANY_TECHCORP_ORG_B_ID.toString()))));
    }

    @Test
    @Order(3)
    @DisplayName("3. TECHNICIAN Carlos (assigned to Macro and Andreani) sees ONLY Macro and Andreani expirations")
    void testTechnicianCarlosSeesOnlyAssignedCompaniesExpirations() throws Exception {
        mockMvc.perform(get("/api/v1/expirations")
                        .header("Authorization", "Bearer " + technicianCarlosToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].company.id", hasItem(COMPANY_MACRO_ID.toString())))
                .andExpect(jsonPath("$.content[*].company.id", hasItem(COMPANY_ANDREANI_ID.toString())))
                .andExpect(jsonPath("$.content[*].company.id", not(hasItem(COMPANY_COCA_COLA_ID.toString()))))
                .andExpect(jsonPath("$.content[*].company.id", not(hasItem(COMPANY_TECHCORP_ORG_B_ID.toString()))));
    }

    @Test
    @Order(4)
    @DisplayName("4. TECHNICIAN Martin (assigned to Coca-Cola) sees ONLY Coca-Cola expirations")
    void testTechnicianMartinSeesOnlyCocaColaExpirations() throws Exception {
        mockMvc.perform(get("/api/v1/expirations")
                        .header("Authorization", "Bearer " + technicianMartinToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].company.id", hasItem(COMPANY_COCA_COLA_ID.toString())))
                .andExpect(jsonPath("$.content[*].company.id", not(hasItem(COMPANY_MACRO_ID.toString()))))
                .andExpect(jsonPath("$.content[*].company.id", not(hasItem(COMPANY_ANDREANI_ID.toString()))));
    }

    @Test
    @Order(5)
    @DisplayName("5. CLIENT Macro sees ONLY Banco Macro expirations")
    void testClientMacroSeesOnlyOwnCompanyExpirations() throws Exception {
        mockMvc.perform(get("/api/v1/expirations")
                        .header("Authorization", "Bearer " + clientMacroToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].company.id", hasItem(COMPANY_MACRO_ID.toString())))
                .andExpect(jsonPath("$.content[*].company.id", not(hasItem(COMPANY_ANDREANI_ID.toString()))))
                .andExpect(jsonPath("$.content[*].company.id", not(hasItem(COMPANY_COCA_COLA_ID.toString()))));
    }

    @Test
    @Order(6)
    @DisplayName("6. TECHNICIAN Carlos can access assigned expiration by ID")
    void testTechnicianCanAccessAssignedExpirationById() throws Exception {
        mockMvc.perform(get("/api/v1/expirations/" + EXP_MACRO_MATAFUEGOS_ID)
                        .header("Authorization", "Bearer " + technicianCarlosToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(EXP_MACRO_MATAFUEGOS_ID.toString())))
                .andExpect(jsonPath("$.title", is("Recarga anual matafuegos sucursal Centro")))
                .andExpect(jsonPath("$.company.businessName", is("Banco Macro")))
                .andExpect(jsonPath("$.category.code", is("MATAFUEGOS")));
    }

    @Test
    @Order(7)
    @DisplayName("7. Anti-IDOR: TECHNICIAN Carlos attempting to access unassigned Coca-Cola expiration returns 404")
    void testTechnicianCannotAccessUnassignedExpirationById() throws Exception {
        mockMvc.perform(get("/api/v1/expirations/" + EXP_COCA_COLA_SIMULACRO_ID)
                        .header("Authorization", "Bearer " + technicianCarlosToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", is("RESOURCE_NOT_FOUND")));
    }

    @Test
    @Order(8)
    @DisplayName("8. CLIENT Macro can access own company expiration by ID")
    void testClientCanAccessOwnExpirationById() throws Exception {
        mockMvc.perform(get("/api/v1/expirations/" + EXP_MACRO_MATAFUEGOS_ID)
                        .header("Authorization", "Bearer " + clientMacroToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(EXP_MACRO_MATAFUEGOS_ID.toString())));
    }

    @Test
    @Order(9)
    @DisplayName("9. Anti-IDOR: CLIENT Macro attempting to access Andreani expiration returns 404")
    void testClientCannotAccessOtherCompanyExpirationById() throws Exception {
        mockMvc.perform(get("/api/v1/expirations/" + EXP_ANDREANI_AUTOELEVADOR_ID)
                        .header("Authorization", "Bearer " + clientMacroToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", is("RESOURCE_NOT_FOUND")));
    }

    @Test
    @Order(10)
    @DisplayName("10. Cross-Tenant: Admin Org A attempting to access Org B expiration returns 404")
    void testCrossTenantAccessReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/expirations/" + EXP_TECHCORP_ORG_B_ID)
                        .header("Authorization", "Bearer " + consultantAdminAToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", is("RESOURCE_NOT_FOUND")));
    }

    @Test
    @Order(11)
    @DisplayName("11. CONSULTANT_ADMIN can create expiration for company in own organization")
    void testConsultantAdminCanCreateExpirationInOwnOrg() throws Exception {
        CreateExpirationRequest request = CreateExpirationRequest.builder()
                .companyId(COMPANY_MACRO_ID)
                .categoryId(CAT_CAPACITACION_ID)
                .title("Capacitación RCP y Primeros Auxilios")
                .description("Entrenamiento práctico con maniquíes homologados")
                .issueDate(LocalDate.of(2026, 9, 1))
                .expirationDate(LocalDate.of(2026, 11, 15))
                .responsibleUserId(USER_CARLOS_ID)
                .notificationDaysBefore(30)
                .notes("Duración 4 horas")
                .build();

        mockMvc.perform(post("/api/v1/expirations")
                        .header("Authorization", "Bearer " + consultantAdminAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title", is("Capacitación RCP y Primeros Auxilios")))
                .andExpect(jsonPath("$.lifecycleStatus", is("ACTIVE")))
                .andExpect(jsonPath("$.company.id", is(COMPANY_MACRO_ID.toString())))
                .andExpect(jsonPath("$.responsible.id", is(USER_CARLOS_ID.toString())));
    }

    @Test
    @Order(12)
    @DisplayName("12. CONSULTANT_ADMIN Org A cannot create expiration in Org B company (404)")
    void testConsultantAdminCannotCreateExpirationInForeignOrgCompany() throws Exception {
        CreateExpirationRequest request = CreateExpirationRequest.builder()
                .companyId(COMPANY_TECHCORP_ORG_B_ID)
                .categoryId(CAT_MATAFUEGOS_ID)
                .title("Intento indebido en Org B")
                .expirationDate(LocalDate.of(2026, 12, 1))
                .build();

        mockMvc.perform(post("/api/v1/expirations")
                        .header("Authorization", "Bearer " + consultantAdminAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(13)
    @DisplayName("13. TECHNICIAN Carlos can create expiration in assigned company (Banco Macro)")
    void testTechnicianCanCreateExpirationInAssignedCompany() throws Exception {
        CreateExpirationRequest request = CreateExpirationRequest.builder()
                .companyId(COMPANY_MACRO_ID)
                .categoryId(CAT_MATAFUEGOS_ID)
                .title("Revisión de detectores de humo sucursal Norte")
                .expirationDate(LocalDate.of(2026, 10, 5))
                .responsibleUserId(USER_CARLOS_ID)
                .build();

        mockMvc.perform(post("/api/v1/expirations")
                        .header("Authorization", "Bearer " + technicianCarlosToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title", is("Revisión de detectores de humo sucursal Norte")));
    }

    @Test
    @Order(14)
    @DisplayName("14. TECHNICIAN Carlos cannot create expiration in unassigned company (Coca-Cola) -> 404")
    void testTechnicianCannotCreateExpirationInUnassignedCompany() throws Exception {
        CreateExpirationRequest request = CreateExpirationRequest.builder()
                .companyId(COMPANY_COCA_COLA_ID)
                .categoryId(CAT_MATAFUEGOS_ID)
                .title("Revisión no autorizada")
                .expirationDate(LocalDate.of(2026, 10, 5))
                .build();

        mockMvc.perform(post("/api/v1/expirations")
                        .header("Authorization", "Bearer " + technicianCarlosToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(15)
    @DisplayName("15. CLIENT cannot create expiration -> 403 Forbidden")
    void testClientCannotCreateExpiration() throws Exception {
        CreateExpirationRequest request = CreateExpirationRequest.builder()
                .companyId(COMPANY_MACRO_ID)
                .categoryId(CAT_MATAFUEGOS_ID)
                .title("Intento de cliente")
                .expirationDate(LocalDate.of(2026, 10, 5))
                .build();

        mockMvc.perform(post("/api/v1/expirations")
                        .header("Authorization", "Bearer " + clientMacroToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(16)
    @DisplayName("16. CLIENT cannot complete, cancel, or delete expirations -> 403 Forbidden")
    void testClientCannotModifyLifecycle() throws Exception {
        mockMvc.perform(post("/api/v1/expirations/" + EXP_MACRO_MATAFUEGOS_ID + "/complete")
                        .header("Authorization", "Bearer " + clientMacroToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/expirations/" + EXP_MACRO_MATAFUEGOS_ID + "/cancel")
                        .header("Authorization", "Bearer " + clientMacroToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/v1/expirations/" + EXP_MACRO_MATAFUEGOS_ID)
                        .header("Authorization", "Bearer " + clientMacroToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(17)
    @DisplayName("17. Complete expiration: POST /complete marks as COMPLETED and sets completedAt")
    void testCompleteExpirationWorkflow() throws Exception {
        CompleteExpirationRequest request = CompleteExpirationRequest.builder()
                .notes("Recarga completada satisfactoriamente con certificado nº 8492")
                .build();

        mockMvc.perform(post("/api/v1/expirations/" + EXP_MACRO_ART_ID + "/complete")
                        .header("Authorization", "Bearer " + technicianCarlosToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lifecycleStatus", is("COMPLETED")))
                .andExpect(jsonPath("$.deadlineStatus", nullValue()))
                .andExpect(jsonPath("$.completionNotes", containsString("8492")));
    }

    @Test
    @Order(18)
    @DisplayName("18. Cancel expiration: POST /cancel marks as CANCELLED and sets cancelReason")
    void testCancelExpirationWorkflow() throws Exception {
        CancelExpirationRequest request = CancelExpirationRequest.builder()
                .reason("Carga duplicada por error administrativo")
                .build();

        mockMvc.perform(post("/api/v1/expirations/" + EXP_ANDREANI_AUTOELEVADOR_ID + "/cancel")
                        .header("Authorization", "Bearer " + consultantAdminAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lifecycleStatus", is("CANCELLED")))
                .andExpect(jsonPath("$.deadlineStatus", nullValue()))
                .andExpect(jsonPath("$.cancelReason", containsString("duplicada")));
    }

    @Test
    @Order(19)
    @DisplayName("19. Filter between dates: from=2026-09-08 and to=2026-09-10 returns matching records")
    void testDateFilteringBetween() throws Exception {
        mockMvc.perform(get("/api/v1/expirations?from=2026-09-08&to=2026-09-10")
                        .header("Authorization", "Bearer " + consultantAdminAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    @Order(20)
    @DisplayName("20. GET /api/v1/companies/{companyId}/expirations returns company expirations with tenant checks")
    void testGetCompanyExpirationsEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/companies/" + COMPANY_MACRO_ID + "/expirations")
                        .header("Authorization", "Bearer " + consultantAdminAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].company.id", hasItem(COMPANY_MACRO_ID.toString())))
                .andExpect(jsonPath("$.content[*].company.id", not(hasItem(COMPANY_ANDREANI_ID.toString()))));
    }

    @Test
    @Order(21)
    @DisplayName("21. Category CRUD: Consultant Admin creates custom category, duplicate code throws 409 Conflict")
    void testCategoryCreationAndUniqueness() throws Exception {
        CreateCategoryRequest request = CreateCategoryRequest.builder()
                .code("CALDERAS")
                .name("Inspección de Calderas")
                .description("Control de presión y válvulas de seguridad de calderas")
                .icon("flame")
                .colorCode("#E11D48")
                .build();

        // 1. Create successfully
        mockMvc.perform(post("/api/v1/expiration-categories")
                        .header("Authorization", "Bearer " + consultantAdminAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code", is("CALDERAS")))
                .andExpect(jsonPath("$.organizationId", is(ORG_A_ID.toString())));

        // 2. Duplicate code in same Org A -> 409 Conflict
        mockMvc.perform(post("/api/v1/expiration-categories")
                        .header("Authorization", "Bearer " + consultantAdminAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error", is("DUPLICATE_RESOURCE")));

        // 3. Technician cannot create categories -> 403 Forbidden
        mockMvc.perform(post("/api/v1/expiration-categories")
                        .header("Authorization", "Bearer " + technicianCarlosToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(22)
    @DisplayName("22. Validation: issueDate after expirationDate throws 400 Bad Request")
    void testIssueDateAfterExpirationDateValidation() throws Exception {
        CreateExpirationRequest request = CreateExpirationRequest.builder()
                .companyId(COMPANY_MACRO_ID)
                .categoryId(CAT_MATAFUEGOS_ID)
                .title("Fecha Inválida Test")
                .issueDate(LocalDate.of(2026, 10, 20))
                .expirationDate(LocalDate.of(2026, 10, 10)) // Before issueDate
                .build();

        mockMvc.perform(post("/api/v1/expirations")
                        .header("Authorization", "Bearer " + consultantAdminAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("INVALID_EXPIRATION_DATE")));
    }
}
