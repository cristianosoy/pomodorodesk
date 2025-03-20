import { useState } from "react";
import { Header } from "./Header";
import { Tasks } from "./Tasks";
import { AddTask } from "./AddTask";
import { IoCloseSharp, IoInformationCircleOutline } from "react-icons/io5";
import { useTask, useToggleTasks } from "@Store";
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
  const { tasks, removeAllTasks } = useTask();
  const [isTaskInfoModalOpen, setIsTaskInfoModalOpen] = useState(false);
  const [isClearTasksModalOpen, setIsClearTasksModalOpen] = useState(false);
  const [size, setSize] = useState({ width: 288, height: 400 }); // w-72 = 18rem = 288px

  const onResize = (_event: React.SyntheticEvent, { size: newSize }: { size: { width: number; height: number } }) => {
    setSize({ width: newSize.width, height: newSize.height });
  };

  return (
    <ResizableBox
      width={size.width}
      height={size.height}
      minConstraints={[288, 300]} // min width w-72 (18rem)
      maxConstraints={[576, 800]} // max width w-144 (36rem)
      onResize={onResize}
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
        />
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
