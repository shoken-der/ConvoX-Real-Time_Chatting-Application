package com.convox.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/api/health")
    public String health() {
        return "OK";
    }

    @GetMapping("/")
    public String root() {
        return "ConvoX Backend is Running!";
    }
}
