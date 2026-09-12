package com.grupo_d_c2_2026_unla.rentar.controller;


import com.grupo_d_c2_2026_unla.rentar.dto.VehiculoRequestDTO;
import com.grupo_d_c2_2026_unla.rentar.dto.VehiculoResponseDTO;
import com.grupo_d_c2_2026_unla.rentar.service.VehiculoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vehiculos")
public class VehiculoController {

    private final VehiculoService vehiculoService;

    public VehiculoController(VehiculoService vehiculoService) {

        this.vehiculoService = vehiculoService;
    }

    // ALTA
    @PostMapping
    public ResponseEntity<VehiculoResponseDTO> crear(@RequestBody VehiculoRequestDTO vehiculo) {
        VehiculoResponseDTO creado = vehiculoService.crear(vehiculo);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }
    // BAJA LÓGICA
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> baja(@PathVariable Integer id) {
        vehiculoService.bajaLogica(id);
        return ResponseEntity.noContent().build();
    }

    // MODIFICACIÓN
    @PutMapping("/{id}")
    public ResponseEntity<VehiculoResponseDTO> modificar(@PathVariable Integer id, @RequestBody VehiculoRequestDTO vehiculo) {
        VehiculoResponseDTO modificado = vehiculoService.modificar(id, vehiculo);
        return ResponseEntity.ok(modificado);
    }

    // OBTENER POR ID
    @GetMapping("/{id}")
    public ResponseEntity<VehiculoResponseDTO> buscarPorId(@PathVariable Integer id) {
        VehiculoResponseDTO encontrado = vehiculoService.buscarPorId(id);
        return ResponseEntity.ok(encontrado);
    }
}
