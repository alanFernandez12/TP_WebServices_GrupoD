"""Inicia los servicios locales de Rentar en consolas separadas de Windows."""

from __future__ import annotations

import os
import subprocess
import sys
import time
from pathlib import Path


ROOT = Path(__file__).resolve().parent
CREATE_NEW_CONSOLE = getattr(subprocess, "CREATE_NEW_CONSOLE", 0)
CREATE_NEW_PROCESS_GROUP = getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0)


def command_exists(path: Path) -> bool:
    return path.exists() and path.is_file()


def start_service(name: str, command: list[str], cwd: Path) -> subprocess.Popen:
    print(f"Iniciando {name}...")
    return subprocess.Popen(
        command,
        cwd=cwd,
        creationflags=CREATE_NEW_CONSOLE | CREATE_NEW_PROCESS_GROUP,
    )


def main() -> int:
    python_executable = ROOT / "services" / "vehicle-service" / ".venv" / "Scripts" / "python.exe"
    mvnw = ROOT / "mvnw.cmd"
    rental_directory = ROOT / "services" / "rental-service"
    verifier_directory = ROOT / "services" / "vehicle-verifier"
    correlator_directory = ROOT / "services" / "vehicle-correlator"
    ownership_directory = ROOT / "services" / "ownership-verifier"
    maintenance_directory = ROOT / "services" / "maintenance-service"
    ownership_image = "ownership-verifier:local"

    required_paths = {
        "Python del vehicle-service": python_executable,
        "Maven Wrapper": mvnw,
        "API Gateway": ROOT / "api-gateway",
        "Frontend": ROOT / "frontend",
        "Customer Service": ROOT / "services" / "customer-service",
        "Vehicle Service": ROOT / "services" / "vehicle-service",
        "Vehicle Verifier": verifier_directory,
        "Vehicle Correlator": correlator_directory,
        "Ownership Verifier": ownership_directory,
        "Ownership Verifier Dockerfile": ownership_directory / "Dockerfile",
        "Maintenance Service": maintenance_directory,
        "Rental Service": rental_directory,
    }

    missing = [f"{name}: {path}" for name, path in required_paths.items()
               if not path.exists()]
    if missing:
        print("No se pudieron iniciar los servicios porque faltan:")
        print("\n".join(f"- {item}" for item in missing))
        return 1

    services: list[subprocess.Popen] = []
    try:
        # Spring Boot principal expone las operaciones REST del frontend.
        services.append(start_service(
            "Spring Boot principal",
            [str(mvnw), "spring-boot:run"],
            ROOT,
        ))

        # Customer Service expone CustomerService en el puerto 9092.
        services.append(start_service(
            "Customer Service gRPC",
            [str(mvnw), "-f", "services/customer-service/pom.xml", "spring-boot:run"],
            ROOT,
        ))

        # Vehicle Service Python expone VehicleService en el puerto 9091.
        services.append(start_service(
            "Vehicle Service gRPC",
            [str(python_executable), "app/server.py"],
            ROOT / "services" / "vehicle-service",
        ))
        services.append(start_service(
            "Vehicle Verifier",
            [str(python_executable), "app/verifier.py"],
            verifier_directory,
        ))
        services.append(start_service(
            "External Vehicle Verifier",
            [str(python_executable), "app/external_verifier.py"],
            verifier_directory,
        ))
        services.append(start_service(
            "Vehicle Correlator",
            [str(python_executable), "app/correlator.py"],
            correlator_directory,
        ))
        services.append(start_service(
            "Ownership Verifier",
            [
                "docker", "run", "--rm",
                "--name", "ownership-verifier-consumer",
                "--no-healthcheck",
                "--env-file", str(ownership_directory / ".env"),
                ownership_image,
                "python", "-m", "app.ownership_consumer",
            ],
            ROOT,
        ))
        services.append(start_service(
            "Maintenance Service",
            [str(python_executable), "app/maintenance.py"],
            maintenance_directory,
        ))
        services.append(start_service(
            "Rental Service gRPC",
            [str(python_executable), "app/server.py"],
            rental_directory,
        ))

        services.append(start_service(
            "API Gateway",
            ["npm.cmd", "run", "dev"],
            ROOT / "api-gateway",
        ))

        services.append(start_service(
            "Frontend",
            ["npm.cmd", "run", "dev"],
            ROOT / "frontend",
        ))
    except OSError as error:
        print(f"No se pudo iniciar un servicio: {error}")
        for process in services:
            process.terminate()
        return 1

    print()
    print("Servicios iniciados en consolas separadas:")
    print("- Frontend:       http://localhost:5173")
    print("- Spring Boot:    http://localhost:8080")
    print("- API Gateway:    http://localhost:8085")
    print("- Vehicle gRPC:   localhost:9091")
    print("- Vehicle Verifier: RabbitMQ")
    print("- External Vehicle Verifier: RabbitMQ")
    print("- Vehicle Correlator: RabbitMQ + MySQL")
    print("- Ownership Verifier: RabbitMQ + MySQL")
    print("- Maintenance Service: RabbitMQ")
    print("- Customer gRPC:  localhost:9092")
    print("- Rental gRPC:    localhost:9093")
    print()
    print("Presioná Ctrl+C en esta consola para cerrar los procesos iniciados.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nCerrando procesos...")
        for process in reversed(services):
            if process.poll() is None:
                process.terminate()
        return 0


if __name__ == "__main__":
    if os.name != "nt":
        print("Este script está preparado para abrir consolas separadas en Windows.")
        sys.exit(1)
    sys.exit(main())
