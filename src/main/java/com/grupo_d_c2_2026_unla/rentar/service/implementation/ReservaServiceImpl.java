package com.grupo_d_c2_2026_unla.rentar.service.implementation;

import com.grupo_d_c2_2026_unla.rentar.dto.ClienteResponseDTO;
import com.grupo_d_c2_2026_unla.rentar.dto.HistorialAlquilerDTO;
import com.grupo_d_c2_2026_unla.rentar.dto.ReservaFilterInput;
import com.grupo_d_c2_2026_unla.rentar.dto.ReservaRequestDTO;
import com.grupo_d_c2_2026_unla.rentar.dto.ReservaResponseDTO;
import com.grupo_d_c2_2026_unla.rentar.dto.VehiculoResponseDTO;
import com.grupo_d_c2_2026_unla.rentar.entity.Cliente;
import com.grupo_d_c2_2026_unla.rentar.entity.Reserva;
import com.grupo_d_c2_2026_unla.rentar.entity.Tiempo;
import com.grupo_d_c2_2026_unla.rentar.entity.Vehiculo;
import com.grupo_d_c2_2026_unla.rentar.enums.EstadoReserva;
import com.grupo_d_c2_2026_unla.rentar.exception.BusinessException;
import com.grupo_d_c2_2026_unla.rentar.exception.ResourceNotFoundException;
import com.grupo_d_c2_2026_unla.rentar.repository.*;
import com.grupo_d_c2_2026_unla.rentar.service.ReservaService;
import com.grupo_d_c2_2026_unla.rentar.security.UsuarioActual;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service("reservaService")
public class ReservaServiceImpl implements ReservaService {

    private final ReservaRepository reservaRepository;
    private final ClienteRepository clienteRepository;
    private final VehiculoRepository vehiculoRepository;
    private final TiempoRepository tiempoRepository;
     private final UsuarioActual usuarioActual;

    public ReservaServiceImpl(
            ReservaRepository reservaRepository,
            ClienteRepository clienteRepository,
            VehiculoRepository vehiculoRepository,
            TiempoRepository tiempoRepository,
            UsuarioActual usuarioActual) {
        this.reservaRepository = reservaRepository;
        this.clienteRepository = clienteRepository;
        this.vehiculoRepository = vehiculoRepository;
        this.tiempoRepository = tiempoRepository;
        this.usuarioActual = usuarioActual;
    }
    @Override
    @Transactional
    public ReservaResponseDTO crear(ReservaRequestDTO dto) {

        Long clienteId = usuarioActual.clientePermitido(dto.getIdCliente());

        if (clienteId == null) 
            throw new BusinessException("Debe seleccionar un cliente.");
        // Validaciones:
        // Validar que la fecha y hora de inicio y fin no sean nulas
        if (dto.getHoraInicio() == null || dto.getHoraFin() == null) {
            throw new BusinessException("La fecha y hora de inicio y fin son obligatorias.");
        }
        // Validar que la fecha y hora de inicio sea futura
        if (!dto.getHoraInicio().isAfter(LocalDateTime.now())) {
            throw new BusinessException("La fecha de inicio debe ser futura.");
        }
        // Validar que la fecha y hora de fin sea posterior a la fecha y hora de inicio
        if (!dto.getHoraFin().isAfter(dto.getHoraInicio())) {
            throw new BusinessException("La fecha de finalización debe ser posterior a la fecha de inicio.");
        }
        // Validar que el cliente exista
        Cliente cliente = clienteRepository.findById(dto.getIdCliente())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado."));

        // Valida que el cliente esté activo
        if (cliente.getActivo() == null || !cliente.getActivo()) {
            throw new BusinessException("El cliente no está activo.");
        }
        // Valida que el vehículo exista
        Vehiculo vehiculo = vehiculoRepository.findById(dto.getIdVehiculo())
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo no encontrado."));
        // Validar que el vehículo este activo
        if (!vehiculo.isActivo()) {
            throw new BusinessException("El vehículo no está activo.");
        }


        boolean reservado = reservaRepository.existsByVehiculoIdAndHoraInicioLessThanAndHoraFinGreaterThanAndEstadoReservaNot(
                vehiculo.getId(),
                dto.getHoraFin(),
                dto.getHoraInicio(),
                EstadoReserva.CANCELADA
        );
        // Validar que el vehículo no este reservado durante el período solicitado
        if (reservado) {
            throw new BusinessException("El vehículo no está disponible durante el período solicitado.");
        }

        int duracionDias = calcularDuracionDias(dto.getHoraInicio(), dto.getHoraFin());
        //valores tipo decimales se calculan como formula y que se registran en la reserva por si en un futuro cambian sus datos de base como por ejemplo el precio del dia
        BigDecimal precioDiarioHistorico = vehiculo.getPrecio_diario();
        BigDecimal importeTotal = precioDiarioHistorico.multiply(BigDecimal.valueOf(duracionDias));
        //Agrega dimension tiempo para busquedas mas rapidas a futuro
        Tiempo tiempo = obtenerOCrearTiempo(dto.getHoraInicio());
        //Crea la reserva
        Reserva reserva = new Reserva();
        reserva.setCliente(cliente);
        reserva.setVehiculo(vehiculo);
        reserva.setTiempo(tiempo);
        reserva.setHoraInicio(dto.getHoraInicio());
        reserva.setHoraFin(dto.getHoraFin());
        reserva.setDuracionDias(duracionDias);
        reserva.setPrecioDiarioHistorico(precioDiarioHistorico);
        reserva.setImporteTotal(importeTotal);
        reserva.setEstadoReserva(EstadoReserva.CONFIRMADA);// Cambiar a CONFIRMADA al crear la reserva

        Reserva reservaguardada = reservaRepository.save(reserva);

        return toResponseDTO(reservaguardada);
    }

