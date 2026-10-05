package com.prevenia.database;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = "spring.datasource.url=jdbc:h2:mem:flyway_migration_test;DB_CLOSE_DELAY=-1;MODE=PostgreSQL")
class FlywayMigrationTest {

    @Autowired
    private Flyway flyway;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void shouldSuccessfullyMigrateSchemaAndSeedCategories() {
        // Assert Flyway executed successfully (V1, V2, V3, V4 + Repeatable Dev Seed)
        var appliedMigrations = flyway.info().applied();
        assertThat(appliedMigrations).hasSize(5);
        assertThat(appliedMigrations[0].getVersion().getVersion()).isEqualTo("1");
        assertThat(appliedMigrations[0].getDescription()).isEqualTo("initial schema");
        assertThat(appliedMigrations[1].getVersion().getVersion()).isEqualTo("2");
        assertThat(appliedMigrations[1].getDescription()).isEqualTo("add user company id");
        assertThat(appliedMigrations[2].getVersion().getVersion()).isEqualTo("3");
        assertThat(appliedMigrations[2].getDescription()).isEqualTo("update expiration core");
        assertThat(appliedMigrations[3].getVersion().getVersion()).isEqualTo("4");
        assertThat(appliedMigrations[3].getDescription()).isEqualTo("add inspections and permits");
        assertThat(appliedMigrations[4].getDescription()).isEqualTo("dev seed data");

        // Verify seeded system categories count (DDL technical system categories)
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM expiration_categories WHERE is_system = true",
                Integer.class
        );
        assertThat(count).isEqualTo(11);

        // Verify seeded organizations count from dev seed
        Integer orgCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM organizations", Integer.class);
        assertThat(orgCount).isEqualTo(2);

        // Verify seeded users count from dev seed
        Integer userCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
        assertThat(userCount).isEqualTo(6);

        // Verify seeded companies count from dev seed
        Integer companyCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM companies", Integer.class);
        assertThat(companyCount).isEqualTo(4);

        // Verify seeded assignments count from dev seed
        Integer assignmentCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM user_company_assignments", Integer.class);
        assertThat(assignmentCount).isEqualTo(3);

        // Verify seeded expirations count from dev seed
        Integer expirationCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM expirations", Integer.class);
        assertThat(expirationCount).isGreaterThanOrEqualTo(10);
    }
}
