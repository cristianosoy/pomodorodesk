import { useState, useEffect, useRef } from "react";
import { IoCloseSharp } from "react-icons/io5";
import { Button } from "@Components/Common/Button";
import {
  useToggleTimer,
  useShortBreakTimer,
  useLongBreakTimer,
  usePomodoroTimer,
  useHasStarted,
  useTimer,
  useBreakStarted,
  useAudioVolume,
  useAlarmOption,
  useTask,
} from "@Store";
import toast from "react-hot-toast";
import { secondsToTime, formatDisplayTime } from "@Utils/utils";
import { successToast } from "@Utils/toast";
import clsx from "clsx";

// Modal para confirmar inicio sin tareas seleccionadas
const NoTasksSelectedModal = ({ isVisible, onClose, onConfirm }) => {
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-80 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800 dark:text-gray-200">
        <h3 className="mb-4 text-lg font-medium">No hay tareas seleccionadas</h3>
        <p className="mb-6">No hay tareas marcadas como "en progreso". ¿Deseas iniciar el temporizador de todos modos?</p>
        <div className="flex justify-end space-x-3">
          <Button 
            variant="cold" 
            onClick={onClose}
            className="text-gray-800 hover:text-white dark:text-white"
          >
            Cancelar
          </Button>
          <Button 
            variant="cold" 
            onClick={onConfirm}
            className="text-gray-800 hover:text-white dark:text-white"
          >
            Iniciar de todos modos
          </Button>
        </div>
      </div>
    </div>
  );
};

