import { useRef, useEffect, useState } from "react";
import { FaCheck } from "react-icons/fa";
import { RiArrowGoBackFill } from "react-icons/ri";
import { BsThreeDotsVertical } from "react-icons/bs";
import { IoCloseSharp } from "react-icons/io5";
import { Settings } from "./Settings";
import { useTask, useTimer, useBreakStarted, useHasStarted } from "@Store";
import clsx from "clsx";
import { ITask } from "@Root/src/interfaces";
import { DeleteTaskModal } from "./DeleteTaskModal";
import { onClickOff } from "../../utils/hooks/useClickOff";

// TODO: Remove alerted
// TODO: Add a blurb/instructions to let users know how to toggle

const ProgressDot = ({ filled, alerted }) => (
  <div 
    className={clsx(
      "w-2 h-2 rounded-full transition-all duration-300 ease-in-out mx-0.5",
      filled && !alerted && "bg-cyan-500",
      filled && alerted && "bg-green-500",
      !filled && "bg-gray-600/40 dark:bg-gray-600/60"
    )}
  />
);

const formatTimeSpent = (seconds: number): string => {
  if (!seconds && seconds !== 0) return "0s";
  
  if (seconds < 60) {
    return `${seconds}s`;
  }
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(seconds / 3600);
  const remainingMinutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  let result = `${hours}h`;
  if (remainingMinutes > 0) result += ` ${remainingMinutes}m`;
  if (remainingSeconds > 0) result += ` ${remainingSeconds}s`;
  return result;
};

