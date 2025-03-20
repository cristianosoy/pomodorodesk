import { useEffect } from "react";
import { IoCloseSharp } from "react-icons/io5";
import { Button } from "@Components/Common/Button";

interface DeleteTaskModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskDescription: string;
}

export const DeleteTaskModal = ({ isVisible = false, onClose, onConfirm, taskDescription }: DeleteTaskModalProps) => {
  const keydownHandler = ({ key }) => {
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
    <div className="modal" onClick={onClose}>
      <div
        className="max-w-xs rounded-lg bg-white p-4 text-gray-800 shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-end">
          <IoCloseSharp className="cursor-pointer text-red-500 hover:bg-red-200" onClick={onClose} />
        </div>
        <div className="border-gray-100 pb-2">
          <div className="rounded pb-2 text-center font-bold">Eliminar Tarea</div>
          <hr className="border-t-3 w-1/4 border-[#5c5c5c]" />
          <div className="items-center p-2 px-2">
            ¿Estás seguro que deseas eliminar la tarea "{taskDescription}"?
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="danger" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}; 