     @Override
    @Transactional(readOnly = true)
    public List<HistorialAlquilerDTO> consultarHistorial(Long clienteId) {
        
        clienteId = usuarioActual.clientePermitido(clienteId);
        if (clienteId == null) {
            throw new BusinessException("El identificador del cliente es obligatorio.");
        }

        if (!clienteRepository.existsById(clienteId)) {
            throw new ResourceNotFoundException("Cliente no encontrado.");
        }

        return reservaRepository.buscarHistorialPorCliente(
                        clienteId,
                        List.of(EstadoReserva.TERMINADA, EstadoReserva.CANCELADA)
                ).stream()
                .map(HistorialAlquilerDTO::fromEntity)
                .toList();
    }

    @Override
    @Transactional (readOnly = true)
    public List<ReservaResponseDTO> buscarReservas(ReservaFilterInput filtro) {
        ReservaFilterInput criterios = filtro != null ? filtro : new ReservaFilterInput();
        Long clienteId = usuarioActual.clientePermitido(criterios.getClienteId());
        LocalDateTime desde = parsearFechaFiltro(criterios.getFechaDesde());
        LocalDateTime hasta = parsearFechaFiltro(criterios.getFechaHasta());
        
        if (desde != null && hasta != null && hasta.isBefore(desde)) {
            throw new BusinessException("La fecha hasta no puede ser anterior a la fecha desde.");
        }

        return reservaRepository.findAll(Sort.by(Sort.Direction.DESC, "horaInicio")).stream()
                .filter(r -> clienteId == null || r.getCliente().getIdCliente().equals(clienteId))
                .filter(r -> criterios.getVehiculoId() == null || r.getVehiculo().getId().equals(criterios.getVehiculoId()))
                .filter(r -> criterios.getTipoVehiculo() == null || r.getVehiculo().getTipoVehiculo() == criterios.getTipoVehiculo())
                .filter(r -> criterios.getEstadoReserva() == null || r.getEstadoReserva() == criterios.getEstadoReserva())
                // Rango inclusivo: reservas contenidas dentro del período indicado.
                .filter(r -> desde == null || !r.getHoraInicio().isBefore(desde))
                .filter(r -> hasta == null || !r.getHoraFin().isAfter(hasta))
                .map(this::toResponseDTO)
                .toList();
    }

    private LocalDateTime parsearFechaFiltro(String fecha) {
        if (fecha == null || fecha.isBlank()) return null;
        try {
            return LocalDateTime.parse(fecha.trim());
        } catch (DateTimeParseException ex) {
            throw new BusinessException("Las fechas deben tener formato ISO-8601, por ejemplo 2026-11-01T10:00:00.");
        }
    }

    private int calcularDuracionDias(LocalDateTime inicio, LocalDateTime fin) {
        long horas = Duration.between(inicio, fin).toHours();
        if (horas <= 0) {
            throw new BusinessException("La duración del alquiler debe ser mayor a 0.");
        }
        return (int) Math.ceil(horas / 24.0);
    }

