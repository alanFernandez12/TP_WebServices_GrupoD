package com.grupo_d_c2_2026_unla.rentar.controller;

import com.grupo_d_c2_2026_unla.rentar.dto.UsuarioRequestDTO;
import com.grupo_d_c2_2026_unla.rentar.dto.UsuarioResponseDTO;
import com.grupo_d_c2_2026_unla.rentar.service.UsuarioService;

import jakarta.validation.Valid;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {

        this.usuarioService = usuarioService;
    }

    // ALTA
    @PostMapping
    public ResponseEntity<UsuarioResponseDTO> crear(@Valid @RequestBody UsuarioRequestDTO usuario) {

        UsuarioResponseDTO creado = usuarioService.crear(usuario);

        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    // LISTADO
    @GetMapping
    public ResponseEntity<List<UsuarioResponseDTO>> listarTodos() {

        List<UsuarioResponseDTO> usuarios = usuarioService.listarTodos();

        return ResponseEntity.ok(usuarios);
    }

    // BUSCAR POR ID
    @GetMapping("/{id}")
    public ResponseEntity<UsuarioResponseDTO> buscarPorId(
            @PathVariable("id") Long id) {

        UsuarioResponseDTO usuario = usuarioService.buscarPorId(id);

        return ResponseEntity.ok(usuario);
    }

    // MODIFICAR
    @PutMapping("/{id}")
    public ResponseEntity<UsuarioResponseDTO> modificar(
            @PathVariable("id") Long id,
            @Valid @RequestBody UsuarioRequestDTO usuario) {

        UsuarioResponseDTO actualizado = usuarioService.modificar(id, usuario);

        return ResponseEntity.ok(actualizado);
    }

    // BAJA LOGICA
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> bajaLogica(
            @PathVariable("id") Long id) {

        usuarioService.bajaLogica(id);

        return ResponseEntity.noContent().build();
    }

    // REACTIVAR
    @PatchMapping("/{id}/activar")
    public ResponseEntity<UsuarioResponseDTO> reactivar(
            @PathVariable("id") Long id) {

        UsuarioResponseDTO reactivado = usuarioService.reactivar(id);

        return ResponseEntity.ok(reactivado);
    }

}
