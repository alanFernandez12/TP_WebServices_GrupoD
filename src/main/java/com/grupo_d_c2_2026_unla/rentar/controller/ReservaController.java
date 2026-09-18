package com.grupo_d_c2_2026_unla.rentar.controller;

import com.grupo_d_c2_2026_unla.rentar.dto.ReservaFilterInput;
import com.grupo_d_c2_2026_unla.rentar.dto.ReservaRequestDTO;
import com.grupo_d_c2_2026_unla.rentar.dto.ReservaResponseDTO;
import com.grupo_d_c2_2026_unla.rentar.service.ReservaService;
import jakarta.validation.Valid;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

    private final ReservaService reservaService;

    public ReservaController(ReservaService reservaService) {
        this.reservaService = reservaService;
    }

    @PostMapping
    public ResponseEntity<ReservaResponseDTO> crear(@Valid @RequestBody ReservaRequestDTO dto) {
        ReservaResponseDTO creada = reservaService.crear(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }
    @PatchMapping("/{id}/cancelar")
    public ResponseEntity<ReservaResponseDTO> cancelar(@PathVariable Long id) {
        ReservaResponseDTO cancelada = reservaService.cancelar(id);
        return ResponseEntity.ok(cancelada);
    }

}