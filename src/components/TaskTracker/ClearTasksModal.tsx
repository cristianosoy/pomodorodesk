import { useEffect } from "react";
import { IoCloseSharp } from "react-icons/io5";
import { Button } from "@Components/Common/Button";

interface ClearTasksModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isCompletedOnly?: boolean;
}

export const ClearTasksModal = ({ 
  isVisible = false, 
  onClose, 
  onConfirm, 
  isCompletedOnly = false 
}: ClearTasksModalProps) => {
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

  // Textos según el tipo de modal
  const title = isCompletedOnly ? "Eliminar Tareas Completadas" : "Eliminar Todas las Tareas";
  const confirmButtonText = isCompletedOnly ? "Eliminar Completadas" : "Eliminar Todo";
  const questionText = isCompletedOnly 
    ? "¿Estás seguro que deseas eliminar todas las tareas completadas?" 
    : "¿Estás seguro que deseas eliminar todas las tareas?";

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
          <div className="rounded pb-2 text-center font-bold text-lg">{title}</div>
          <hr className="border-t-2 w-1/4 mx-auto border-gray-200 dark:border-gray-600" />
          <div className="items-center p-4 text-center">
            {questionText}
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
            {confirmButtonText}
          </Button>
        </div>
      </div>
    </div>
  );
}; 