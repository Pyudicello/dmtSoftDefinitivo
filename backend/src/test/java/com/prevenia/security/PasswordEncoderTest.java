package com.prevenia.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;

class PasswordEncoderTest {

    @Test
    void shouldMatchHashedPassword() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String rawPassword = "Demo1234!";
        String encoded = "$2a$10$RUBlm.GW4GtT./ChJ7ThxOZxqky6itlreK3WiUbTeRs2GR4riuckq";

        assertThat(encoder.matches(rawPassword, encoded)).isTrue();
        assertThat(encoder.matches("WrongPassword", encoded)).isFalse();
    }
}
