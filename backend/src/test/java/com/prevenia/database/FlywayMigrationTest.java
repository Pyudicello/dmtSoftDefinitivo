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
@TestPropertySource(properties = {
        "spring.flyway.enabled=true",
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.flyway.locations=classpath:db/migration"
})
class FlywayMigrationTest {

    @Autowired
    private Flyway flyway;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void shouldSuccessfullyMigrateSchemaAndSeedCategories() {
        // Assert Flyway executed successfully
        var appliedMigrations = flyway.info().applied();
        assertThat(appliedMigrations).isNotEmpty();
        assertThat(appliedMigrations[0].getVersion().getVersion()).isEqualTo("1");
        assertThat(appliedMigrations[0].getDescription()).isEqualTo("initial schema");

        // Verify seeded categories count
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM expiration_categories WHERE is_system = true",
                Integer.class
        );
        assertThat(count).isEqualTo(11);

        // Verify MATAFUEGOS and CAPACITACION categories exist
        Integer matafuegosCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM expiration_categories WHERE code = 'MATAFUEGOS'",
                Integer.class
        );
        assertThat(matafuegosCount).isEqualTo(1);
    }
}