    private Tiempo obtenerOCrearTiempo(LocalDateTime fechaHoraInicio) {
        LocalDate fecha = fechaHoraInicio.toLocalDate();

        return tiempoRepository.findByFechaCalendario(fecha)
                .orElseGet(() -> {
                    Tiempo tiempo = new Tiempo();
                    tiempo.setFechaCalendario(fecha);
                    tiempo.setAnio(fecha.getYear());
                    tiempo.setMes(fecha.getMonthValue());
                    tiempo.setDia(fecha.getDayOfMonth());
                    tiempo.setNombreMes(fecha.getMonth().name());
                    tiempo.setDiaSemana(fecha.getDayOfWeek().name());
                    return tiempoRepository.save(tiempo);
                });
    }

    private ReservaResponseDTO toResponseDTO(Reserva reserva) {
        ReservaResponseDTO dto = new ReservaResponseDTO();
        Cliente cliente = reserva.getCliente();
        ClienteResponseDTO clienteDTO = new ClienteResponseDTO();
        clienteDTO.setId(cliente.getIdCliente());
        clienteDTO.setNombre(cliente.getNombre());
        clienteDTO.setApellido(cliente.getApellido());
        clienteDTO.setDocumento(cliente.getDocumento());
        clienteDTO.setEmail(cliente.getUsuario().getEmail());
        clienteDTO.setTelefono(cliente.getTelefono());
        clienteDTO.setFechaNacimiento(cliente.getFechaNacimiento());
        clienteDTO.setActivo(Boolean.TRUE.equals(cliente.getActivo()));
        dto.setCliente(clienteDTO);

        Vehiculo vehiculo = reserva.getVehiculo();
        VehiculoResponseDTO vehiculoDTO = new VehiculoResponseDTO();
        vehiculoDTO.setId(vehiculo.getId());
        vehiculoDTO.setPatente(vehiculo.getPatente());
        vehiculoDTO.setMarca(vehiculo.getMarca());
        vehiculoDTO.setModelo(vehiculo.getModelo());
        vehiculoDTO.setTipoVehiculo(vehiculo.getTipoVehiculo());
        vehiculoDTO.setAnio(vehiculo.getAnio());
        vehiculoDTO.setColor(vehiculo.getColor());
        vehiculoDTO.setPrecio_diario(vehiculo.getPrecio_diario());
        vehiculoDTO.setEstado(vehiculo.getEstado());
        vehiculoDTO.setActivo(vehiculo.isActivo());
        
        dto.setVehiculo(vehiculoDTO);
        dto.setPatente(vehiculo.getPatente());
        dto.setId(reserva.getId());
        dto.setIdTiempo(reserva.getTiempo() != null ? reserva.getTiempo().getId() : null);
        dto.setHoraInicio(reserva.getHoraInicio());
        dto.setHoraFin(reserva.getHoraFin());
        dto.setDuracionDias(reserva.getDuracionDias());
        dto.setPrecioDiarioHistorico(reserva.getPrecioDiarioHistorico());
        dto.setImporteTotal(reserva.getImporteTotal());
        dto.setEstadoReserva(reserva.getEstadoReserva());
        return dto;
    }
    @Override
    @Transactional
    public ReservaResponseDTO cancelar(Long reservaId) {
        //Revisa que la ID no sea NULA
        if (reservaId == null) {
            throw new BusinessException("El identificador de reserva es obligatorio.");
        }
        //Busca si existe la reserva y la trae
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada."));
        //comprueba que pertenezca al usuario actual
        usuarioActual.clientePermitido(reserva.getCliente().getIdCliente());

        //revisa si ya esta cancelada
        if (reserva.getEstadoReserva() == EstadoReserva.CANCELADA) {
            throw new BusinessException("La reserva ya se encuentra cancelada.");
        }
        //revisa que la fecha de inicio de la reserva no haya pasado o sea = a la fecha actual
        if (reserva.getHoraInicio().isBefore(LocalDateTime.now()) || reserva.getHoraInicio().isEqual(LocalDateTime.now())) {
            throw new BusinessException("La cancelación solo puede realizarse antes del inicio del alquiler.");
        }
        //cambia el estado
        reserva.setEstadoReserva(EstadoReserva.CANCELADA);
        //guarda el cambio de estado
        Reserva actualizada = reservaRepository.save(reserva);

        return toResponseDTO(actualizada);
    }
}