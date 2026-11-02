package com.grupo_d_c2_2026_unla.rentar.service;

import com.grupo_d_c2_2026_unla.rentar.dto.UsuarioRequestDTO;
import com.grupo_d_c2_2026_unla.rentar.dto.UsuarioResponseDTO;

import java.util.List;

public interface UsuarioService {

    public UsuarioResponseDTO crear(UsuarioRequestDTO request);

    public UsuarioResponseDTO modificar(Long id, UsuarioRequestDTO request);

    public void bajaLogica(Long id);

    public UsuarioResponseDTO reactivar(Long id);

    public UsuarioResponseDTO buscarPorId(Long id);

    public List<UsuarioResponseDTO> listarTodos();

}
