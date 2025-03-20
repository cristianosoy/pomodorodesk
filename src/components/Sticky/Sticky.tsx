import { IoCloseSharp, IoEllipsisHorizontalSharp } from "react-icons/io5";
import { MouseEventHandler, useState, useEffect } from "react";
import { useStickyNote } from "@Store";
import { ColorOptions } from "@Root/src/interfaces";
import TextareaAutosize from "react-textarea-autosize";
import { ResizableBox } from "react-resizable";
import { useLockWidgetsStore } from "@Store";
import "react-resizable/css/styles.css";
import "./Sticky.scss";

interface StickyProps {
  id: number;
  text: string;
  color: string;
  setIsDragging: (isDragging: boolean) => void;
}

export const Sticky = ({ id, text, color, setIsDragging }: StickyProps) => {
  const { removeNote, editNote, stickyNotes, setStickyNotesSize } = useStickyNote();
  const { setAreWidgetsLocked } = useLockWidgetsStore();
  const [showColorSelector, setShowColorSelector] = useState(false);
  const currentNote = stickyNotes.find(note => note.id === id);
  const [size, setSize] = useState({ 
    width: currentNote?.width || 215, 
    height: currentNote?.height || 200 
  });
  const [wasLocked, setWasLocked] = useState(false);

  useEffect(() => {
    if (currentNote) {
      setSize({ 
        width: currentNote.width, 
        height: currentNote.height 
      });
    }
  }, [currentNote]);

  // Toggles the state of the color selector open/closed
  const handleToggleSelector: MouseEventHandler<SVGElement> = event => {
    event.stopPropagation();
    setShowColorSelector(!showColorSelector);
  };

  // Sets the selected color and closes the color selector
  const selectColor = (selectedColor: string) => {
    editNote(id, "color", selectedColor);
    setShowColorSelector(!showColorSelector);
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

  // Renders a row of color elements
  const displayColors = () => {
    return (
      <div className="mb-1 flex">
        {Object.values(ColorOptions).map(c => (
          <div
            key={c}
            className="h-10 w-10 cursor-pointer"
            style={{ backgroundColor: c }}
            onClick={() => selectColor(c)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="sticky-wrapper" style={{ width: size.width, height: size.height }}>
      <ResizableBox
        width={size.width}
        height={size.height}
        minConstraints={[150, 150]}
        maxConstraints={[400, 400]}
        onResize={onResize}
        onResizeStart={onResizeStart}
        onResizeStop={onResizeStop}
        resizeHandles={['se']}
        className="sticky-container"
        style={{ backgroundColor: color }}
      >
        <div className="handle-drag drag-handle">
          {showColorSelector && displayColors()}
          <div className="flex w-full justify-end p-2">
            <IoEllipsisHorizontalSharp className="mr-2 cursor-pointer" onClick={handleToggleSelector} />
            <IoCloseSharp className="cursor-pointer text-red-500 hover:bg-red-200" onClick={() => removeNote(id)} />
          </div>
        </div>
        <div className="no-drag m-auto break-words rounded pl-4 pb-4 pr-4" style={{ height: 'calc(100% - 40px)', overflow: 'auto' }}>
          <TextareaAutosize
            placeholder="Add a note"
            value={text}
            onChange={e => {
              editNote(id, "text", e.target.value);
            }}
            className="w-full h-full bg-transparent border-none outline-none resize-none"
          />
        </div>
      </ResizableBox>
    </div>
  );
};
