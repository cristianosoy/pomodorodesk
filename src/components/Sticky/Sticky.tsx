import { IoCloseSharp, IoEllipsisHorizontalSharp, IoContractOutline, IoExpandOutline } from "react-icons/io5";
import { MouseEventHandler, useState, useEffect } from "react";
import { useStickyNote } from "@Store";
import { ColorOptions } from "@Root/src/interfaces";
import { ResizableBox } from "react-resizable";
import { useLockWidgetsStore } from "@Store";
import RichTextEditor from "./RichTextEditor";
import "react-resizable/css/styles.css";
import "./Sticky.scss";

interface StickyProps {
  id: number;
  text: string;
  color: string;
  setIsDragging: (isDragging: boolean) => void;
}

// Componente para el modal de confirmación
const ConfirmModal = ({ isVisible, onConfirm, onCancel, title }) => {
  if (!isVisible) return null;
  
  return (
    <div className="sticky-modal-overlay" onClick={onCancel}>
      <div className="sticky-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sticky-modal-header">Confirmar</div>
        <div className="sticky-modal-body">
          ¿Estás seguro de que deseas eliminar la nota "{title}"?
        </div>
        <div className="sticky-modal-footer">
          <button 
            className="sticky-modal-btn sticky-modal-btn-cancel" 
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button 
            className="sticky-modal-btn sticky-modal-btn-confirm" 
            onClick={onConfirm}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

// Función para oscurecer un color hexadecimal
const darkenColor = (color: string, amount: number = 30): string => {
  // Remover el signo # si existe
  color = color.replace('#', '');
  
  // Convertir a valores RGB
  let r = parseInt(color.substring(0, 2), 16);
  let g = parseInt(color.substring(2, 4), 16);
  let b = parseInt(color.substring(4, 6), 16);
  
  // Oscurecer cada componente
  r = Math.max(0, r - amount);
  g = Math.max(0, g - amount);
  b = Math.max(0, b - amount);
  
  // Convertir de nuevo a formato hexadecimal
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

export const Sticky = ({ id, text, color, setIsDragging }: StickyProps) => {
  const { removeNote, editNote, stickyNotes, setStickyNotesSize } = useStickyNote();
  const { setAreWidgetsLocked } = useLockWidgetsStore();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [noteTitle, setNoteTitle] = useState(`Nota ${Math.floor(Math.random() * 100) + 1}`);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const currentNote = stickyNotes.find(note => note.id === id);
  const [size, setSize] = useState({ 
    width: currentNote?.width || 215, 
    height: currentNote?.height || 200 
  });
  const [wasLocked, setWasLocked] = useState(false);
  const [isMinimized, setIsMinimized] = useState(currentNote?.isMinimized || false);
  const [prevHeight, setPrevHeight] = useState(currentNote?.height || 200);

  useEffect(() => {
    if (currentNote) {
      setSize({ 
        width: currentNote.width, 
        height: currentNote.height 
      });
      // Cargar el título guardado si existe
      if (currentNote.title) {
        setNoteTitle(currentNote.title);
      }
      // Cargar el estado de minimización
      if (currentNote.isMinimized !== undefined) {
        setIsMinimized(currentNote.isMinimized);
      }
    }
  }, [currentNote]);

  // Sets the selected color
  const selectColor = (selectedColor: string) => {
    editNote(id, "color", selectedColor);
  };

  // Generar un título aleatorio si está vacío
  const generateRandomTitle = (): string => {
    const titleOptions = [
      `Nota ${Math.floor(Math.random() * 100) + 1}`,
      `Recordatorio ${Math.floor(Math.random() * 50) + 1}`,
      `Idea ${Math.floor(Math.random() * 30) + 1}`,
      `Tarea ${Math.floor(Math.random() * 20) + 1}`,
      `Pendiente ${Math.floor(Math.random() * 10) + 1}`
    ];
    return titleOptions[Math.floor(Math.random() * titleOptions.length)];
  };

  // Maneja el doble clic para editar el título
  const handleTitleDoubleClick = () => {
    setIsEditingTitle(true);
  };

  // Maneja el cambio de título
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNoteTitle(e.target.value);
  };

  // Maneja el fin de la edición del título
  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    // Si el título está vacío, generar uno aleatorio
    if (!noteTitle.trim()) {
      const newTitle = generateRandomTitle();
      setNoteTitle(newTitle);
      editNote(id, "title", newTitle);
    } else {
      editNote(id, "title", noteTitle);
    }
  };

  // Maneja la tecla enter para terminar la edición del título
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingTitle(false);
      // Si el título está vacío, generar uno aleatorio
      if (!noteTitle.trim()) {
        const newTitle = generateRandomTitle();
        setNoteTitle(newTitle);
        editNote(id, "title", newTitle);
      } else {
        editNote(id, "title", noteTitle);
      }
    }
  };

  // Maneja el clic en el botón de cerrar
  const handleCloseClick = (e) => {
    e.stopPropagation();
    setShowConfirmModal(true);
  };

  // Confirma la eliminación de la nota
  const confirmDelete = () => {
    removeNote(id);
    setShowConfirmModal(false);
  };

  // Cancela la eliminación de la nota
  const cancelDelete = () => {
    setShowConfirmModal(false);
  };

  // Handles resize start
  const onResizeStart = () => {
    setIsDragging(true);
    setAreWidgetsLocked(true);
    setWasLocked(true);
  };

  // Handles resize
  const onResize = (_event: React.SyntheticEvent, { size: newSize }: { size: { width: number; height: number } }) => {
    setSize({ width: newSize.width, height: newSize.height });
  };

  // Handle resize end
  const onResizeStop = () => {
    setStickyNotesSize(id, size.width, size.height);
    setIsDragging(false);
    if (wasLocked) {
      setAreWidgetsLocked(false);
      setWasLocked(false);
    }
  };

  // Maneja la minimización de la nota
  const toggleMinimize = (e) => {
    e.stopPropagation();
    
    if (!isMinimized) {
      // Guardar la altura actual antes de minimizar
      setPrevHeight(size.height);
      // Minimizar la nota (altura solo para la barra de título)
      const newHeight = 40;
      setSize({ ...size, height: newHeight });
      setStickyNotesSize(id, size.width, newHeight);
    } else {
      // Restaurar a la altura anterior
      setSize({ ...size, height: prevHeight });
      setStickyNotesSize(id, size.width, prevHeight);
    }
    
    // Actualizar el estado en el componente y en el store
    setIsMinimized(!isMinimized);
    editNote(id, "isMinimized", !isMinimized);
  };

  return (
    <div className="sticky-wrapper" style={{ width: size.width, height: size.height }}>
      <ResizableBox
        width={size.width}
        height={size.height}
        minConstraints={[150, isMinimized ? 40 : 150]}
        maxConstraints={[800, 600]}
        onResize={onResize}
        onResizeStart={onResizeStart}
        onResizeStop={onResizeStop}
        resizeHandles={isMinimized ? [] : ['se']}
        className="sticky-container"
        style={{ backgroundColor: color }}
      >
        <div className="handle-drag" style={{ 
          backgroundColor: darkenColor(color),
          borderBottom: isMinimized ? 'none' : '1px solid rgba(0, 0, 0, 0.1)'
        }}>
          <div className="flex w-full items-center p-1">
            <div className="drag-handle flex-grow flex items-center mr-2" style={{ minWidth: 0 }}>
              <div className="ml-2 text-sm font-medium truncate note-title" style={{ maxWidth: '100%' }}>
                {isEditingTitle ? (
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={handleTitleChange}
                    onBlur={handleTitleBlur}
                    onKeyDown={handleTitleKeyDown}
                    className="w-full bg-transparent border-none focus:outline-none px-1 cancelDrag font-bold"
                    autoFocus
                    onFocus={(e) => e.target.select()}
                  />
                ) : (
                  <span 
                    onDoubleClick={handleTitleDoubleClick}
                    className="cursor-text inline-block w-full font-bold"
                    title="Doble clic para editar"
                  >
                    {noteTitle}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center no-drag">
              {!isMinimized && (
                <div className="flex mr-2 color-dots">
                  {Object.values(ColorOptions).map(c => (
                    <div
                      key={c}
                      className={`color-dot ${color === c ? 'active' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => selectColor(c)}
                      title="Cambiar color"
                    />
                  ))}
                </div>
              )}
              <button
                onClick={toggleMinimize}
                className="text-gray-700 hover:bg-gray-200 rounded p-1 mr-1"
                title={isMinimized ? "Maximizar nota" : "Minimizar nota"}
              >
                {isMinimized ? 
                  <IoExpandOutline size={16} /> : 
                  <IoContractOutline size={16} />
                }
              </button>
              <IoCloseSharp 
                className="cursor-pointer text-red-500 hover:bg-red-200 rounded" 
                size={18} 
                onClick={handleCloseClick}
              />
            </div>
          </div>
        </div>
        {!isMinimized && (
          <div className="editor-content m-auto break-words rounded pl-4 pb-4 pr-4" style={{ overflow: 'hidden', position: 'relative' }}>
            <RichTextEditor id={id} initialText={text} />
          </div>
        )}
      </ResizableBox>
      <ConfirmModal 
        isVisible={showConfirmModal} 
        onConfirm={confirmDelete} 
        onCancel={cancelDelete} 
        title={noteTitle}
      />
    </div>
  );
};