export const Timer = () => {
  const { shortBreakLength, setShortBreak } = useShortBreakTimer();
  const { longBreakLength, setLongBreak } = useLongBreakTimer();
  const { pomodoroLength, setPomodoroLength } = usePomodoroTimer();
  const { hasStarted, setHasStarted } = useHasStarted();
  const { breakStarted, setBreakStarted } = useBreakStarted();
  const [breakLength, setBreakLength] = useState(shortBreakLength);
  const [timer, setTimer] = useState(60);
  const { setTimerQueue, setTimer: setGlobalTimer, setIsRunning } = useTimer();
  const [timerMinutes, setTimerMinutes] = useState("00");
  const [timerSeconds, setTimerSeconds] = useState("00");
  const [timerIntervalId, setTimerIntervalId] = useState(null);
  const [sessionType, setSessionType] = useState("Session");
  const { setIsTimerToggled } = useToggleTimer();
  const { alarm } = useAlarmOption();
  const { tasks, toggleInProgressState, setPomodoroCounter } = useTask();
  const [showNoTasksModal, setShowNoTasksModal] = useState(false);
  const [autoStartAfterBreak, setAutoStartAfterBreak] = useState(false);
  const [pendingTimerState, setPendingTimerState] = useState(null);

  const audioRef = useRef();
  const notificationRef = useRef(null);
  const { audioVolume } = useAudioVolume();

  // Efecto para manejar el inicio automático después de confirmar en el modal
  useEffect(() => {
    if (autoStartAfterBreak && !showNoTasksModal && pendingTimerState) {
      // Configurar el estado del temporizador con los valores pendientes
      setTimer(pendingTimerState.timer);
      setSessionType(pendingTimerState.sessionType);
      setBreakStarted(pendingTimerState.breakStarted);
      setTimerQueue(pendingTimerState.timerQueue);
      
      // Iniciar el temporizador
      startTimer();
      
      // Limpiar el estado pendiente
      setPendingTimerState(null);
      setAutoStartAfterBreak(false);
    }
  }, [autoStartAfterBreak, showNoTasksModal]);

  useEffect(() => {
    setHasStarted(timerIntervalId !== null);
  }, [timerIntervalId]);

  useEffect(() => {
    if (timer === 0) {
      setTimerQueue(0);
      // @ts-ignore
      audioRef.current.volume = audioVolume;
      // @ts-ignore
      audioRef.current.play();
      if (sessionType === "Session") {
        // Acaba de terminar una sesión de trabajo
        // Actualizar los indicadores de pomodoro en las tareas en progreso
        tasks.forEach(task => {
          if (task.inProgress) {
            // Incrementar el pomodoro counter para las tareas en progreso
            setPomodoroCounter(task.id);
            console.log(`Completing pomodoro for task ${task.id}: ${task.pomodoroCounter} -> ${task.pomodoroCounter + 1}`);
            
            // Pausar la tarea mientras está en break
            toggleInProgressState(task.id, false);
          }
        });
        
        // Cambiar a modo break
        setSessionType("Break");
        setTimer(breakLength);
        setBreakStarted(true);
        toast(
          t => (
            <div className="flex items-center justify-between">
              <div>Break Mode</div>
              <IoCloseSharp
                className="cursor-pointer text-red-500 hover:bg-red-200"
                onClick={() => toast.dismiss(t.id)}
              />
            </div>
          ),
          {
            duration: breakLength * 1000,
            icon: "😇",
            style: {
              borderRadius: "10px",
              padding: "16px",
              background: "#333",
              color: "#fff",
            },
          }
        );
      } else {
        // Acaba de terminar un break, volvemos a la sesión de trabajo
        const hasTasksInProgress = tasks.some(task => task.inProgress);
        
        if (!hasTasksInProgress) {
          // No hay tareas en progreso, pausar el timer y mostrar el modal
          if (timerIntervalId) {
            clearInterval(timerIntervalId);
          }
          setTimerIntervalId(null);
          setIsRunning(false);
          
          // Guardar el estado pendiente del temporizador
          setPendingTimerState({
            timer: pomodoroLength,
            sessionType: "Session",
            breakStarted: false,
            timerQueue: pomodoroLength
          });
          
          // Reproducir sonido de notificación para alertar al usuario
          if (notificationRef.current) {
            notificationRef.current.volume = audioVolume;
            notificationRef.current.play();
          }
          
          // Mostrar el modal de confirmación
          setAutoStartAfterBreak(true);
          setShowNoTasksModal(true);
          
          // Cambiar visualmente a modo sesión pero no iniciar el timer
          setSessionType("Session");
          setTimer(pomodoroLength);
          setBreakStarted(false);
          setTimerQueue(pomodoroLength);
          
          toast.dismiss();
          toast(
            t => (
              <div className="flex items-center justify-between">
                <div>Work Mode - Esperando confirmación</div>
                <IoCloseSharp
                  className="cursor-pointer text-red-500 hover:bg-red-200"
                  onClick={() => toast.dismiss(t.id)}
                />
              </div>
            ),
            {
              duration: 5000,
              icon: "⏸️",
              style: {
                borderRadius: "10px",
                padding: "16px",
                background: "#333",
                color: "#fff",
              },
            }
          );
        } else {
          // Hay tareas en progreso, continuar normalmente
          tasks.forEach(task => {
            if (task.inProgress) {
              // Reiniciar la tarea para que cuente el tiempo correctamente
              toggleInProgressState(task.id, true);
            }
          });
          
          // Cambiar a modo sesión
          setSessionType("Session");
          setTimer(pomodoroLength);
          setBreakStarted(false);
          setTimerQueue(pomodoroLength);
          toast.dismiss();
          toast(
            t => (
              <div className="flex items-center justify-between">
                <div>Work Mode</div>
                <IoCloseSharp
                  className="cursor-pointer text-red-500 hover:bg-red-200"
                  onClick={() => toast.dismiss(t.id)}
                />
              </div>
            ),
            {
              duration: breakLength * 1000,
              icon: "📚",
              style: {
                borderRadius: "10px",
                padding: "16px",
                background: "#333",
                color: "#fff",
              },
            }
          );
        }
      }
    }
  }, [timer, sessionType, audioVolume]);

  useEffect(() => {
    setTimer(pomodoroLength);
  }, [pomodoroLength]);

  useEffect(() => {
    let time = secondsToTime(timer);
    // @ts-ignore
    setTimerMinutes(time[0]);
    // @ts-ignore
    setTimerSeconds(time[1]);
  }, [timer]);

  // Show timer in page title when timer is running
  useEffect(() => {
    if (hasStarted) {
      const icon = sessionType === "Session" ? "⏱" : "☕️";
      // @ts-ignore
      document.title = `Astrostation ${icon}${formatDisplayTime(parseInt(timerMinutes))}:${formatDisplayTime(
        parseInt(timerSeconds)
      )}`;
    } else {
      document.title = "Astrostation";
    }
  }, [hasStarted, timerMinutes, timerSeconds, sessionType]);

  function startTimer() {
    console.log("Starting timer");
    setIsRunning(true);
    setHasStarted(true);
    
    // create accurate date timer with date
    const newIntervalId = setInterval(() => {
      setTimer(prevTime => {
        const newTime = prevTime - 1;
        setGlobalTimer(newTime);
        let time = secondsToTime(newTime);
        // @ts-ignore
        setTimerMinutes(time[0]);
        // @ts-ignore
        setTimerSeconds(time[1]);
        return newTime;
      });
    }, 1000);
    setTimerIntervalId(newIntervalId);
  }

  function toggleCountDown() {
    if (hasStarted) {
      // started mode - Parando el timer
      console.log("Stopping timer");
      if (timerIntervalId) {
        clearInterval(timerIntervalId);
      }
      setTimerIntervalId(null);
      setIsRunning(false);
      setHasStarted(false);
    } else {
      // stopped mode - Verificar si hay tareas en progreso
      const hasTasksInProgress = tasks.some(task => task.inProgress);
      
      if (!hasTasksInProgress && sessionType === "Session") {
        // No hay tareas en progreso y estamos en modo sesión
        setShowNoTasksModal(true);
      } else {
        // Hay tareas en progreso o estamos en modo break
        startTimer();
      }
    }
  }

  function handleResetTimer() {
    console.log("Resetting timer");
    // @ts-ignore
    audioRef?.current?.load();
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
    }
    setTimerIntervalId(null);
    setIsRunning(false);
    setHasStarted(false);
    setPomodoroLength(pomodoroLength);
    setShortBreak(shortBreakLength);
    setLongBreak(longBreakLength);
    setSessionType("Session");
    setBreakStarted(false);
    setTimer(pomodoroLength);
    setTimerQueue(pomodoroLength);
    setGlobalTimer(pomodoroLength);
    // Detener todas las tareas en progreso
    tasks.forEach(task => {
      if (task.inProgress) {
        toggleInProgressState(task.id, false);
      }
    });
  }

  function selectBreak(breakLength: number) {
    if (hasStarted) return; // guard against change when running
    if (sessionType == "Break") {
      return;
    }
    setBreakLength(breakLength);
    successToast(`Break Length Set at ${breakLength / 60} minutes`, false);
  }

  return (
    <>
      <div
        className={clsx(
          breakStarted && "bg-slate-200/[.96] shadow-lg",
          "dwidth sm:w-96` mb-2 max-w-sm rounded-lg border border-gray-200 bg-white/[.96] py-2 px-1 text-gray-800 shadow-lg dark:border-gray-700 dark:bg-gray-800/[.96] dark:text-gray-300"
        )}
      >
        <div className="text-center">
          <div className="rounded p-2 text-center">
            <div className="flex justify-end">
              <IoCloseSharp
                className="cursor-pointer text-red-500 hover:bg-red-200"
                onClick={() => setIsTimerToggled(false)}
              />
            </div>
            {/* Controls */}
            <div className="flex">
              <div className="flex flex-1 flex-col items-center justify-center">
                <Button
                  className={clsx(
                    "text-gray-800 hover:text-white dark:text-white",
                    breakLength === shortBreakLength && "bg-blue-600 text-white dark:bg-blue-700 dark:text-white border-none"
                  )}
                  variant="cold"
                  onClick={() => selectBreak(shortBreakLength)}
                  disabled={hasStarted}
                >
                  Short Break
                </Button>
              </div>

              <div className="flex flex-1 flex-col items-center justify-center">
                <Button
                  className={clsx(
                    "text-gray-800 hover:text-white dark:text-white",
                    breakLength === longBreakLength && "bg-blue-600 text-white dark:bg-blue-700 dark:text-white border-none"
                  )}
                  variant="cold"
                  onClick={() => selectBreak(longBreakLength)}
                  disabled={hasStarted}
                >
                  Long Break
                </Button>
              </div>
            </div>
            {/* Timer */}
            <div>
              <p id="tabular-nums" className={clsx(
                "text-sm mt-2 mb-1",
                sessionType === "Break" && breakLength === shortBreakLength && "text-blue-600 dark:text-blue-400",
                sessionType === "Break" && breakLength === longBreakLength && "text-blue-600 dark:text-blue-400"
              )}>
                {sessionType === "Break" ? (breakLength === shortBreakLength ? "Short Break" : "Long Break") : "Session"}
              </p>
              <div className="text-7xl font-bold tabular-nums sm:text-9xl">
                {/*// @ts-ignore */}
                {formatDisplayTime(timerMinutes)}:{/*// @ts-ignore */}
                {formatDisplayTime(timerSeconds)}
              </div>
            </div>

            <div className="timer-control tabular-nums">
              <Button
                className="font-normal tabular-nums text-gray-800 hover:text-white dark:text-white"
                onClick={() => toggleCountDown()}
                variant="cold"
              >
                <p className="tabular-nums">{hasStarted ? "Pause" : "Start"}</p>
              </Button>
              <Button
                className="ml-4 font-normal tabular-nums text-gray-800 hover:text-white dark:text-white"
                variant="cold"
                onClick={handleResetTimer}
              >
                <p className="tabular-nums">Reset</p>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <audio id="beep" preload="auto" ref={audioRef} src={alarm} />
      <audio id="notification" preload="auto" ref={notificationRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />
      
      {/* Modal para confirmar inicio sin tareas seleccionadas */}
      <NoTasksSelectedModal 
        isVisible={showNoTasksModal}
        onClose={() => {
          setShowNoTasksModal(false);
          if (autoStartAfterBreak) {
            setAutoStartAfterBreak(false);
            setPendingTimerState(null);
          }
        }}
        onConfirm={() => {
          setShowNoTasksModal(false);
          if (autoStartAfterBreak) {
            // El temporizador se iniciará automáticamente por el efecto
          } else {
            startTimer();
          }
        }}
      />
    </>
  );
};
