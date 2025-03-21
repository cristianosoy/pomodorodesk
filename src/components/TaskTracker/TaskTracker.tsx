import { useState, useEffect, useMemo } from "react";
import { Header } from "./Header";
import { Tasks } from "./Tasks";
import { AddTask } from "./AddTask";
import { IoCloseSharp, IoInformationCircleOutline } from "react-icons/io5";
import { FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";
import { useTask, useToggleTasks, usePosTask } from "@Store";
import { TaskInfoModal } from "@App/components/TaskTracker/InfoModal";
import { ClearTasksModal } from "@App/components/TaskTracker/ClearTasksModal";
import { Button } from "@Components/Common/Button";
import { ResizableBox } from "react-resizable";
import clsx from "clsx";
import "react-resizable/css/styles.css";
import "./TaskTracker.scss";

interface TaskTrackerProps {
  setIsDraggingTask: (isDragging: boolean) => void;
}

export const TaskTracker = ({ setIsDraggingTask }: TaskTrackerProps) => {
  const [showAddTask, setShowAddTask] = useState(false);
  const { setIsTasksToggled } = useToggleTasks();
  const { tasks, removeAllTasks, removeCompletedTasks, taskSortOrder, setTaskSortOrder } = useTask();
  const { taskWidth, taskHeight, setTaskSize } = usePosTask();
  const [isTaskInfoModalOpen, setIsTaskInfoModalOpen] = useState(false);
  const [isClearTasksModalOpen, setIsClearTasksModalOpen] = useState(false);
  const [isClearCompletedModalOpen, setIsClearCompletedModalOpen] = useState(false);
  const [size, setSize] = useState({ width: taskWidth || 288, height: taskHeight || 400 }); // w-72 = 18rem = 288px

  // Verificar si hay tareas completadas
  const hasCompletedTasks = tasks.some(task => task.completed);

  // Ordenar tareas según el orden seleccionado
  const sortedTasks = useMemo(() => {
    if (taskSortOrder === 'default') {
      return [...tasks]; // No ordenar, mantener orden original
    }
    
    return [...tasks].sort((a, b) => {
      if (taskSortOrder === 'completedFirst') {
        return a.completed === b.completed ? 0 : a.completed ? -1 : 1;
      } else {
        return a.completed === b.completed ? 0 : a.completed ? 1 : -1;
      }
    });
  }, [tasks, taskSortOrder]);

  // Cambiar el orden de tareas
  const toggleSortOrder = () => {
    if (taskSortOrder === 'default' || taskSortOrder === 'completedLast') {
      setTaskSortOrder('completedFirst');
    } else {
      setTaskSortOrder('completedLast');
    }
  };

  useEffect(() => {
    // Inicializar el tamaño con los valores guardados
    setSize({ width: taskWidth, height: taskHeight });
  }, [taskWidth, taskHeight]);

  const onResize = (_event: React.SyntheticEvent, { size: newSize }: { size: { width: number; height: number } }) => {
    setSize({ width: newSize.width, height: newSize.height });
  };

  const onResizeStop = () => {
    // Guardar el tamaño cuando se termina de redimensionar
    setTaskSize(size.width, size.height);
  };

  return (
    <ResizableBox
      width={size.width}
      height={size.height}
      minConstraints={[288, 300]} // min width w-72 (18rem)
      maxConstraints={[576, 800]} // max width w-144 (36rem)
      onResize={onResize}
      onResizeStop={onResizeStop}
      resizeHandles={['se']}
      className="mb-2 rounded-xl border border-gray-200/30 bg-white/[.96] shadow-lg backdrop-blur-sm dark:border-gray-700/30 dark:bg-gray-800/[.96] flex flex-col"
    >
      <div className="handle flex w-full justify-between p-3">
        <TaskInfoModal isVisible={isTaskInfoModalOpen} onClose={() => setIsTaskInfoModalOpen(false)} />
        <ClearTasksModal 
          isVisible={isClearTasksModalOpen} 
          onClose={() => setIsClearTasksModalOpen(false)}
          onConfirm={() => {
            removeAllTasks();
            setIsClearTasksModalOpen(false);
          }}
          isCompletedOnly={false}
        />
        <ClearTasksModal 
          isVisible={isClearCompletedModalOpen} 
          onClose={() => setIsClearCompletedModalOpen(false)}
          onConfirm={() => {
            removeCompletedTasks();
            setIsClearCompletedModalOpen(false);
          }}
          isCompletedOnly={true}
        />
        <div className="flex items-center space-x-2">
          <button
            className="rounded p-1 text-gray-400 hover:bg-gray-200/20 hover:text-gray-600 transition-colors dark:text-gray-500 dark:hover:text-gray-300"
            onClick={toggleSortOrder}
            title={taskSortOrder === 'completedFirst' ? 'Completadas primero' : 'Completadas al final'}
          >
            {taskSortOrder === 'completedFirst' ? (
              <FaSortAmountDown className="text-lg" />
            ) : (
              <FaSortAmountUp className="text-lg" />
            )}
          </button>
          <IoInformationCircleOutline
            className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors dark:text-gray-500 dark:hover:text-gray-300"
            onClick={() => setIsTaskInfoModalOpen(true)}
          />
        </div>
        <IoCloseSharp
          className="cursor-pointer text-gray-400 hover:text-red-500 transition-colors"
          onClick={() => setIsTasksToggled(false)}
        />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="joyRideTaskTracker px-4 pt-1 flex-1 overflow-y-auto custom-scrollbar">
          <Header title="Task Tracker" onAdd={() => setShowAddTask(!showAddTask)} showAdd={showAddTask} />
          {showAddTask && <AddTask />}
          {sortedTasks.length > 0 ? <Tasks tasks={sortedTasks} setIsDraggingTask={setIsDraggingTask} /> : (
            <div className="text-center py-4 text-gray-100 dark:text-gray-200 font-medium">
              No Tasks to Show
            </div>
          )}
        </div>
        <div className="px-4 py-3 mt-auto">
          {tasks.length > 0 && (
            <div className="flex justify-end gap-2">
              <Button 
                variant="primary" 
                onClick={() => setIsClearCompletedModalOpen(true)}
                disabled={!hasCompletedTasks}
              >
                Limpiar
              </Button>
              <Button variant="danger" onClick={() => setIsClearTasksModalOpen(true)}>
                Clear All
              </Button>
            </div>
          )}
        </div>
      </div>
    </ResizableBox>
  );
};
