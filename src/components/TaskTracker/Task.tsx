import { useRef, useEffect, useState, RefCallback } from "react";
import { FaCheck } from "react-icons/fa";
import { RiArrowGoBackFill } from "react-icons/ri";
import { BsThreeDotsVertical } from "react-icons/bs";
import { IoCloseSharp } from "react-icons/io5";
import { Settings } from "./Settings";
import { useTask, useTimer, useBreakStarted } from "@Store";
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

const formatTimeSpent = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

export const Task = ({ task, tasks }) => {
  const [openSettings, setOpenSettings] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { removeTask, setCompleted, toggleInProgressState, alertTask, setPomodoroCounter, toggleMenu } = useTask();
  const { breakStarted } = useBreakStarted();
  const { timerQueue } = useTimer();
  const innerRef = onClickOff(() => {
    toggleMenu(task.id, false);
  });

  // Calcular tiempo total (asumiendo 25 minutos por pomodoro)
  const timeSpentInMinutes = task.pomodoroCounter * 25;

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
    toggleInProgressState(task.id, !task.inProgress);
  };

  const markNotCompleteWhenTracking = () => {
    toggleInProgressState(task.id, !task.inProgress);
    toggleMenu(task.id, false);
    if (task.completed) setCompleted(task.id, false);
  };

  useEffect(() => {
    if (timerQueue === 0 && !task.alerted && task.inProgress) {
      setPomodoroCounter(task.id);
    }
  }, [timerQueue, breakStarted]);

  useEffect(() => {
    if (task.pomodoroCounter == task.pomodoro && !task.alerted) {
      alertTask(task.id, true);
    }
  }, [task.pomodoroCounter]);

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
                  {formatTimeSpent(timeSpentInMinutes)}
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
