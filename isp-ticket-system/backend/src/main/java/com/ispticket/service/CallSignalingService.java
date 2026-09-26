package com.ispticket.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class CallSignalingService {
    private final ObjectMapper mapper;
    private final Map<String, List<Map<String, Object>>> rooms = new ConcurrentHashMap<>();
    public Map<String, Object> signal(Long ticketId, String user, JsonNode payload) {
        String room = ticketId.toString();
        List<Map<String, Object>> roomEvents = rooms.computeIfAbsent(room,
                ignored -> Collections.synchronizedList(new ArrayList<>()));
        Map<String,Object> event = new LinkedHashMap<>();
        event.put("id", UUID.randomUUID().toString());
        event.put("from", user); event.put("payload", payload); event.put("at", Instant.now().toString());
        synchronized (roomEvents) {
            if (payload != null && "hangup".equals(payload.path("type").asText())) roomEvents.clear();
            roomEvents.add(event);
        }
        return event;
    }
    public List<Map<String,Object>> events(Long ticketId, String user) {
        List<Map<String, Object>> room = rooms.get(ticketId.toString());
        if (room == null) return List.of();
        synchronized (room) {
            return room.stream().filter(event -> !user.equals(event.get("from")))
                    .map(event -> (Map<String, Object>) new LinkedHashMap<String, Object>(event)).toList();
        }
    }
}
