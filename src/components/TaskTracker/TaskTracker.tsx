import { useState } from "react";
import { Header } from "./Header";
import { Tasks } from "./Tasks";
import { AddTask } from "./AddTask";
import { IoCloseSharp, IoInformationCircleOutline } from "react-icons/io5";
import { useTask, useToggleTasks } from "@Store";
import { TaskInfoModal } from "@App/components/TaskTracker/InfoModal";
import { Button } from "@Components/Common/Button";
import clsx from "clsx";
import "./TaskTracker.scss";

interface TaskTrackerProps {
  setIsDraggingTask: (isDragging: boolean) => void;
}

export const TaskTracker = ({ setIsDraggingTask }: TaskTrackerProps) => {
  const [showAddTask, setShowAddTask] = useState(false);
  const { setIsTasksToggled } = useToggleTasks();
  const { tasks, removeAllTasks } = useTask();
  const [isTaskInfoModalOpen, setIsTaskInfoModalOpen] = useState(false);

  const confirmClearTasks = () => {
    const answer = window.confirm("This will clear all current tasks");
    if (answer) {
      removeAllTasks();
    }
  };

  return (
    <div className="mb-2 w-72 sm:w-96 rounded-xl border border-gray-200/30 bg-white/[.96] shadow-lg backdrop-blur-sm dark:border-gray-700/30 dark:bg-gray-800/[.96] flex flex-col max-h-[80vh]">
      <div className="handle flex w-full justify-between p-3">
        <TaskInfoModal isVisible={isTaskInfoModalOpen} onClose={() => setIsTaskInfoModalOpen(false)} />
        <IoInformationCircleOutline
          className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors dark:text-gray-500 dark:hover:text-gray-300"
          onClick={() => setIsTaskInfoModalOpen(true)}
        />
        <IoCloseSharp
          className="cursor-pointer text-gray-400 hover:text-red-500 transition-colors"
          onClick={() => setIsTasksToggled(false)}
        />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="joyRideTaskTracker px-4 pt-1 flex-1 overflow-y-auto custom-scrollbar">
          <Header title="Task Tracker" onAdd={() => setShowAddTask(!showAddTask)} showAdd={showAddTask} />
          {showAddTask && <AddTask />}
          {tasks.length > 0 ? <Tasks tasks={tasks} setIsDraggingTask={setIsDraggingTask} /> : "No Tasks to Show"}
        </div>
        <div className="px-4 py-3 mt-auto">
          {tasks.length > 0 && (
            <div className="flex justify-end">
              <Button variant="danger" onClick={confirmClearTasks}>
                Clear All
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
