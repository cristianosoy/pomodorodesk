import { useCallback, useState } from "react";
import { useTask, useBreakStarted, useAIConfig } from "@Store";
import { Button } from "@Components/Common/Button";
import { failureToast, successToast } from "@Root/src/utils/toast";
import { aiService } from "@Root/src/services/ai";
import { IoSparklesOutline } from "react-icons/io5";

export const AddTask = () => {
  const limit = 100;
  const [text, setText] = useState("");
  const { addTask } = useTask();
  const [pomoCounter, setPomoCounter] = useState(1);
  const [charCount, setCharCount] = useState(text.slice(0, limit));
  const { breakStarted } = useBreakStarted();
  const { aiConfig } = useAIConfig();
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const setFormattedContent = useCallback(
    text => {
      setCharCount(text.slice(0, limit));
    },
    [limit, setCharCount]
  );

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!text) {
      failureToast("Please add a task", false);
      return;
    }

    addTask(charCount, pomoCounter, breakStarted);
    setText("");
    setCharCount("");
    setPomoCounter(1);
  };

  const handleSimplifyTask = async () => {
    if (!text.trim() || isSimplifying) return;

    const { apiKey, model, promptTemplate } = aiConfig || {};
    if (!apiKey) {
      failureToast("API Key no configurada. Configure en los ajustes del Timer.", isDark);
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
      setFormattedContent(simplifiedTask);
      successToast("Tarea simplificada", isDark);
    } catch (error) {
      console.error("Error al simplificar la tarea:", error);
      failureToast("Error al simplificar la tarea", isDark);
    } finally {
      setIsSimplifying(false);
    }
  };

  function handlePomodoroChange(e: React.MouseEvent<HTMLButtonElement>) {
    const target = e.target as Element;
    if (target.id === "pomodoro-decrement" && pomoCounter > 1) {
      setPomoCounter(pomoCounter - 1);
    } else if (target.id === "pomodoro-increment" && pomoCounter < 10) {
      setPomoCounter(pomoCounter + 1);
    }
  }

  return (
    <form className="mb-8 mt-2" onSubmit={e => onSubmit(e)}>
      <div className="my-5">
        <label className="block">Task</label>
        <div className="relative">
          <input
            className="cancelDrag m-1 h-10 w-full border border-gray-300 py-2 pl-3 pr-10 text-lg dark:border-gray-500 dark:bg-gray-700 dark:text-gray-200"
            type="text"
            placeholder="Add Task"
            value={charCount}
            onChange={e => {
              setText(e.target.value);
              setFormattedContent(e.target.value);
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
        <p className="m-1 text-gray-600 dark:text-gray-400">
          {charCount.length}/{limit}
        </p>
      </div>
      <div className="my-5 flex items-center justify-center">
        <label className="flex-1">Set Pomodoro Counts</label>
        <div className="bg-gray-200 dark:bg-gray-700 dark:text-gray-200">
          <div className="flex space-x-5 p-2">
            <button type="button" id="pomodoro-decrement" onClick={e => handlePomodoroChange(e)}>
              &lt;
            </button>
            <div>{pomoCounter}</div>
            <button type="button" id="pomodoro-increment" onClick={e => handlePomodoroChange(e)}>
              &gt;
            </button>
          </div>
        </div>
      </div>

      <Button type="submit" variant="primary">
        Save
      </Button>
    </form>
  );
};
