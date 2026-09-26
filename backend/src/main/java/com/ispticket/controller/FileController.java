package com.ispticket.controller;

import com.ispticket.service.AuthService;
import com.ispticket.service.CollaborationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.nio.file.*;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {
    private final AuthService auth;
    private final CollaborationService collaboration;
    @Value("${uploads.directory:uploads}") private String uploadDirectory;
    @GetMapping("/{name}")
    public ResponseEntity<Resource> get(@RequestHeader(value="X-Auth-Token", required=false) String token, @PathVariable String name) throws Exception {
        var user = auth.authenticate(token);
        if (!collaboration.canAccessAttachment(name, user)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        Path path = Paths.get(uploadDirectory).toAbsolutePath().normalize().resolve(name).normalize();
        if (!path.startsWith(Paths.get(uploadDirectory).toAbsolutePath().normalize()) || !Files.exists(path)) return ResponseEntity.notFound().build();
        return ResponseEntity.ok().contentType(MediaTypeFactory.getMediaType(path.getFileName().toString()).orElse(MediaType.APPLICATION_OCTET_STREAM))
                .body(new FileSystemResource(path));
    }
}
