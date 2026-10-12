package com.rentar.customer;

import customer.CustomerOuterClass.Customer;
import customer.CustomerOuterClass.CustomerActiveResponse;
import customer.CustomerOuterClass.CustomerExistsRequest;
import customer.CustomerOuterClass.CustomerExistsResponse;
import customer.CustomerOuterClass.CustomerListResponse;
import customer.CustomerOuterClass.CustomerResponse;
import customer.CustomerOuterClass.GetCustomerRequest;
import customer.CustomerOuterClass.GetCustomersRequest;
import customer.CustomerOuterClass.IsCustomerActiveRequest;
import customer.CustomerOuterClass.LoginRequest;
import customer.CustomerOuterClass.LoginResponse;
import customer.CustomerOuterClass.SaveCustomerRequest;
import customer.CustomerServiceGrpc;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class CustomerGrpcService extends CustomerServiceGrpc.CustomerServiceImplBase {

    private final CustomerRepository repositorio;

    public CustomerGrpcService(CustomerRepository repositorio) {
        this.repositorio = repositorio;
    }

    @Override
    public void getCustomers(GetCustomersRequest request, StreamObserver<CustomerListResponse> response) {
        response.onNext(CustomerListResponse.newBuilder().addAllCustomers(repositorio.buscarTodos()).build());
        response.onCompleted();
    }

    @Override
    public void getCustomer(GetCustomerRequest request, StreamObserver<CustomerResponse> response) {
        if (!idValido(request.getId(), response)) {
            return;
        }

        Optional<Customer> cliente = repositorio.buscarPorId(request.getId());

        if (cliente.isEmpty()) {
            response.onError(clienteNoEncontrado());
            return;
        }

        response.onNext(CustomerResponse.newBuilder().setCustomer(cliente.get()).build());
        response.onCompleted();
    }

    @Override
    public void customerExists(CustomerExistsRequest request, StreamObserver<CustomerExistsResponse> response) {
        if (!idValido(request.getId(), response)) {
            return;
        }

        response.onNext(CustomerExistsResponse.newBuilder().setExists(repositorio.existe(request.getId())).build());
        response.onCompleted();
    }

    @Override
    public void isCustomerActive(IsCustomerActiveRequest request, StreamObserver<CustomerActiveResponse> response) {
        if (!idValido(request.getId(), response)) {
            return;
        }

        Optional<Boolean> activo = repositorio.estaActivo(request.getId());

        if (activo.isEmpty()) {
            response.onError(clienteNoEncontrado());
            return;
        }

        response.onNext(CustomerActiveResponse.newBuilder().setActive(Boolean.TRUE.equals(activo.get())).build());
        response.onCompleted();
    }

    // Valida email y password contra lk_usuarios. Lo usa el gateway para autenticar.
    @Override
    public void login(LoginRequest request, StreamObserver<LoginResponse> response) {
        Optional<String[]> usuario = repositorio.buscarUsuarioActivo(request.getEmail());

        LoginResponse.Builder respuesta = LoginResponse.newBuilder().setValido(false);
        if (usuario.isPresent() && new BCryptPasswordEncoder().matches(request.getPassword(), usuario.get()[0])) {
            respuesta.setValido(true).setRol(usuario.get()[1]);
            // Mismos datos que devolvía /api/auth/me en Spring
            if (usuario.get()[2] == null) {
                respuesta.setNombre("Administrador");
            } else {
                respuesta.setClienteId(Long.parseLong(usuario.get()[2])).setNombre(usuario.get()[3]);
            }
        }

        response.onNext(respuesta.build());
        response.onCompleted();
    }

    @Override
    public void createCustomer(SaveCustomerRequest request, StreamObserver<CustomerResponse> response) {
        if (datosEnUso(request, 0, response)) {
            return;
        }

        long id = repositorio.crear(request, new BCryptPasswordEncoder().encode(request.getPassword()));
        responderCliente(id, response);
    }

    @Override
    public void updateCustomer(SaveCustomerRequest request, StreamObserver<CustomerResponse> response) {
        if (!clienteExiste(request.getId(), response) || datosEnUso(request, request.getId(), response)) {
            return;
        }

        repositorio.modificar(request);
        responderCliente(request.getId(), response);
    }

    @Override
    public void deleteCustomer(GetCustomerRequest request, StreamObserver<CustomerResponse> response) {
        if (!clienteExiste(request.getId(), response)) {
            return;
        }

        repositorio.cambiarActivo(request.getId(), false);
        responderCliente(request.getId(), response);
    }

    @Override
    public void reactivateCustomer(GetCustomerRequest request, StreamObserver<CustomerResponse> response) {
        if (!clienteExiste(request.getId(), response)) {
            return;
        }

        repositorio.cambiarActivo(request.getId(), true);
        responderCliente(request.getId(), response);
    }

    private boolean clienteExiste(long id, StreamObserver<?> response) {
        if (!idValido(id, response)) {
            return false;
        }
        if (!repositorio.existe(id)) {
            response.onError(clienteNoEncontrado());
            return false;
        }
        return true;
    }

    // Email y documento no se pueden repetir
    private boolean datosEnUso(SaveCustomerRequest request, long id, StreamObserver<?> response) {
        String mensaje = null;
        if (repositorio.emailEnUso(request.getEmail(), id)) {
            mensaje = "El email ya está registrado";
        } else if (repositorio.documentoEnUso(request.getDocumento(), id)) {
            mensaje = "El documento ya está registrado";
        }

        if (mensaje == null) {
            return false;
        }
        response.onError(Status.ALREADY_EXISTS.withDescription(mensaje).asRuntimeException());
        return true;
    }

    private void responderCliente(long id, StreamObserver<CustomerResponse> response) {
        response.onNext(CustomerResponse.newBuilder().setCustomer(repositorio.buscarPorId(id).get()).build());
        response.onCompleted();
    }

    private boolean idValido(long id, StreamObserver<?> response) {
        if (id <= 0) {
            response.onError(Status.INVALID_ARGUMENT
                    .withDescription("El id del cliente debe ser mayor a 0")
                    .asRuntimeException());
            return false;
        }
        return true;
    }

    private RuntimeException clienteNoEncontrado() {
        return Status.NOT_FOUND.withDescription("Cliente no encontrado").asRuntimeException();
    }
}
