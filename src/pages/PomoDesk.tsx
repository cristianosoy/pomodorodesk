import { useState, useEffect } from "react";
import {
  useToggleMusic,
  useToggleTimer,
  useToggleTasks,
  useSpotifyMusic,
  usePosTask,
  useToggleStickyNote,
  useStickyNote,
  useToggleQuote,
  useToggleTwitch,
  useToggleYoutube,
  useToggleKanban,
  usePosMusic,
  usePosSpotify,
  usePosTimer,
  usePosQuote,
  usePosTwitch,
  usePosYoutube,
  usePosKanban,
  useGrid,
  useSetBackground,
} from "@Store";
import { Player } from "@Components/Player/Player";
import { Timer } from "@Components/Timer/Timer";
import { TaskTracker } from "@Components/TaskTracker/TaskTracker";
import { Spotify } from "@Components/Player/Spotify/Player";
import { BackgroundNav } from "@Components/Nav/BackgroundNav";
import { DWrapper } from "@Components/Dragggable/Draggable";
import { CustomizationButton } from "@App/components/Common/Buttons/CustomizationButton";
import { GoGear } from "react-icons/go";
import { SettingsModal } from "@App/components/Settings/Modal";
import { MdWidgets } from "react-icons/md";
import { WidgetControlModal } from "@App/components/WidgetControl/WidgetControlModal";
import { IoMdArrowDropdownCircle } from "react-icons/io";
import { Sticky } from "@Components/Sticky/Sticky";
import { Quotes } from "@App/components/Quotes/Quotes";
import useMediaQuery from "@Utils/hooks/useMediaQuery";
import { TwitchStream } from "@Components/Twitch/TwitchStream";
import { YoutubeVideo } from "@Components/Youtube/YoutubeVideo";
import { Kanban } from "@Components/Kanban/Kanban";
import { UnsplashFooter } from "../components/Nav/UnsplashFooter";
import clsx from "clsx";
import React from "react";
import { Background } from "@App/App";

