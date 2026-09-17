package com.grupo_d_c2_2026_unla.rentar.service.implementation;

import com.grupo_d_c2_2026_unla.rentar.dto.HistorialAlquilerDTO;
import com.grupo_d_c2_2026_unla.rentar.dto.ReservaRequestDTO;
import com.grupo_d_c2_2026_unla.rentar.dto.ReservaResponseDTO;
import com.grupo_d_c2_2026_unla.rentar.entity.Cliente;
import com.grupo_d_c2_2026_unla.rentar.entity.Reserva;
import com.grupo_d_c2_2026_unla.rentar.entity.Tiempo;
import com.grupo_d_c2_2026_unla.rentar.entity.Vehiculo;
import com.grupo_d_c2_2026_unla.rentar.enums.EstadoReserva;
import com.grupo_d_c2_2026_unla.rentar.repository.ClienteRepository;
import com.grupo_d_c2_2026_unla.rentar.repository.ReservaRepository;
import com.grupo_d_c2_2026_unla.rentar.repository.TiempoRepository;
import com.grupo_d_c2_2026_unla.rentar.repository.VehiculoRepository;
import com.grupo_d_c2_2026_unla.rentar.service.ReservaService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service("reservaService")
public class ReservaServiceImpl implements ReservaService {

    private final ReservaRepository reservaRepository;
    private final ClienteRepository clienteRepository;
    private final VehiculoRepository vehiculoRepository;
    private final TiempoRepository tiempoRepository;

    public ReservaServiceImpl(
            ReservaRepository reservaRepository,
            ClienteRepository clienteRepository,
            VehiculoRepository vehiculoRepository,
            TiempoRepository tiempoRepository) {
        this.reservaRepository = reservaRepository;
        this.clienteRepository = clienteRepository;
        this.vehiculoRepository = vehiculoRepository;
        this.tiempoRepository = tiempoRepository;
    }
    @Override
    @Transactional
    public ReservaResponseDTO crear(ReservaRequestDTO dto) {
        // Validaciones:
        // Validar que la fecha y hora de inicio y fin no sean nulas
        if (dto.getHoraInicio() == null || dto.getHoraFin() == null) {
            throw new RuntimeException("La fecha y hora de inicio y fin son obligatorias.");
        }
        // Validar que la fecha y hora de inicio sea futura
        if (!dto.getHoraInicio().isAfter(LocalDateTime.now())) {
            throw new RuntimeException("La fecha de inicio debe ser futura.");
        }
        // Validar que la fecha y hora de fin sea posterior a la fecha y hora de inicio
        if (!dto.getHoraFin().isAfter(dto.getHoraInicio())) {
            throw new RuntimeException("La fecha de finalización debe ser posterior a la fecha de inicio.");
        }
        // Validar que el cliente exista
        Cliente cliente = clienteRepository.findById(dto.getIdCliente())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado."));

        // Valida que el cliente esté activo
        if (cliente.getActivo() == null || !cliente.getActivo()) {
            throw new RuntimeException("El cliente no está activo.");
        }
        // Valida que el vehículo exista
        Vehiculo vehiculo = vehiculoRepository.findById(dto.getIdVehiculo())
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado."));
        // Validar que el vehículo este activo
        if (!vehiculo.isActivo()) {
            throw new RuntimeException("El vehículo no está activo.");
        }


        boolean reservado = reservaRepository.existsByVehiculoIdAndHoraInicioLessThanAndHoraFinGreaterThanAndEstadoReservaNot(
                vehiculo.getId(),
                dto.getHoraFin(),
                dto.getHoraInicio(),
                EstadoReserva.CANCELADA
        );
        // Validar que el vehículo no este reservado durante el período solicitado
        if (reservado) {
            throw new RuntimeException("El vehículo no está disponible durante el período solicitado.");
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
        if (clienteId == null) {
            throw new IllegalArgumentException("El identificador del cliente es obligatorio.");
        }
        if (!clienteRepository.existsById(clienteId)) {
            throw new IllegalArgumentException("Cliente no encontrado.");
        }

        return reservaRepository.buscarHistorialPorCliente(
                        clienteId,
                        List.of(EstadoReserva.TERMINADA, EstadoReserva.CANCELADA)
                ).stream()
                .map(HistorialAlquilerDTO::fromEntity)
                .toList();
    }

    private int calcularDuracionDias(LocalDateTime inicio, LocalDateTime fin) {
        long horas = Duration.between(inicio, fin).toHours();
        if (horas <= 0) {
            throw new RuntimeException("La duración del alquiler debe ser mayor a 0.");
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
        dto.setId(reserva.getId());
        dto.setIdCliente(reserva.getCliente().getIdCliente());
        dto.setIdVehiculo(reserva.getVehiculo().getId());
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
            throw new IllegalArgumentException("El identificador de reserva es obligatorio.");
        }
        //Busca si existe la reserva y la trae
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada."));
        //revisa si ya esta cancelada
        if (reserva.getEstadoReserva() == EstadoReserva.CANCELADA) {
            throw new IllegalStateException("La reserva ya se encuentra cancelada.");
        }
        //revisa que la fecha de inicio de la reserva no haya pasado o sea = a la fecha actual
        if (reserva.getHoraInicio().isBefore(LocalDateTime.now()) || reserva.getHoraInicio().isEqual(LocalDateTime.now())) {
            throw new IllegalStateException("La cancelación solo puede realizarse antes del inicio del alquiler.");
        }
        //cambia el estado
        reserva.setEstadoReserva(EstadoReserva.CANCELADA);
        //guarda el cambio de estado
        Reserva actualizada = reservaRepository.save(reserva);

        return toResponseDTO(actualizada);
    }
}