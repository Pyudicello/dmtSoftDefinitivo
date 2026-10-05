package com.prevenia.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prevenia.auth.api.dto.LoginRequest;
import com.prevenia.auth.api.dto.LoginResponse;
import com.prevenia.company.api.dto.CreateCompanyRequest;
import com.prevenia.user.api.dto.CreateUserRequest;
import com.prevenia.user.domain.UserRole;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class MultiTenantSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // Seed Data Identifiers
    private static final String ORG_A_ID = "11111111-1111-1111-1111-111111111111";
    private static final String ORG_B_ID = "11111111-1111-1111-1111-111111111112";

    private static final String COMPANY_MACRO_ID = "33333333-3333-3333-3333-333333333331";
    private static final String COMPANY_ANDREANI_ID = "33333333-3333-3333-3333-333333333332";
    private static final String COMPANY_COCA_COLA_ID = "33333333-3333-3333-3333-333333333333";
    private static final String COMPANY_ORG_B_ID = "33333333-3333-3333-3333-333333333334";

    private static final String USER_CARLOS_ID = "22222222-2222-2222-2222-222222222222";
    private static final String USER_CLIENT_MACRO_ID = "22222222-2222-2222-2222-222222222224";
    private static final String USER_ADMIN_B_ID = "22222222-2222-2222-2222-222222222225";

    private String loginAndGetToken(String email, String password) throws Exception {
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
    @Order(1)
    @DisplayName("01. Request without token returns 401 Unauthorized")
    void test01_UnauthenticatedRequest_Returns401() throws Exception {
        mockMvc.perform(get("/api/v1/companies"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
    }

    @Test
    @Order(2)
    @DisplayName("02. Admin A (CONSULTANT_ADMIN) lists all 3 companies in Organization A")
    void test02_AdminA_CanListAllCompaniesInOrgA() throws Exception {
        String token = loginAndGetToken("admin@demo.com", "Demo1234!");

        mockMvc.perform(get("/api/v1/companies")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(3)))
                .andExpect(jsonPath("$.content[*].businessName", hasItem("Banco Macro")))
                .andExpect(jsonPath("$.content[*].businessName", hasItem("Andreani")))
                .andExpect(jsonPath("$.content[*].businessName", hasItem("Coca-Cola Andina")))
                .andExpect(jsonPath("$.content[*].businessName", not(hasItem("TechCorp Norte"))));
    }

    @Test
    @Order(3)
    @DisplayName("03. Technician Carlos lists only assigned companies (Macro, Andreani) and NOT Coca-Cola")
    void test03_TechnicianCarlos_CanListOnlyAssignedCompanies() throws Exception {
        String token = loginAndGetToken("carlos@demo.com", "Demo1234!");

        mockMvc.perform(get("/api/v1/companies")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[*].businessName", hasItem("Banco Macro")))
                .andExpect(jsonPath("$.content[*].businessName", hasItem("Andreani")))
                .andExpect(jsonPath("$.content[*].businessName", not(hasItem("Coca-Cola Andina"))))
                .andExpect(jsonPath("$.content[*].businessName", not(hasItem("TechCorp Norte"))));
    }

    @Test
    @Order(4)
    @DisplayName("04. Client Macro lists only its own assigned company (Banco Macro)")
    void test04_ClientMacro_CanListOnlyOwnCompany() throws Exception {
        String token = loginAndGetToken("macro@demo.com", "Demo1234!");

        mockMvc.perform(get("/api/v1/companies")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].businessName").value("Banco Macro"));
    }

    @Test
    @Order(5)
    @DisplayName("05. Technician Carlos accessing assigned company (Macro) returns 200 OK")
    void test05_TechnicianCarlos_GetAssignedCompany_Returns200() throws Exception {
        String token = loginAndGetToken("carlos@demo.com", "Demo1234!");

        mockMvc.perform(get("/api/v1/companies/" + COMPANY_MACRO_ID)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(COMPANY_MACRO_ID))
                .andExpect(jsonPath("$.businessName").value("Banco Macro"));
    }

    @Test
    @Order(6)
    @DisplayName("06. Technician Carlos accessing unassigned company (Coca-Cola) returns 404 (IDOR Protection)")
    void test06_TechnicianCarlos_GetUnassignedCompany_Returns404() throws Exception {
        String token = loginAndGetToken("carlos@demo.com", "Demo1234!");

        mockMvc.perform(get("/api/v1/companies/" + COMPANY_COCA_COLA_ID)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    @Order(7)
    @DisplayName("07. Client Macro accessing own company returns 200 OK")
    void test07_ClientMacro_GetOwnCompany_Returns200() throws Exception {
        String token = loginAndGetToken("macro@demo.com", "Demo1234!");

        mockMvc.perform(get("/api/v1/companies/" + COMPANY_MACRO_ID)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(COMPANY_MACRO_ID))
                .andExpect(jsonPath("$.businessName").value("Banco Macro"));
    }

    @Test
    @Order(8)
    @DisplayName("08. Client Macro accessing another company (Andreani) returns 404 (IDOR Protection)")
    void test08_ClientMacro_GetOtherCompany_Returns404() throws Exception {
        String token = loginAndGetToken("macro@demo.com", "Demo1234!");

        mockMvc.perform(get("/api/v1/companies/" + COMPANY_ANDREANI_ID)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    @Order(9)
    @DisplayName("09. Cross-Tenant Protection: Admin A accessing Company B from Org B returns 404")
    void test09_AdminA_CannotAccessOrgBCompany_Returns404() throws Exception {
        String token = loginAndGetToken("admin@demo.com", "Demo1234!");

        mockMvc.perform(get("/api/v1/companies/" + COMPANY_ORG_B_ID)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    @Order(10)
    @DisplayName("10. Cross-Tenant Protection: Technician Carlos accessing Company B returns 404")
    void test10_TechnicianCarlos_CannotAccessOrgBCompany_Returns404() throws Exception {
        String token = loginAndGetToken("carlos@demo.com", "Demo1234!");

        mockMvc.perform(get("/api/v1/companies/" + COMPANY_ORG_B_ID)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    @Order(11)
    @DisplayName("11. Consultant Admin can create a new company in own organization")
    void test11_ConsultantAdmin_CanCreateCompanyInOwnOrg() throws Exception {
        String token = loginAndGetToken("admin@demo.com", "Demo1234!");

        CreateCompanyRequest request = CreateCompanyRequest.builder()
                .businessName("Fábrica Textil Córdoba")
                .legalName("Textil CBA S.A.")
                .taxId("30-77889900-1")
                .address("Parque Industrial Este")
                .city("Córdoba")
                .province("Córdoba")
                .country("AR")
                .email("contacto@textilcba.com")
                .build();

        mockMvc.perform(post("/api/v1/companies")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.businessName").value("Fábrica Textil Córdoba"))
                .andExpect(jsonPath("$.organizationId").value(ORG_A_ID));
    }

    @Test
    @Order(12)
    @DisplayName("12. Technician cannot create companies (403 Forbidden)")
    void test12_Technician_CannotCreateCompany_Returns403() throws Exception {
        String token = loginAndGetToken("carlos@demo.com", "Demo1234!");

        CreateCompanyRequest request = CreateCompanyRequest.builder()
                .businessName("Empresa Ilegal")
                .build();

        mockMvc.perform(post("/api/v1/companies")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    @Order(13)
    @DisplayName("13. Client cannot create companies (403 Forbidden)")
    void test13_Client_CannotCreateCompany_Returns403() throws Exception {
        String token = loginAndGetToken("macro@demo.com", "Demo1234!");

        CreateCompanyRequest request = CreateCompanyRequest.builder()
                .businessName("Empresa Cliente Ilegal")
                .build();

        mockMvc.perform(post("/api/v1/companies")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    @Order(14)
    @DisplayName("14. Consultant Admin can create a new technician user in own organization")
    void test14_ConsultantAdmin_CanCreateTechnicianInOwnOrg() throws Exception {
        String token = loginAndGetToken("admin@demo.com", "Demo1234!");

        CreateUserRequest request = CreateUserRequest.builder()
                .firstName("Lucas")
                .lastName("Mendez")
                .email("lucas.tech@demo.com")
                .password("SecurePass123!")
                .role(UserRole.TECHNICIAN)
                .build();

        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.email").value("lucas.tech@demo.com"))
                .andExpect(jsonPath("$.role").value("TECHNICIAN"))
                .andExpect(jsonPath("$.organizationId").value(ORG_A_ID));
    }

    @Test
    @Order(15)
    @DisplayName("15. Consultant Admin cannot create a PLATFORM_ADMIN (403 Forbidden)")
    void test15_ConsultantAdmin_CannotCreatePlatformAdmin_Returns403() throws Exception {
        String token = loginAndGetToken("admin@demo.com", "Demo1234!");

        CreateUserRequest request = CreateUserRequest.builder()
                .firstName("Hacker")
                .lastName("Admin")
                .email("hacker@demo.com")
                .password("SecurePass123!")
                .role(UserRole.PLATFORM_ADMIN)
                .build();

        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    @Order(16)
    @DisplayName("16. Technician cannot create users (403 Forbidden)")
    void test16_Technician_CannotCreateUser_Returns403() throws Exception {
        String token = loginAndGetToken("carlos@demo.com", "Demo1234!");

        CreateUserRequest request = CreateUserRequest.builder()
                .firstName("Fake")
                .lastName("User")
                .email("fake@demo.com")
                .password("SecurePass123!")
                .role(UserRole.TECHNICIAN)
                .build();

        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(17)
    @DisplayName("17. Client cannot create users (403 Forbidden)")
    void test17_Client_CannotCreateUser_Returns403() throws Exception {
        String token = loginAndGetToken("macro@demo.com", "Demo1234!");

        CreateUserRequest request = CreateUserRequest.builder()
                .firstName("Fake")
                .lastName("Client")
                .email("fakeclient@demo.com")
                .password("SecurePass123!")
                .role(UserRole.CLIENT)
                .build();

        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(18)
    @DisplayName("18. Consultant Admin can assign technician Carlos to Coca-Cola")
    void test18_ConsultantAdmin_CanAssignTechnicianToCompany() throws Exception {
        String token = loginAndGetToken("admin@demo.com", "Demo1234!");

        mockMvc.perform(post("/api/v1/companies/" + COMPANY_COCA_COLA_ID + "/technicians/" + USER_CARLOS_ID)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated());

        // Now Carlos can access Coca-Cola
        String carlosToken = loginAndGetToken("carlos@demo.com", "Demo1234!");
        mockMvc.perform(get("/api/v1/companies/" + COMPANY_COCA_COLA_ID)
                        .header("Authorization", "Bearer " + carlosToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(COMPANY_COCA_COLA_ID));
    }

    @Test
    @Order(19)
    @DisplayName("19. Cross-Tenant Assignment Prevention: Admin A cannot assign a technician from Org B")
    void test19_ConsultantAdmin_CannotAssignTechnicianFromOtherOrg() throws Exception {
        String token = loginAndGetToken("admin@demo.com", "Demo1234!");

        mockMvc.perform(post("/api/v1/companies/" + COMPANY_MACRO_ID + "/technicians/" + USER_ADMIN_B_ID)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    @Order(20)
    @DisplayName("20. Role Assignment Prevention: Cannot assign a CLIENT user as technician")
    void test20_ConsultantAdmin_CannotAssignClientAsTechnician() throws Exception {
        String token = loginAndGetToken("admin@demo.com", "Demo1234!");

        mockMvc.perform(post("/api/v1/companies/" + COMPANY_COCA_COLA_ID + "/technicians/" + USER_CLIENT_MACRO_ID)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_ASSIGNMENT"));
    }

    @Test
    @Order(21)
    @DisplayName("21. Consultant Admin can unassign technician Carlos from Andreani")
    void test21_ConsultantAdmin_CanUnassignTechnician() throws Exception {
        String token = loginAndGetToken("admin@demo.com", "Demo1234!");

        mockMvc.perform(delete("/api/v1/companies/" + COMPANY_ANDREANI_ID + "/technicians/" + USER_CARLOS_ID)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        // Now Carlos can no longer access Andreani
        String carlosToken = loginAndGetToken("carlos@demo.com", "Demo1234!");
        mockMvc.perform(get("/api/v1/companies/" + COMPANY_ANDREANI_ID)
                        .header("Authorization", "Bearer " + carlosToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(22)
    @DisplayName("22. Platform Admin has global visibility across all organizations and companies")
    void test22_PlatformAdmin_CanViewAllOrganizationsAndCompanies() throws Exception {
        String token = loginAndGetToken("platform@prevenia.com", "Admin1234!");

        // Platform admin can list all organizations
        mockMvc.perform(get("/api/v1/organizations")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)));

        // Platform admin can access company in Org B directly
        mockMvc.perform(get("/api/v1/companies/" + COMPANY_ORG_B_ID)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(COMPANY_ORG_B_ID))
                .andExpect(jsonPath("$.businessName").value("TechCorp Norte"));
    }
}
