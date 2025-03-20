import { useEffect } from "react";
import { IoCloseSharp } from "react-icons/io5";
import { Button } from "@Components/Common/Button";

interface ClearTasksModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ClearTasksModal = ({ isVisible = false, onClose, onConfirm }: ClearTasksModalProps) => {
  const keydownHandler = ({ key }: KeyboardEvent) => {
    switch (key) {
      case "Escape":
        onClose();
        break;
      default:
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", keydownHandler);
    return () => document.removeEventListener("keydown", keydownHandler);
  });

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-w-sm rounded-xl bg-white/[.96] p-4 text-gray-800 shadow-lg dark:border-gray-700 dark:bg-gray-800/[.96] dark:text-gray-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-end">
          <IoCloseSharp 
            className="cursor-pointer text-gray-400 hover:text-red-500 transition-colors" 
            onClick={onClose} 
          />
        </div>
        <div className="border-gray-100 pb-2">
          <div className="rounded pb-2 text-center font-bold text-lg">Eliminar Todas las Tareas</div>
          <hr className="border-t-2 w-1/4 mx-auto border-gray-200 dark:border-gray-600" />
          <div className="items-center p-4 text-center">
            ¿Estás seguro que deseas eliminar todas las tareas?
            <br />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Esta acción no se puede deshacer
            </span>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Eliminar Todo
          </Button>
        </div>
      </div>
    </div>
  );
}; 