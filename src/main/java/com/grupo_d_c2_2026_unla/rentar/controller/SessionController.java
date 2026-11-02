package com.grupo_d_c2_2026_unla.rentar.controller;

import com.grupo_d_c2_2026_unla.rentar.security.UsuarioActual;
import com.grupo_d_c2_2026_unla.rentar.entity.Cliente;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/auth")
public class SessionController {

    private final UsuarioActual actual;
    
    public SessionController(UsuarioActual actual) { 
        this.actual = actual; }
    
    public record SesionDTO(String email, String nombre, String rol, Long clienteId) {}

    @GetMapping("/me")
    public SesionDTO me() {
        String email = actual.autenticacion().getName();
        if (actual.esAdministrador()) return new SesionDTO(email, "Administrador", "ADMIN", null);
        Cliente cliente = actual.cliente();
        return new SesionDTO(email, cliente.getNombre() + " " + cliente.getApellido(), "CLIENTE", cliente.getIdCliente());
    }
    
}
