package com.grupo_d_c2_2026_unla.rentar.service;

import com.grupo_d_c2_2026_unla.rentar.dto.ClienteRequestDTO;
import com.grupo_d_c2_2026_unla.rentar.dto.ClienteResponseDTO;

import java.util.List;

public interface ClienteService {

    public ClienteResponseDTO crear(ClienteRequestDTO request);

    public ClienteResponseDTO modificar(Long id, ClienteRequestDTO request);

    public void bajaLogica(Long id);

    public void reactivar(Long id);

    public ClienteResponseDTO buscarPorId(Long id);

    public List<ClienteResponseDTO> listarTodos();

}
