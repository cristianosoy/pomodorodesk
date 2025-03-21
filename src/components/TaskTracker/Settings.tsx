import { useState } from "react";
import { Button } from "@Components/Common/Button";
import { AiFillDelete } from "react-icons/ai";
import { useTask } from "@Store";
import { DeleteTaskModal } from "./DeleteTaskModal";

export const Settings = ({ setOpenSettings, Task }) => {
  const [text, setText] = useState(Task.description);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { removeTask, setPomodoro, alertTask, renameTask } = useTask();

  const [changePomo, setChangePomo] = useState(Task.pomodoro);

  const onSubmit = (e: any) => {
    e.preventDefault();

    if (Task.pomodoroCounter == Task.pomodoro) {
      alertTask(Task.id, false);
    }

    setPomodoro(Task.id, changePomo);
    renameTask(Task.id, text);
    setOpenSettings(false);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    removeTask(Task.id);
    setOpenSettings(false);
    setShowDeleteModal(false);
  };

  function handlePomoChange(e: any) {
    if (e.target.id === "decrement" && changePomo > Task.pomodoroCounter) {
      setChangePomo(changePomo - 1);
    } else if (e.target.id === "increment") {
      setChangePomo(changePomo + 1);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      onSubmit(e);
    }
  }

  return (
    <div className="mb-6 mt-2 w-full space-y-2 rounded-lg border border-gray-200 bg-white py-2 px-1 text-gray-800 shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 ">
      <div className="flex">
        <input
          className="cancelDrag m-1 h-10 w-full border border-gray-300 py-2 px-3 text-lg dark:border-gray-500 dark:bg-gray-700"
          type="text"
          placeholder={Task.description}
          value={text}
          onChange={e => {
            setText(e.target.value);
          }}
          onKeyPress={e => {
            handleKeyPress(e);
          }}
        />
      </div>
      <div className="flex items-center justify-between border-b-2 border-gray-100 px-2 pb-2">
        <div>Change Pomodoro's</div>
        <div className="bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded-md">
          <div className="flex items-center space-x-5 p-2">
            <button 
              id="decrement" 
              onClick={e => handlePomoChange(e)}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
            >
              &lt;
            </button>
            <div className="font-medium">{changePomo}</div>
            <button 
              id="increment" 
              onClick={e => handlePomoChange(e)}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
      <div className="flex justify-between">
        <Button
          className=" ml-1 font-normal text-gray-800 hover:text-white dark:text-white"
          variant="danger"
          onClick={() => setOpenSettings(false)}
        >
          Cancel
        </Button>
        <Button
          className="mr-1 font-normal text-gray-800 hover:text-white dark:text-white"
          variant="primary"
          onClick={e => onSubmit(e)}
        >
          Okay
        </Button>
      </div>
      <DeleteTaskModal
        isVisible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        taskDescription={Task.description}
      />
    </div>
  );
};
