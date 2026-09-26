package com.ispticket.controller;

import com.ispticket.service.AuthService;
import com.ispticket.service.CollaborationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {
    private final AuthService auth;
    private final CollaborationService collaboration;
    @Value("${uploads.directory:uploads}") private String uploadDirectory;

    @PostMapping("/upload")
    public Map<String, String> upload(@RequestHeader(value="X-Auth-Token", required=false) String token,
                                     @RequestParam("file") MultipartFile file) throws Exception {
        var user = auth.authenticate(token);
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        Path uploadPath = Paths.get(uploadDirectory).toAbsolutePath().normalize();
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".")
            ? originalFilename.substring(originalFilename.lastIndexOf("."))
            : "";
        String filename = UUID.randomUUID().toString() + extension;

        Path targetPath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        String url = "/api/files/" + filename;
        return Map.of("url", url, "filename", filename);
    }

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