export const Task = ({ task, tasks }) => {
  const [openSettings, setOpenSettings] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [displayTime, setDisplayTime] = useState(task.timeSpentSeconds || 0);
  
  const { removeTask, setCompleted, toggleInProgressState, alertTask, setPomodoroCounter, toggleMenu } = useTask();
  const { breakStarted } = useBreakStarted();
  const { isRunning } = useTimer();
  const { timerQueue } = useTimer();
  
  const innerRef = onClickOff(() => {
    toggleMenu(task.id, false);
  });

  // Efecto para actualizar la visualización del tiempo
  useEffect(() => {
    // Solo mostrar el tiempo actual almacenado en la tarea
    setDisplayTime(task.timeSpentSeconds || 0);
    
    // No hacer nada si:
    // 1. La tarea no está en progreso
    // 2. El timer no está corriendo
    // 3. Estamos en un break
    if (!task.inProgress || !isRunning || breakStarted) {
      console.log(`Task ${task.id} timer not running - inProgress: ${task.inProgress}, isRunning: ${isRunning}, breakStarted: ${breakStarted}`);
      return;
    }
    
    console.log(`Task ${task.id} (${task.description}) timer started - inProgress: ${task.inProgress}, isRunning: ${isRunning}`);
    
    // Configurar un intervalo para actualizar el tiempo mostrado
    const intervalId = setInterval(() => {
      // Solo incrementar el tiempo si la tarea está en progreso y el timer está corriendo
      if (task.inProgress && isRunning && !breakStarted) {
        setDisplayTime(prev => prev + 1);
        console.log(`Task ${task.id} time updated: ${displayTime + 1}s`);
      }
    }, 1000);
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log(`Task ${task.id} timer stopped`);
      }
    };
  }, [task.inProgress, isRunning, breakStarted, task.id, task.timeSpentSeconds]);
  
  // Efecto para guardar el tiempo transcurrido cuando se detiene el temporizador o cambia el estado de la tarea
  useEffect(() => {
    // Solo guardar el tiempo cuando:
    // 1. El timer estaba corriendo y ahora se detuvo mientras la tarea está en progreso
    // 2. O cuando la tarea deja de estar en progreso
    if ((task.inProgress && !isRunning) || (!task.inProgress && displayTime > 0)) {
      console.log(`Task ${task.id} saving time: ${displayTime}s`);
      
      // Actualizar el tiempo en el store
      // Primero desactivamos para guardar el tiempo
      if (task.inProgress) {
        toggleInProgressState(task.id, false);
      }
      
      // Si la tarea debe seguir en progreso, la reactivamos
      if (task.inProgress) {
        toggleInProgressState(task.id, true);
      }
    }
  }, [isRunning, task.inProgress]);
  
  // Manejar la finalización de un pomodoro
  useEffect(() => {
    // Activamos este efecto cuando:
    // 1. El timer llega a 0 (timerQueue === 0) y estamos en una sesión (!breakStarted)
    // O
    // 2. Cuando cambia el pomodoroCounter de la tarea (significa que se incrementó en el Timer)
    
    if (task.pomodoroCounter > 0) {
      console.log(`Task ${task.id} has ${task.pomodoroCounter}/${task.pomodoro} pomodoros completed`);
      
      // Si se completaron todos los pomodoros, marcar como completada
      if (task.pomodoroCounter >= task.pomodoro) {
        console.log(`Task ${task.id} completed all pomodoros`);
        toggleInProgressState(task.id, false);
        setCompleted(task.id, true);
      }
    }
  }, [task.pomodoroCounter, task.pomodoro]);
  
  // Verificar si la tarea debe ser alertada (todos los pomodoros completados)
  useEffect(() => {
    if (task.pomodoroCounter === task.pomodoro && !task.alerted && !task.completed) {
      console.log(`Task ${task.id} alerting - all pomodoros completed!`);
      alertTask(task.id, true);
    }
  }, [task.pomodoroCounter, task.pomodoro]);

  const openContextMenu = event => {
    event.preventDefault();
    toggleMenu(task.id, !task.menuToggled);
    tasks.forEach((task_: ITask) => {
      if (task_.menuToggled) toggleMenu(task_.id, false);
    });
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    removeTask(task.id);
    setShowDeleteModal(false);
  };

  /* Observation: When double clicking a task the text is highlighted
     This may not be a huge UX blunder, but it does exist. TBD */
  const preventFalseInProgress = () => {
    if (task.completed) {
      return;
    }
    console.log("Toggling task:", task.id, "Current state:", task.inProgress, "-> New state:", !task.inProgress);
    toggleInProgressState(task.id, !task.inProgress);
  };

  const markNotCompleteWhenTracking = () => {
    toggleInProgressState(task.id, !task.inProgress);
    toggleMenu(task.id, false);
    if (task.completed) setCompleted(task.id, false);
  };

  return (
    <>
      {!openSettings ? (
        <div
          onContextMenu={openContextMenu}
          className={clsx(
            "group mb-2 flex cursor-pointer items-center justify-between rounded-lg border p-2 transition-all duration-200 ease-in-out",
            task.completed && "border-green-500 bg-green-600 text-white",
            task.inProgress && !task.completed && "border-cyan-500 bg-cyan-600 text-white",
            task.alerted && !task.completed && "border-red-500 bg-red-600 text-white",
            !task.inProgress && !task.completed && !task.alerted && "border-gray-600 bg-gray-700/80 text-gray-100"
          )}
          onClick={preventFalseInProgress}
        >
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center">
              <span className={clsx("text-sm", task.completed && "line-through")}>
                {task.description}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              {/* Contenedor de tiempo y progreso */}
              <div className="flex flex-col items-end gap-1.5">
                {/* Tiempo total invertido */}
                <span className="text-xs font-light opacity-80">
                  {formatTimeSpent(displayTime)}
                </span>
                
                {/* Puntos de progreso */}
                <div className="flex items-center">
                  {[...Array(task.pomodoro)].map((_, index) => (
                    <ProgressDot 
                      key={index} 
                      filled={index < task.pomodoroCounter}
                      alerted={task.alerted} 
                    />
                  ))}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center space-x-2">
                <IoCloseSharp
                  className="cursor-pointer text-red-300 hover:text-red-100 hover:bg-red-500/30 rounded"
                  onClick={() => handleDelete()}
                />
                <BsThreeDotsVertical 
                  className="cursor-pointer text-gray-300 hover:text-white" 
                  onClick={() => setOpenSettings(!openSettings)} 
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Settings setOpenSettings={setOpenSettings} Task={task} />
      )}
      <div className="absolute">
        {task.menuToggled && (
          <div ref={innerRef} className="rounded-md bg-neutral-800">
            <ul className="w-full">
              <li
                onClick={markNotCompleteWhenTracking}
                className="cursor-pointer rounded-md px-5 py-2 hover:bg-neutral-600"
              >
                <div className="select-none">
                  {task.inProgress ? "Untrack Task" : "Track Task"}
                </div>
              </li>
              <li
                onClick={() => {
                  setCompleted(task.id, !task.completed);
                  toggleMenu(task.id, false);
                }}
                className="cursor-pointer rounded-md px-5 py-2 hover:bg-neutral-600"
              >
                <div className="select-none">Complete Task</div>
              </li>
            </ul>
          </div>
        )}
      </div>
      <DeleteTaskModal
        isVisible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        taskDescription={task.description}
      />
    </>
  );
};
