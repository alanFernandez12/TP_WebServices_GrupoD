package com.grupo_d_c2_2026_unla.rentar.service.implementation;

import com.grupo_d_c2_2026_unla.rentar.dto.VehiculoRequestDTO;
import com.grupo_d_c2_2026_unla.rentar.dto.VehiculoResponseDTO;
import com.grupo_d_c2_2026_unla.rentar.entity.Vehiculo;
import com.grupo_d_c2_2026_unla.rentar.enums.EstadoVehiculo;
import com.grupo_d_c2_2026_unla.rentar.repository.VehiculoRepository;
import com.grupo_d_c2_2026_unla.rentar.service.VehiculoService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service("vehiculoService")
public class VehiculoServiceImpl implements VehiculoService {

    private final VehiculoRepository vehiculoRepository;

    public VehiculoServiceImpl(VehiculoRepository vehiculoRepository) {
        this.vehiculoRepository = vehiculoRepository;
    }

    @Override
    public VehiculoResponseDTO crear(VehiculoRequestDTO dto) {
        Vehiculo vehiculo = new Vehiculo();
        vehiculo.setPatente(dto.getPatente());
        vehiculo.setMarca(dto.getMarca());
        vehiculo.setModelo(dto.getModelo());
        vehiculo.setAnio(dto.getAnio());
        vehiculo.setColor(dto.getColor());
        vehiculo.setTipoVehiculo(dto.getTipoVehiculo());
        vehiculo.setPrecio_diario(dto.getPrecio_diario());
        vehiculo.setEstado(EstadoVehiculo.DISPONIBLE);
        vehiculo.setActivo(true);

        Vehiculo VehiCuloGuarado = vehiculoRepository.save(vehiculo);

        return toResponseDTO(VehiCuloGuarado);
    }

    @Override
    public VehiculoResponseDTO modificar(Integer id, VehiculoRequestDTO dto) {
        Vehiculo vehiculo = vehiculoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado"));

        vehiculo.setMarca(dto.getMarca());
        vehiculo.setModelo(dto.getModelo());
        vehiculo.setAnio(dto.getAnio());
        vehiculo.setColor(dto.getColor());
        vehiculo.setTipoVehiculo(dto.getTipoVehiculo());
        vehiculo.setPrecio_diario(dto.getPrecio_diario());

        Vehiculo actualizado = vehiculoRepository.save(vehiculo);
        return toResponseDTO(actualizado);
    }

    @Override
    public void bajaLogica(Integer id) {
        Vehiculo vehiculo = vehiculoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado"));
        vehiculo.setActivo(false);
        vehiculoRepository.save(vehiculo);
    }

    @Override
    public VehiculoResponseDTO buscarPorId(Integer id) {
        Vehiculo vehiculo = vehiculoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado"));
        return toResponseDTO(vehiculo);
    }

    @Override
    public List<VehiculoResponseDTO> listarTodos() {
        return vehiculoRepository.findAll().stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    private VehiculoResponseDTO toResponseDTO(Vehiculo vehiculo) {
        VehiculoResponseDTO dto = new VehiculoResponseDTO();
        dto.setId(vehiculo.getId());
        dto.setPatente(vehiculo.getPatente());
        dto.setMarca(vehiculo.getMarca());
        dto.setModelo(vehiculo.getModelo());
        dto.setAnio(vehiculo.getAnio());
        dto.setColor(vehiculo.getColor());
        dto.setTipoVehiculo(vehiculo.getTipoVehiculo());
        dto.setPrecio_diario(vehiculo.getPrecio_diario());
        dto.setEstado(vehiculo.getEstado());
        dto.setActivo(vehiculo.isActivo());
        return dto;
    }
}
