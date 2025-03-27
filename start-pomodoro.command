#!/bin/bash

# Directorio del script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Ejecutar el script principal
bash "./start-pomodoro.sh"

# Mantener la ventana abierta en caso de error
read -p "Presiona Enter para cerrar..." 