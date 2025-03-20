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
  const { reorderTasks } = useTask();

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
    <div className="flex flex-col h-full">
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Droppable droppableId="tasks">
          {(provided) => (
            <div 
              {...provided.droppableProps} 
              ref={provided.innerRef}
              className="min-h-[50px]"
            >
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
    </div>
  );
};
