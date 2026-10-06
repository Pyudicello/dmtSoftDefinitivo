package com.prevenia.shared.infrastructure.bootstrap;

import com.prevenia.assignment.domain.UserCompanyAssignment;
import com.prevenia.assignment.domain.UserCompanyAssignmentRepository;
import com.prevenia.company.domain.Company;
import com.prevenia.company.domain.CompanyRepository;
import com.prevenia.company.domain.CompanyStatus;
import com.prevenia.expiration.domain.Expiration;
import com.prevenia.expiration.domain.ExpirationCategory;
import com.prevenia.expiration.domain.ExpirationCategoryRepository;
import com.prevenia.expiration.domain.ExpirationLifecycleStatus;
import com.prevenia.expiration.domain.ExpirationRepository;
import com.prevenia.expiration.domain.RecurrenceType;
import com.prevenia.inspection.domain.Inspection;
import com.prevenia.inspection.domain.InspectionRepository;
import com.prevenia.inspection.domain.InspectionType;
import com.prevenia.organization.domain.Organization;
import com.prevenia.organization.domain.OrganizationRepository;
import com.prevenia.organization.domain.OrganizationStatus;
import com.prevenia.permit.domain.Permit;
import com.prevenia.permit.domain.PermitRepository;
import com.prevenia.permit.domain.PermitStatus;
import com.prevenia.permit.domain.PermitType;
import com.prevenia.user.domain.User;
import com.prevenia.user.domain.UserRepository;
import com.prevenia.user.domain.UserRole;
import com.prevenia.user.domain.UserStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class DemoDataBootstrapRunner implements CommandLineRunner {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final ExpirationCategoryRepository categoryRepository;
    private final ExpirationRepository expirationRepository;
    private final UserCompanyAssignmentRepository assignmentRepository;
    private final InspectionRepository inspectionRepository;
    private final PermitRepository permitRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        // Only run demo seeder if there are no companies in database yet
        if (companyRepository.count() > 0) {
            log.debug("Demo data already seeded. Skipping.");
            return;
        }

        log.info("Seeding initial demo dataset for DMT-Soft platform...");

        // 1. Root Organization
        Organization rootOrg = organizationRepository.findAll().stream().findFirst()
                .orElseGet(() -> {
                    Organization org = Organization.builder()
                            .name("Consultora DMT-Soft Integral")
                            .email("contacto@dmtsoft.com")
                            .status(OrganizationStatus.ACTIVE)
                            .build();
                    return organizationRepository.save(org);
                });

        // 2. Demo Users
        String encodedPass = passwordEncoder.encode("Demo1234!");
        String encodedJulioPass = passwordEncoder.encode("julio.Rodriguez27");

        User julioAdmin = getOrCreateUser(null, "juliorodriguez@dmtsoft.com", "Julio", "Rodríguez", UserRole.PLATFORM_ADMIN, encodedJulioPass);
        User adminUser = getOrCreateUser(rootOrg.getId(), "admin@demo.com", "Martín", "Gómez", UserRole.CONSULTANT_ADMIN, encodedPass);
        User carlosTech = getOrCreateUser(rootOrg.getId(), "carlos@demo.com", "Carlos", "Técnico", UserRole.TECHNICIAN, encodedPass);
        User macroClient = getOrCreateUser(rootOrg.getId(), "macro@demo.com", "Javier", "Macro", UserRole.CLIENT, encodedPass);

        // 3. Categories
        ExpirationCategory catExtintores = getOrCreateCategory(rootOrg.getId(), "EXTINTORES", "Matafuegos y Extintores", "Recarga y control periódico de extintores", "shield-alert", "#ef4444");
        ExpirationCategory catCapacitacion = getOrCreateCategory(rootOrg.getId(), "CAPACITACIONES", "Capacitaciones y Simulacros", "Plan anual de capacitación y simulacros de evacuación", "users", "#3b82f6");
        ExpirationCategory catHabilitacion = getOrCreateCategory(rootOrg.getId(), "HABILITACIONES", "Habilitaciones y Bomberos", "Habilitación municipal, final de obra y bomberos", "file-check", "#10b981");
        ExpirationCategory catArt = getOrCreateCategory(rootOrg.getId(), "ART", "Seguros y Cobertura ART", "Certificado de cobertura de ART con cláusula de no repetición", "shield-check", "#8b5cf6");
        ExpirationCategory catMediciones = getOrCreateCategory(rootOrg.getId(), "MEDICIONES", "Protocolos de Ruido e Iluminación", "Protocolos SRT de medición de contaminantes", "activity", "#f59e0b");
        ExpirationCategory catPat = getOrCreateCategory(rootOrg.getId(), "PAT", "Puesta a Tierra y Termografía", "Medición de resistencia y continuidad de PAT (Res. 900/15)", "zap", "#06b6d4");

        // 4. Companies
        Company acme = companyRepository.save(Company.builder()
                .organizationId(rootOrg.getId())
                .businessName("Acme Metalúrgica S.A.")
                .legalName("Acme Metalúrgica Sociedad Anónima")
                .taxId("30-71234567-8")
                .address("Av. Calchaquí 1250")
                .city("Quilmes")
                .province("Buenos Aires")
                .country("AR")
                .email("seguridad@acmemetal.com")
                .phone("+54 11 4253-9000")
                .status(CompanyStatus.ACTIVE)
                .build());

        Company logisticaSur = companyRepository.save(Company.builder()
                .organizationId(rootOrg.getId())
                .businessName("Logística del Sur S.R.L.")
                .legalName("Logística del Sur Sociedad de Responsabilidad Limitada")
                .taxId("30-68912345-4")
                .address("Av. Amancio Alcorta 3400")
                .city("CABA")
                .province("Buenos Aires")
                .country("AR")
                .email("operaciones@logdelsur.com")
                .phone("+54 11 4912-4400")
                .status(CompanyStatus.ACTIVE)
                .build());

        Company bioSalud = companyRepository.save(Company.builder()
                .organizationId(rootOrg.getId())
                .businessName("Laboratorios BioSalud S.A.")
                .legalName("BioSalud Laboratorios Farmacéuticos S.A.")
                .taxId("30-55443322-1")
                .address("Juramento 2100")
                .city("CABA")
                .province("Buenos Aires")
                .country("AR")
                .email("calidad@biosaludlab.com")
                .phone("+54 11 4781-5500")
                .status(CompanyStatus.ACTIVE)
                .build());

        Company horizonte = companyRepository.save(Company.builder()
                .organizationId(rootOrg.getId())
                .businessName("Constructora Horizonte S.A.")
                .legalName("Horizonte Obras Civiles e Ingeniería S.A.")
                .taxId("30-89127634-9")
                .address("Ruta 8 Km 50")
                .city("Pilar")
                .province("Buenos Aires")
                .country("AR")
                .email("obras@horizonteconst.com")
                .phone("+54 230 442-8800")
                .status(CompanyStatus.ACTIVE)
                .build());

        // Update Macro user to be assigned to Acme
        macroClient.setCompanyId(acme.getId());
        userRepository.save(macroClient);

        // Assign Carlos to Acme and Logística del Sur
        assignmentRepository.save(UserCompanyAssignment.builder()
                .organizationId(rootOrg.getId())
                .userId(carlosTech.getId())
                .companyId(acme.getId())
                .active(true)
                .build());

        assignmentRepository.save(UserCompanyAssignment.builder()
                .organizationId(rootOrg.getId())
                .userId(carlosTech.getId())
                .companyId(logisticaSur.getId())
                .active(true)
                .build());

        // 5. Expirations across companies with realistic dates
        LocalDate today = LocalDate.now();

        // Expired (Red / Vencido)
        Expiration exp1 = expirationRepository.save(Expiration.builder()
                .organizationId(rootOrg.getId())
                .companyId(acme.getId())
                .categoryId(catExtintores.getId())
                .title("Recarga anual de 15 matafuegos ABC y CO2 (Sector Planta)")
                .description("Matafuegos ubicados en nave principal de corte y plegado. Requiere verificación de marbetes y prueba hidráulica.")
                .issueDate(today.minusYears(1).minusDays(5))
                .expirationDate(today.minusDays(5))
                .lifecycleStatus(ExpirationLifecycleStatus.ACTIVE)
                .responsibleUserId(carlosTech.getId())
                .recurrenceType(RecurrenceType.YEARLY)
                .notificationDaysBefore(30)
                .notes("Proveedor habitual: Extintores Quilmes S.A.")
                .build());

        // Urgent / Próximo 7 días (Naranja / Urgente)
        Expiration exp2 = expirationRepository.save(Expiration.builder()
                .organizationId(rootOrg.getId())
                .companyId(acme.getId())
                .categoryId(catCapacitacion.getId())
                .title("Simulacro de Evacuación y Plan de Contingencias (1er Semestre)")
                .description("Simulacro general con rol de llamadas y brigada contra incendios.")
                .issueDate(today.minusMonths(5))
                .expirationDate(today.plusDays(3))
                .lifecycleStatus(ExpirationLifecycleStatus.ACTIVE)
                .responsibleUserId(carlosTech.getId())
                .recurrenceType(RecurrenceType.SEMIANNUAL)
                .notificationDaysBefore(15)
                .notes("Coordinar con jefe de planta y guardia de seguridad.")
                .build());

        Expiration exp3 = expirationRepository.save(Expiration.builder()
                .organizationId(rootOrg.getId())
                .companyId(logisticaSur.getId())
                .categoryId(catArt.getId())
                .title("Certificado de Cobertura ART con Nómina y Cláusula de No Repetición")
                .description("Presentación obligatoria ante cliente para ingreso de choferes y operarios al centro logístico.")
                .issueDate(today.minusMonths(1))
                .expirationDate(today.plusDays(5))
                .lifecycleStatus(ExpirationLifecycleStatus.ACTIVE)
                .responsibleUserId(adminUser.getId())
                .recurrenceType(RecurrenceType.MONTHLY)
                .notificationDaysBefore(7)
                .build());

        // Upcoming / Próximos 30 días (Amarillo)
        Expiration exp4 = expirationRepository.save(Expiration.builder()
                .organizationId(rootOrg.getId())
                .companyId(acme.getId())
                .categoryId(catPat.getId())
                .title("Medición y Protocolo de Puesta a Tierra (Res. SRT 900/15)")
                .description("Medición anual con telurímetro calibrado en jabalinas principales y tableros seccionales.")
                .issueDate(today.minusYears(1).plusDays(15))
                .expirationDate(today.plusDays(15))
                .lifecycleStatus(ExpirationLifecycleStatus.ACTIVE)
                .responsibleUserId(carlosTech.getId())
                .recurrenceType(RecurrenceType.YEARLY)
                .notificationDaysBefore(30)
                .build());

        Expiration exp5 = expirationRepository.save(Expiration.builder()
                .organizationId(rootOrg.getId())
                .companyId(bioSalud.getId())
                .categoryId(catHabilitacion.getId())
                .title("Renovación de Certificado de Aptitud Ambiental y Bomberos")
                .description("Inspección de cuartel de bomberos voluntarios y pago de tasas correspondientes.")
                .issueDate(today.minusYears(2).plusDays(22))
                .expirationDate(today.plusDays(22))
                .lifecycleStatus(ExpirationLifecycleStatus.ACTIVE)
                .responsibleUserId(adminUser.getId())
                .recurrenceType(RecurrenceType.YEARLY)
                .notificationDaysBefore(60)
                .build());

        // Current / Vigente (Verde)
        Expiration exp6 = expirationRepository.save(Expiration.builder()
                .organizationId(rootOrg.getId())
                .companyId(horizonte.getId())
                .categoryId(catMediciones.getId())
                .title("Protocolo de Medición de Ruido Laboral (Res. SRT 85/12)")
                .description("Dosimetría y sonometría en obra Torre Libertador en horario de hormigonado.")
                .issueDate(today.minusMonths(2))
                .expirationDate(today.plusDays(65))
                .lifecycleStatus(ExpirationLifecycleStatus.ACTIVE)
                .responsibleUserId(carlosTech.getId())
                .recurrenceType(RecurrenceType.YEARLY)
                .notificationDaysBefore(30)
                .build());

        Expiration exp7 = expirationRepository.save(Expiration.builder()
                .organizationId(rootOrg.getId())
                .companyId(acme.getId())
                .categoryId(catMediciones.getId())
                .title("Estudio Ergonómico de Puestos de Trabajo (Res. 886/15)")
                .description("Planilla 1, 2 y 3 para puestos de operario de balancín y soldador.")
                .issueDate(today.minusMonths(3))
                .expirationDate(today.plusDays(90))
                .lifecycleStatus(ExpirationLifecycleStatus.ACTIVE)
                .responsibleUserId(carlosTech.getId())
                .recurrenceType(RecurrenceType.YEARLY)
                .notificationDaysBefore(30)
                .build());

        // Completed (Gris)
        Expiration exp8 = expirationRepository.save(Expiration.builder()
                .organizationId(rootOrg.getId())
                .companyId(acme.getId())
                .categoryId(catExtintores.getId())
                .title("Análisis Físico-Químico y Bacteriológico de Agua de Red")
                .description("Protocolo de potabilidad de agua según Código Alimentario Argentino.")
                .issueDate(today.minusMonths(6))
                .expirationDate(today.minusDays(10))
                .lifecycleStatus(ExpirationLifecycleStatus.COMPLETED)
                .responsibleUserId(carlosTech.getId())
                .recurrenceType(RecurrenceType.SEMIANNUAL)
                .completedAt(OffsetDateTime.now(ZoneOffset.UTC).minusDays(10))
                .completionNotes("Muestras analizadas por Laboratorio Químico Central. Resultados 100% aptos.")
                .build());

        // 6. Sample Inspections
        inspectionRepository.save(Inspection.builder()
                .organizationId(rootOrg.getId())
                .companyId(acme.getId())
                .expirationId(exp1.getId())
                .type(InspectionType.MUNICIPAL)
                .visitDate(today.minusDays(20))
                .authority("Dirección General de Habilitaciones e Inspecciones de Quilmes")
                .contactName("Inspector Roberto Varela")
                .contactPhone("+54 11 4253-1122")
                .contactEmail("inspecciones@quilmes.gob.ar")
                .result("Inspección aprobada con observaciones menores sobre señalización de salidas de emergencia.")
                .notes("Se otorgaron 30 días para regularizar extintores y señalética.")
                .nextVisitDate(today.plusDays(10))
                .build());

        inspectionRepository.save(Inspection.builder()
                .organizationId(rootOrg.getId())
                .companyId(logisticaSur.getId())
                .type(InspectionType.HYGIENE_SAFETY_SERVICE)
                .visitDate(today.minusDays(8))
                .authority("Auditoría Interna DMT-Soft")
                .contactName("Lic. Carlos Técnico")
                .contactPhone("+54 11 5555-1234")
                .result("Revisión de orden y limpieza en depósito de pallets y docks de carga.")
                .notes("Recomendado repintar sendas peatonales amarillas.")
                .build());

        // 7. Sample Permits
        permitRepository.save(Permit.builder()
                .organizationId(rootOrg.getId())
                .companyId(acme.getId())
                .expirationId(exp5.getId())
                .type(PermitType.MUNICIPAL)
                .issuingAuthority("Municipio de Quilmes")
                .permitNumber("HAB-2024-88492")
                .issueDate(today.minusYears(1))
                .expirationDate(today.plusMonths(11))
                .status(PermitStatus.ACTIVE)
                .contactName("Mesa de Entradas Habilitaciones")
                .notes("Habilitación comercial e industrial rubro metalúrgico.")
                .build());

        permitRepository.save(Permit.builder()
                .organizationId(rootOrg.getId())
                .companyId(bioSalud.getId())
                .type(PermitType.FIRE_DEPARTMENT)
                .issuingAuthority("Superintendencia Federal de Bomberos")
                .permitNumber("BOMB-2025-0412")
                .issueDate(today.minusYears(1).plusDays(22))
                .expirationDate(today.plusDays(22))
                .status(PermitStatus.ACTIVE)
                .contactName("Oficial Inspector Pérez")
                .notes("Certificado final de protección contra incendios.")
                .build());

        log.info("Demo data seeding completed successfully! 4 companies, 6 categories, 8 expirations, 2 inspections, and 2 permits created.");
    }

    private User getOrCreateUser(UUID orgId, String email, String firstName, String lastName, UserRole role, String passwordHash) {
        String normalized = email.trim().toLowerCase();
        return userRepository.findByEmail(normalized)
                .orElseGet(() -> userRepository.save(User.builder()
                        .organizationId(role == UserRole.PLATFORM_ADMIN ? null : orgId)
                        .email(normalized)
                        .firstName(firstName)
                        .lastName(lastName)
                        .role(role)
                        .passwordHash(passwordHash)
                        .status(UserStatus.ACTIVE)
                        .build()));
    }

    private ExpirationCategory getOrCreateCategory(UUID orgId, String code, String name, String description, String icon, String color) {
        return categoryRepository.findByOrganizationIdAndCodeIgnoreCase(orgId, code)
                .or(() -> categoryRepository.findByOrganizationIdIsNullAndCodeIgnoreCase(code))
                .orElseGet(() -> categoryRepository.save(ExpirationCategory.builder()
                        .organizationId(orgId)
                        .code(code)
                        .name(name)
                        .description(description)
                        .icon(icon)
                        .colorCode(color)
                        .isSystem(true)
                        .active(true)
                        .build()));
    }
}
