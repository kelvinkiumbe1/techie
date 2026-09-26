package com.ispticket.config;
import com.ispticket.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
@Configuration @RequiredArgsConstructor
public class BootstrapConfig {
    @Bean CommandLineRunner bootstrapAdmin(AuthService authService) {
        return args -> authService.ensureAdmin();
    }
}
