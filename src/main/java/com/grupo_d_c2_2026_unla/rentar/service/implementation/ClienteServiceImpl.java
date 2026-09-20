package com.grupo_d_c2_2026_unla.rentar.service.implementation;

import com.grupo_d_c2_2026_unla.rentar.dto.ClienteRequestDTO;
import com.grupo_d_c2_2026_unla.rentar.dto.ClienteResponseDTO;
import com.grupo_d_c2_2026_unla.rentar.entity.Cliente;
import com.grupo_d_c2_2026_unla.rentar.entity.Usuario;
import com.grupo_d_c2_2026_unla.rentar.repository.ClienteRepository;
import com.grupo_d_c2_2026_unla.rentar.repository.UsuarioRepository;
import com.grupo_d_c2_2026_unla.rentar.service.ClienteService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service("clienteService")
public class ClienteServiceImpl implements ClienteService {

    private final ClienteRepository clienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public ClienteServiceImpl(
            ClienteRepository clienteRepository,
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder) {

        this.clienteRepository = clienteRepository;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public ClienteResponseDTO crear(ClienteRequestDTO dto) {

        if (usuarioRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("El email ya está registrado");
        }

        if (clienteRepository.existsByDocumento(dto.getDocumento())) {
            throw new RuntimeException("El documento ya está registrado");
        }

        // Crear usuario
        Usuario usuario = new Usuario();
        usuario.setEmail(dto.getEmail());
        usuario.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        usuario.setRol(dto.getRol());
        usuario.setActivo(true);

        Usuario usuarioGuardado = usuarioRepository.save(usuario);

        // Crear cliente
        Cliente cliente = new Cliente();
        cliente.setUsuario(usuarioGuardado);
        cliente.setDocumento(dto.getDocumento());
        cliente.setNombre(dto.getNombre());
        cliente.setApellido(dto.getApellido());
        cliente.setTelefono(dto.getTelefono());
        cliente.setFechaNacimiento(dto.getFechaNacimiento());
        cliente.setActivo(true);

        Cliente clienteGuardado = clienteRepository.save(cliente);

        return toResponseDTO(clienteGuardado);
    }

    @Override
    public ClienteResponseDTO modificar(Long id, ClienteRequestDTO dto) {

        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        if (!cliente.getDocumento().equals(dto.getDocumento())
                && clienteRepository.existsByDocumento(dto.getDocumento())) {

            throw new RuntimeException("El documento ya está registrado");
        }

        if (!cliente.getUsuario().getEmail().equals(dto.getEmail())
                && usuarioRepository.existsByEmail(dto.getEmail())) {

            throw new RuntimeException("El email ya está registrado");
        }

        cliente.setDocumento(dto.getDocumento());
        cliente.setNombre(dto.getNombre());
        cliente.setApellido(dto.getApellido());
        cliente.setTelefono(dto.getTelefono());
        cliente.setFechaNacimiento(dto.getFechaNacimiento());

        // Actualizar email del usuario asociado
        cliente.getUsuario().setEmail(dto.getEmail());
        usuarioRepository.save(cliente.getUsuario());

        Cliente actualizado = clienteRepository.save(cliente);

        return toResponseDTO(actualizado);
    }

    @Override
    public void bajaLogica(Long id) {

        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        cliente.setActivo(false);

        Usuario usuario = cliente.getUsuario();
        usuario.setActivo(false);
        
        usuarioRepository.save(usuario);
        clienteRepository.save(cliente);
    }

    @Override
    public ClienteResponseDTO buscarPorId(Long id) {

        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        return toResponseDTO(cliente);
    }

    @Override
    public List<ClienteResponseDTO> listarTodos() {

        return clienteRepository.findAll().stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    private ClienteResponseDTO toResponseDTO(Cliente cliente) {

        ClienteResponseDTO dto = new ClienteResponseDTO();

        dto.setId(cliente.getIdCliente());
        dto.setDocumento(cliente.getDocumento());
        dto.setNombre(cliente.getNombre());
        dto.setApellido(cliente.getApellido());
        dto.setEmail(cliente.getUsuario().getEmail());
        dto.setTelefono(cliente.getTelefono());
        dto.setFechaNacimiento(cliente.getFechaNacimiento());
        dto.setActivo(cliente.getActivo());

        return dto;
    }

}