export const PomoDesk = React.forwardRef<HTMLDivElement>((_props, ref) => {
  const { isMusicToggled, isMusicShown } = useToggleMusic();
  const { isTimerToggled, isTimerShown } = useToggleTimer();
  const { isTasksToggled, isTasksShown } = useToggleTasks();
  const { isSpotifyToggled, isSpotifyShown } = useSpotifyMusic();
  const { isStickyNoteShown, setIsStickyNoteShown } = useToggleStickyNote();
  const { isQuoteToggled, isQuoteShown } = useToggleQuote();
  const { isTwitchToggled, isTwitchShown } = useToggleTwitch();
  const { isYoutubeToggled, isYoutubeShown } = useToggleYoutube();
  const { isKanbanToggled, isKanbanShown } = useToggleKanban();

  // Position hooks
  const { taskPosX, taskPosY, setTaskPos } = usePosTask();
  const { musicPosX, musicPosY, setMusicPos } = usePosMusic();
  const { spotifyPosX, spotifyPosY, setSpotifyPos } = usePosSpotify();
  const { quotePosX, quotePosY, setQuotePos } = usePosQuote();
  const { timerPosX, timerPosY, setTimerPos } = usePosTimer();
  const { stickyNotes, setStickyNotesPos, addStickyNote } = useStickyNote();
  const { twitchPosX, twitchPosY, setTwitchPos } = usePosTwitch();
  const { youtubePosX, youtubePosY, setYoutubePos } = usePosYoutube();
  const { kanbanPosX, kanbanPosY, setKanbanPos } = usePosKanban();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isConfigureWidgetModalOpen, setIsConfigureWidgetModalOpen] = useState(false);
  const { backgroundId } = useSetBackground();
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const { grid } = useGrid();
  const { backgroundColor } = useSetBackground();
  const [isDraggingTask, setIsDraggingTask] = useState(false);
  const [isDraggingNote, setIsDraggingNote] = useState(false);

  // Función para manejar el evento de pegado (Ctrl+V) a nivel global
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Solo procesar si no estamos dentro de un input, textarea o elemento editable
      const target = e.target as HTMLElement;
      const isEditableTarget = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;
      
      if (!isEditableTarget) {
        // Si hay texto en el portapapeles
        if (e.clipboardData?.getData('text')) {
          const text = e.clipboardData.getData('text');
          if (text.trim()) {
            addStickyNote(text);
            setIsStickyNoteShown(true);
            return;
          }
        }
        
        // Si hay imágenes en el portapapeles
        const items = e.clipboardData?.items;
        if (items) {
          for (const item of Array.from(items)) {
            if (item.type.indexOf('image') === 0) {
              e.preventDefault();
              
              const blob = item.getAsFile();
              if (blob) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  const result = event.target?.result;
                  if (typeof result === 'string') {
                    // Crear una nota nueva con una imagen
                    const imgHtml = `<img src="${result}" alt="Imagen pegada" />`;
                    addStickyNote(imgHtml);
                    setIsStickyNoteShown(true);
                  }
                };
                reader.readAsDataURL(blob);
                return;
              }
            }
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [addStickyNote, setIsStickyNoteShown]);

  return (
    <div
      ref={ref}
      className="relative h-screen w-screen overflow-hidden"
      style={{ backgroundColor: backgroundColor }}
    >
      {backgroundId == Background.UNSPLASH && <UnsplashFooter />}
      <div className={"bodyPart ml-auto flex w-5/6 flex-wrap justify-end gap-2 py-2 px-2"}>
        <div className="settingsButton">
          <CustomizationButton
            title="Settings"
            icon={<GoGear className="-mr-1 ml-2" />}
            modal={<SettingsModal isVisible={isSettingsModalOpen} onClose={() => setSettingsModalOpen(false)} />}
            changeModal={setSettingsModalOpen}
          />
        </div>
        <div className="configureWidgetsButton">
          <CustomizationButton
            title="Configure Widgets"
            icon={<MdWidgets className="-mr-1 ml-2" />}
            modal={
              <WidgetControlModal
                isVisible={isConfigureWidgetModalOpen}
                onClose={() => setIsConfigureWidgetModalOpen(false)}
              />
            }
            changeModal={setIsConfigureWidgetModalOpen}
          />
        </div>
        <div className="chooseBackgroundButton">
          <CustomizationButton
            title="Choose Background"
            icon={<IoMdArrowDropdownCircle className="-mr-1 ml-2" />}
            modal={<BackgroundNav isVisible={isBackgroundModalOpen} onClose={() => setIsBackgroundModalOpen(false)} />}
            changeModal={setIsBackgroundModalOpen}
          />
        </div>
      </div>
      {!isDesktop ? (
        <div className="ml-8 flex flex-col items-center">
          <div className={clsx(isMusicToggled ? "block" : "hidden")}>
            <Player />
          </div>
          <div className={clsx(isSpotifyToggled ? "block" : "hidden")}>
            <Spotify />
          </div>
          <div className={clsx(isTimerToggled ? "block" : "hidden")}>
            <Timer />
          </div>
          <div className={clsx(isTasksToggled ? "block" : "hidden")}>
            <TaskTracker setIsDraggingTask={setIsDraggingTask} />
          </div>
          <div className={clsx(isQuoteToggled ? "block" : "hidden")}>
            <Quotes />
          </div>
          <div className={clsx(isKanbanToggled ? "block" : "hidden")}>
            <Kanban />
          </div>
        </div>
      ) : (
        <>
          {stickyNotes.map(stickyNote => {
            return (
              <DWrapper
                key={stickyNote.id}
                toggleHook={isStickyNoteShown}
                defaultX={stickyNote.stickyNotesPosX}
                defaultY={stickyNote.stickyNotesPosY}
                setPosition={(x: number, y: number) => setStickyNotesPos(stickyNote.id, x, y)}
                isSticky={true}
                stickyID={stickyNote.id}
                handle=".drag-handle"
                disabled={isDraggingNote}
              >
                <Sticky 
                  id={stickyNote.id} 
                  text={stickyNote.text} 
                  color={stickyNote.color} 
                  setIsDragging={setIsDraggingNote}
                />
              </DWrapper>
            );
          })}
          <DWrapper
            toggleHook={isTimerToggled && isTimerShown}
            defaultX={timerPosX}
            defaultY={timerPosY}
            setPosition={setTimerPos}
            isSticky={false}
            gridValues={grid}
          >
            <Timer />
          </DWrapper>
          <DWrapper
            toggleHook={isTasksToggled && isTasksShown}
            defaultX={taskPosX}
            defaultY={taskPosY}
            setPosition={setTaskPos}
            isSticky={false}
            gridValues={grid}
            disabled={isDraggingTask}
            handle=".handle"
          >
            <TaskTracker setIsDraggingTask={setIsDraggingTask} />
          </DWrapper>
          <DWrapper
            toggleHook={isMusicToggled && isMusicShown}
            defaultX={musicPosX}
            defaultY={musicPosY}
            setPosition={setMusicPos}
            isSticky={false}
            gridValues={grid}
          >
            <Player />
          </DWrapper>
          <DWrapper
            toggleHook={isSpotifyToggled && isSpotifyShown}
            defaultX={spotifyPosX}
            defaultY={spotifyPosY}
            setPosition={setSpotifyPos}
            isSticky={false}
            gridValues={grid}
          >
            <Spotify />
          </DWrapper>
          <DWrapper
            toggleHook={isQuoteToggled && isQuoteShown}
            defaultX={quotePosX}
            defaultY={quotePosY}
            setPosition={setQuotePos}
            isSticky={false}
            gridValues={grid}
          >
            <Quotes />
          </DWrapper>
          <DWrapper
            toggleHook={isTwitchToggled && isTwitchShown}
            defaultX={twitchPosX}
            defaultY={twitchPosY}
            setPosition={setTwitchPos}
            isSticky={false}
            gridValues={grid}
          >
            <TwitchStream />
          </DWrapper>
          <DWrapper
            toggleHook={isYoutubeToggled && isYoutubeShown}
            defaultX={youtubePosX}
            defaultY={youtubePosY}
            setPosition={setYoutubePos}
            isSticky={false}
            gridValues={grid}
          >
            <YoutubeVideo />
          </DWrapper>
          <DWrapper
            toggleHook={isKanbanToggled && isKanbanShown}
            defaultX={kanbanPosX}
            defaultY={kanbanPosY}
            setPosition={setKanbanPos}
            isSticky={false}
            gridValues={grid}
          >
            <Kanban />
          </DWrapper>
        </>
      )}
    </div>
  );
});
