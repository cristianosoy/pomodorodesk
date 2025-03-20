import { Task } from "./Task";
import { Button } from "@Components/Common/Button";
import { useTask } from "@Store";
import { ITask } from "@App/interfaces";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

interface TasksProps {
  tasks: ITask[];
  setIsDraggingTask: (isDragging: boolean) => void;
}

export const Tasks = ({ tasks, setIsDraggingTask }: TasksProps) => {
  const { removeAllTasks, reorderTasks } = useTask();

  function confirmClearTasks() {
    var answer = window.confirm("This will clear all current tasks");
    if (answer) {
      removeAllTasks();
    }
  }

  const handleDragStart = () => {
    setIsDraggingTask(true);
  };

  const handleDragEnd = (result) => {
    setIsDraggingTask(false);
    
    if (!result.destination) return;

    const items = Array.from(tasks) as ITask[];
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    reorderTasks(items);
  };

  return (
    <>
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Droppable droppableId="tasks">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {tasks.map((task: ITask, index: number) => (
                <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="cursor-move"
                    >
                      <Task task={task} tasks={tasks} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      {tasks && (
        <div className="mt-4 flex justify-end">
          <Button variant="danger" onClick={() => confirmClearTasks()}>
            Clear All
          </Button>
        </div>
      )}
    </>
  );
};
