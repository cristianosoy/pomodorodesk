import { useState } from "react";
import { Button } from "@Components/Common/Button";
import { AiFillDelete } from "react-icons/ai";
import { IoSparklesOutline } from "react-icons/io5";
import { useTask, useAIConfig } from "@Store";
import { DeleteTaskModal } from "./DeleteTaskModal";
import { aiService } from "@Root/src/services/ai";
import { failureToast, successToast } from "@Root/src/utils/toast";

export const Settings = ({ setOpenSettings, Task }) => {
  const [text, setText] = useState(Task.description);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { removeTask, setPomodoro, alertTask, renameTask } = useTask();
  const { aiConfig } = useAIConfig();
  const [isSimplifying, setIsSimplifying] = useState(false);

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

  const handleSimplifyTask = async () => {
    if (!text.trim() || isSimplifying) return;

    const { apiKey, model, promptTemplate } = aiConfig || {};
    if (!apiKey) {
      failureToast("API Key no configurada. Configure en los ajustes del Timer.", false);
      return;
    }

    try {
      setIsSimplifying(true);
      aiService.initialize({ 
        provider: 'google', 
        model: model || 'gemini-2.0-flash', 
        apiKey, 
        promptTemplate 
      });
      const simplifiedTask = await aiService.simplifyTask(text);
      setText(simplifiedTask);
      successToast("Tarea simplificada", false);
    } catch (error) {
      console.error("Error al simplificar la tarea:", error);
      failureToast("Error al simplificar la tarea", false);
    } finally {
      setIsSimplifying(false);
    }
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
    <div className="mb-6 mt-2 w-full space-y-2 rounded-lg border border-gray-200 bg-white py-2 px-1 text-gray-800 shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
      <div className="flex">
        <div className="relative flex-1">
          <input
            className="cancelDrag m-1 h-10 w-full border border-gray-300 py-2 pl-3 pr-10 text-lg dark:border-gray-500 dark:bg-gray-700 dark:text-gray-200"
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
          {aiConfig?.apiKey && (
            <button
              type="button"
              onClick={handleSimplifyTask}
              disabled={isSimplifying || !text}
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors ${
                isSimplifying ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Simplificar tarea con IA"
            >
              <IoSparklesOutline className={`text-xl ${isSimplifying ? 'animate-pulse' : ''}`} />
            </button>
          )}
        </div>
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
          className="ml-1 font-normal text-gray-800 hover:text-white dark:text-white"
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
