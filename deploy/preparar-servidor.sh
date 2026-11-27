#!/bin/sh
# Prepara una maquina Ubuntu 24.04 recien creada: Docker, Git y 2 GB de memoria de intercambio.
#   sudo sh deploy/preparar-servidor.sh
# En AWS lo ejecuta solo el arranque de la instancia (deploy/aws.yml). Incluye actualizaciones de seguridad automaticas.
set -eu

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io docker-compose-v2 docker-buildx git curl unattended-upgrades
systemctl enable --now docker
[ -n "${SUDO_USER:-}" ] && usermod -aG docker "$SUDO_USER"

if ! swapon --show | grep -q /swapfile; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "Listo."
