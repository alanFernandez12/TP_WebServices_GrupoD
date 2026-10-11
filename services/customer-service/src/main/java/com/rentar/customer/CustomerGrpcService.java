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
import customer.CustomerServiceGrpc;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
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
