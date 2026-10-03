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
class FlywayMigrationTest {

    @Autowired
    private Flyway flyway;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void shouldSuccessfullyMigrateSchemaAndSeedCategories() {
        // Assert Flyway executed successfully
        var appliedMigrations = flyway.info().applied();
        assertThat(appliedMigrations).hasSize(2);
        assertThat(appliedMigrations[0].getVersion().getVersion()).isEqualTo("1");
        assertThat(appliedMigrations[0].getDescription()).isEqualTo("initial schema");
        assertThat(appliedMigrations[1].getVersion().getVersion()).isEqualTo("2");
        assertThat(appliedMigrations[1].getDescription()).isEqualTo("add user company id and dev seed");

        // Verify seeded categories count
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM expiration_categories WHERE is_system = true",
                Integer.class
        );
        assertThat(count).isEqualTo(11);

        // Verify seeded organizations count
        Integer orgCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM organizations", Integer.class);
        assertThat(orgCount).isEqualTo(2);

        // Verify seeded users count
        Integer userCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
        assertThat(userCount).isEqualTo(6);

        // Verify seeded companies count
        Integer companyCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM companies", Integer.class);
        assertThat(companyCount).isEqualTo(4);

        // Verify seeded assignments count
        Integer assignmentCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM user_company_assignments", Integer.class);
        assertThat(assignmentCount).isEqualTo(3);
    }
}
