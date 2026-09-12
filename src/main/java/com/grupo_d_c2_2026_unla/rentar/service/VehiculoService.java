package com.grupo_d_c2_2026_unla.rentar.service;

import com.grupo_d_c2_2026_unla.rentar.dto.VehiculoRequestDTO;
import com.grupo_d_c2_2026_unla.rentar.dto.VehiculoResponseDTO;

import java.util.List;

public interface VehiculoService {

    public VehiculoResponseDTO crear(VehiculoRequestDTO dto);

    public VehiculoResponseDTO modificar(Integer id, VehiculoRequestDTO dto);

    public void bajaLogica(Integer id);

    public VehiculoResponseDTO buscarPorId(Integer id);

    public List<VehiculoResponseDTO> listarTodos();
}
