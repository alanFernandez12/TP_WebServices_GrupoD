package com.grupo_d_c2_2026_unla.rentar.security;

import com.grupo_d_c2_2026_unla.rentar.entity.Cliente;
import com.grupo_d_c2_2026_unla.rentar.repository.ClienteRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component 
public class UsuarioActual {
    
    private final ClienteRepository clientes;
    public UsuarioActual(ClienteRepository clientes) { this.clientes = clientes; }

    public Authentication autenticacion() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()
                || auth.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_CLIENTE"))) {
            throw new AccessDeniedException("Debe iniciar sesión con una cuenta habilitada.");
        }
        return auth;
    }

    public boolean esAdministrador() {
        return autenticacion().getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @Transactional(readOnly = true)
    public Cliente cliente() {
        return clientes.findByUsuarioEmail(autenticacion().getName())
                .orElseThrow(() -> new AccessDeniedException("La cuenta no tiene un cliente asociado."));
    }

    public Long clientePermitido(Long solicitado) {
        
        if (esAdministrador()) 
            return solicitado;
        
        Long propio = cliente().getIdCliente();
        
        if (solicitado != null && !solicitado.equals(propio)) {
            throw new AccessDeniedException("Solo puede acceder a sus propias reservas.");
        }
        return propio;
    }
    
}
