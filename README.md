# 🎯 PomodoroDesk

<div align="center">

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![SCSS](https://img.shields.io/badge/Sass-CC6699?style=for-the-badge&logo=sass&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

</div>

<div align="center">
  <img src="public/preview.png" alt="PomodoroDesk Preview" width="800px" />
</div>

## 🌟 Características

### 📝 Notas Adhesivas Inteligentes
- Creación rápida de notas con Ctrl+V
- Soporte para imágenes (pegar y arrastrar)
- Editor de texto enriquecido con formato
- Visor de imágenes interactivo con zoom
- Personalización de colores
- Redimensionamiento flexible

### ⏲️ Temporizador Pomodoro
- Temporizador personalizable
- Descansos cortos y largos
- Notificaciones sonoras
- Contador de pomodoros

### 📋 Seguimiento de Tareas
- Lista de tareas con estados
- Contador de pomodoros por tarea
- Ordenamiento inteligente
- Eliminación de tareas completadas

### 🎵 Integración Multimedia
- Reproductor de música lo-fi integrado
- Integración con Spotify
- Soporte para Twitch y YouTube

### 🎨 Personalización
- Múltiples temas y fondos
- Modo oscuro/claro
- Widgets redimensionables y arrastrables
- Citas inspiradoras personalizables

## 🚀 Inicio Rápido

```bash
# Clonar el repositorio
git clone https://github.com/tuusuario/pomodorodesk.git

# Instalar dependencias
cd pomodorodesk
npm install

# Iniciar en modo desarrollo
npm run dev
```

## 💡 Uso

### Notas Adhesivas
- **Crear Nota**: Haz clic en el botón de nota o usa Ctrl+V para pegar contenido
- **Editar**: Doble clic en el título para editar
- **Imágenes**: 
  - Pega imágenes directamente (Ctrl+V)
  - Haz clic en las imágenes para verlas en tamaño completo
  - Usa la rueda del mouse para hacer zoom
  - Arrastra para mover la imagen ampliada

### Temporizador
- Configura los tiempos de trabajo y descanso
- Inicia/pausa con el botón principal
- Monitorea tus sesiones completadas

### Tareas
- Añade tareas con el botón +
- Marca como completadas
- Asigna pomodoros objetivo
- Ordena según tu preferencia

## 🛠️ Tecnologías

- **Frontend**: React + TypeScript
- **Estilos**: SCSS + TailwindCSS
- **Editor**: TipTap
- **Build**: Vite
- **Estado**: Zustand
- **Componentes**: 
  - React-Draggable
  - React-Beautiful-DND
  - React-Icons

## 📦 Estructura del Proyecto

```
src/
├── components/
│   ├── Sticky/         # Notas adhesivas
│   ├── Timer/          # Temporizador Pomodoro
│   ├── TaskTracker/    # Seguimiento de tareas
│   ├── Player/         # Reproductor multimedia
│   └── ...
├── store/              # Estado global
├── styles/             # Estilos globales
└── utils/              # Utilidades
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

<div align="center">
  Hecho con ❤️ para aumentar la productividad
</div>
