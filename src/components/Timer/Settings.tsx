import { useState, useEffect } from "react";
import Slider from "rc-slider";
import {
  useDarkToggleStore,
  useShortBreakTimer,
  useLongBreakTimer,
  usePomodoroTimer,
  useHasStarted,
  useAudioVolume,
  useAlarmOption,
  useGrid,
  useLockWidgetsStore,
  useSeoVisibilityStore,
  useAIConfig,
} from "@Store";
import { IAIConfig } from "@Root/src/interfaces";
import { IoCloseSharp } from "react-icons/io5";
import { BsMusicPlayerFill, BsBellFill } from "react-icons/bs";
import { GiPanFlute } from "react-icons/gi";
import { CgPiano } from "react-icons/cg";
import { FiClock, FiSettings, FiVolume2 } from "react-icons/fi";
import { BiBot, BiMusic } from "react-icons/bi";
import { Button } from "@Components/Common/Button";
import { ToggleOption } from "./ToggleOption";
import { successToast, failureToast } from "@App/utils/toast";
import useSetDefault from "@App/utils/hooks/useSetDefault";
import clsx from "clsx";
import { aiService, GeminiModel } from "@Root/src/services/ai";
import { ISongTask } from "@Root/src/interfaces";
import { useSongLibrary } from "@Root/src/store";
import { verifyVideoExistence, checkVideoDetails } from "@Root/src/services/youtube";

import piano from "/assets/music/piano.wav";
import flute from "/assets/music/flute.wav";
import arcade from "/assets/music/arcade.wav";
import bells from "/assets/music/bells.wav";

// Tipo para las pestañas
type TabType = "time" | "alarm" | "layout" | "ai" | "music";

export const TimerSettings = ({ onClose }) => {
  const { isDark } = useDarkToggleStore();
  const { shortBreakLength, setShortBreak } = useShortBreakTimer();
  const { longBreakLength, setLongBreak } = useLongBreakTimer();
  const { pomodoroLength, setPomodoroLength } = usePomodoroTimer();
  const { hasStarted } = useHasStarted();
  const [pomoCount, setPomoCount] = useState(pomodoroLength);
  const [shortBreak, setShortBreakState] = useState(shortBreakLength);
  const [longBreak, setLongBreakState] = useState(longBreakLength);
  const { audioVolume, setAudioVolume } = useAudioVolume();
  const [currentVolume, setCurrentVolume] = useState(audioVolume);
  const { alarm, setAlarm } = useAlarmOption();
  const [currentAlarm, setCurrentAlarm] = useState(alarm);
  const { grid, setGrid } = useGrid();
  const [currentGrid, setCurrentGrid] = useState(grid);
  const { areWidgetsLocked, setAreWidgetsLocked } = useLockWidgetsStore();
  const { isSeoVisible, setSeoVisibility } = useSeoVisibilityStore();
  const [currentWidgetLockState, setCurrentWidgetLockState] = useState(areWidgetsLocked);
  const { aiConfig, setAIConfig, clearAIConfig } = useAIConfig();
  const [currentApiKey, setCurrentApiKey] = useState(aiConfig?.apiKey || "");
  const [currentModel, setCurrentModel] = useState<IAIConfig['model']>(
    aiConfig?.model || "gemini-2.0-flash"
  );
  const [currentPromptTemplate, setCurrentPromptTemplate] = useState(
    aiConfig?.promptTemplate || "Simplifica este nombre de tarea manteniendo la esencia pero haciéndolo más conciso. Máximo 50 caracteres. SOLO devuelve el texto simplificado, sin comillas ni explicaciones adicionales. La tarea es: "
  );
  const [availableModels, setAvailableModels] = useState<GeminiModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const { songs, setSongs, resetSongs } = useSongLibrary();
  const [currentSongs, setCurrentSongs] = useState<ISongTask[]>(songs);
  const [newStationId, setNewStationId] = useState("");
  const [newStationName, setNewStationName] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [stationStatuses, setStationStatuses] = useState<Record<string, { isOnline: boolean, details?: string}>>({});
  const [checkingStatus, setCheckingStatus] = useState<string | null>(null);
  const [youtubeApiKey, setYoutubeApiKey] = useState<string>(localStorage.getItem('youtube_api_key') || '');
  
  // Estado para la pestaña actual
  const [activeTab, setActiveTab] = useState<TabType>("time");

  useEffect(() => {
    const loadModels = async () => {
      if (!currentApiKey) return;
      
      try {
        setIsLoadingModels(true);
        aiService.initialize({ provider: 'google', model: currentModel, apiKey: currentApiKey });
        const models = await aiService.getAvailableModels();
        setAvailableModels(models);
        
        // Si el modelo actual no está en la lista, seleccionar el primero disponible
        if (models.length > 0 && !models.some(m => m.name === currentModel)) {
          setCurrentModel(models[0].name as IAIConfig['model']);
        }
      } catch (error) {
        console.error("Error loading models:", error);
        failureToast("Error al cargar los modelos disponibles", false);
      } finally {
        setIsLoadingModels(false);
      }
    };

    loadModels();
  }, [currentApiKey]);

  useEffect(() => {
    // Verificar estados de las emisoras al cargar
    if (currentSongs.length > 0) {
      currentSongs.forEach(song => {
        checkStationStatus(song.id);
      });
    }
  }, []);

  // Función para verificar si una emisora está en línea
  const checkStationStatus = async (id: string) => {
    setCheckingStatus(id);
    try {
      // Verificar estado completo del video
      const videoStatus = await checkVideoDetails(id);
      
      // Determinar el estado detallado para mostrar como tooltip
      let details = '';
      
      if (videoStatus.status === 'online') {
        if (videoStatus.isLive) {
          details = 'Transmisión en vivo activa';
          if (videoStatus.details?.streamStatus) {
            details += ` (${videoStatus.details.streamStatus})`;
          }
        } else {
          details = 'Video disponible (no es transmisión en vivo)';
        }
      } else if (videoStatus.status === 'offline') {
        details = 'No disponible';
        if (videoStatus.details?.streamStatus) {
          details += ` (${videoStatus.details.streamStatus})`;
        }
      } else {
        details = 'Estado desconocido';
      }
      
      setStationStatuses(prev => ({
        ...prev,
        [id]: {
          isOnline: videoStatus.status === 'online',
          details
        }
      }));
    } catch (error) {
      console.error("Error verificando estado de la emisora:", error);
      setStationStatuses(prev => ({
        ...prev,
        [id]: {
          isOnline: false,
          details: 'Error al verificar estado'
        }
      }));
    } finally {
      setCheckingStatus(null);
    }
  };

  // Función para abrir la URL de YouTube
  const openYoutubeUrl = (id: string) => {
    window.open(`https://www.youtube.com/watch?v=${id}`, '_blank');
  };

  function onDefaultChange() {
    if (currentGrid === null) {
      return 0;
    }
    return currentGrid[0];
  }

  const setDefault = useSetDefault();

  function onVolumeChange(value: number) {
    setCurrentVolume(value);
  }

  function onGridChange(value: number) {
    if (value == 0) {
      setCurrentGrid(null);
      return;
    }
    setCurrentGrid([value, value]);
  }

  function onSubmit() {
    setShortBreak(shortBreak);
    setLongBreak(longBreak);
    setPomodoroLength(pomoCount);
    setAudioVolume(currentVolume);
    setAlarm(currentAlarm);
    setGrid(currentGrid);
    setAreWidgetsLocked(currentWidgetLockState);
    if (currentApiKey) {
      setAIConfig({
        provider: "google",
        model: currentModel,
        apiKey: currentApiKey,
        promptTemplate: currentPromptTemplate,
      });
    } else {
      clearAIConfig();
    }
    
    // Guardar la clave de API de YouTube
    if (youtubeApiKey) {
      localStorage.setItem('youtube_api_key', youtubeApiKey);
    } else {
      localStorage.removeItem('youtube_api_key');
    }
    
    setSongs(currentSongs);
    onClose();
    successToast("Settings saved", isDark);
  }

  function handleDefaults() {
    if (hasStarted) return;

    var answer = window.confirm("Are you sure you want to reset to defaults?");
    if (answer) {
      // set master states
      setDefault();

      // set local states
      setPomoCount(1500);
      setShortBreakState(300);
      setLongBreakState(900);
      setCurrentVolume(0.7);
      setCurrentAlarm(
        "https://raw.githubusercontent.com/freeCodeCamp/cdn/master/build/testable-projects-fcc/audio/BeepSound.wav"
      );
      setCurrentGrid(null);
      setCurrentWidgetLockState(false);
      clearAIConfig();
      setCurrentApiKey("");
      setCurrentModel("gemini-2.0-flash");
      setCurrentPromptTemplate("Simplifica este nombre de tarea manteniendo la esencia pero haciéndolo más conciso. Máximo 50 caracteres. SOLO devuelve el texto simplificado, sin comillas ni explicaciones adicionales. La tarea es: ");
      resetSongs();
      setCurrentSongs(useSongLibrary.getState().songs);
    }
  }

  function handleLengthChange(
    e: any,
    decrement: string,
    increment: string,
    minLength: number,
    maxLength: number,
    propertyLength: number,
    setStateFunc: (val: number) => void,
    step: number
  ) {
    if (hasStarted) return; // guard against change when running

    if (e.target.id === decrement && propertyLength > minLength) {
      setStateFunc(propertyLength - step);
      e.target.nextSibling.value = Math.floor((propertyLength - step) / 60);
    } else if (e.target.id === increment && propertyLength < maxLength) {
      setStateFunc(propertyLength + step);
      e.target.previousSibling.value = Math.floor((propertyLength + step) / 60);
    }
  }

  function changeAlarm(alarmPath: string) {
    let audioRef = new Audio(alarmPath);
    audioRef.volume = currentVolume;
    audioRef.play();
    setCurrentAlarm(alarmPath);
  }

  function unHideInfo() {
    setSeoVisibility(true);
    onClose();
    successToast("Info now visible", isDark);
  }

  function addStation() {
    if (!newStationId.trim() || !newStationName.trim()) {
      failureToast("Ingresa tanto el ID como el nombre de la estación", isDark);
      return;
    }

    if (!isValidYoutubeId(newStationId)) {
      failureToast("ID de YouTube inválido", isDark);
      return;
    }

    // Verificar estado de la nueva emisora
    checkStationStatus(newStationId);

    if (editingIndex !== null) {
      // Editing existing station
      const updatedSongs = [...currentSongs];
      updatedSongs[editingIndex] = {
        id: newStationId,
        artist: newStationName,
        link: `https://www.youtube.com/watch?v=${newStationId}`
      };
      setCurrentSongs(updatedSongs);
      successToast("Estación actualizada", isDark);
    } else {
      // Adding new station
      setCurrentSongs([
        ...currentSongs,
        {
          id: newStationId,
          artist: newStationName,
          link: `https://www.youtube.com/watch?v=${newStationId}`
        }
      ]);
      successToast("Estación añadida", isDark);
    }

    // Reset form
    setNewStationId("");
    setNewStationName("");
    setEditingIndex(null);
  }

  function editStation(index: number) {
    const station = currentSongs[index];
    setNewStationId(station.id);
    setNewStationName(station.artist);
    setEditingIndex(index);
  }

  function deleteStation(index: number) {
    if (currentSongs.length <= 1) {
      failureToast("Debes mantener al menos una estación", isDark);
      return;
    }
    
    const updatedSongs = [...currentSongs];
    updatedSongs.splice(index, 1);
    setCurrentSongs(updatedSongs);
    
    if (editingIndex === index) {
      setNewStationId("");
      setNewStationName("");
      setEditingIndex(null);
    }
  }

  function isValidYoutubeId(id: string) {
    // Simple validation for YouTube ID
    return /^[a-zA-Z0-9_-]{11}$/.test(id);
  }

  function extractYoutubeId(url: string) {
    if (!url) return "";
    
    // Regular expressions for different YouTube URL formats
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[7].length === 11) ? match[7] : "";
  }

  function handlePasteUrl() {
    navigator.clipboard.readText().then(text => {
      const id = extractYoutubeId(text);
      if (id) {
        setNewStationId(id);
        // Try to extract a name from the URL
        try {
          const url = new URL(text);
          const title = url.searchParams.get("title");
          if (title) {
            setNewStationName(title);
          }
        } catch (e) {
          // Not a valid URL, ignore
        }
      } else {
        failureToast("URL de YouTube inválida", isDark);
      }
    }).catch(err => {
      failureToast("No se pudo acceder al portapapeles", isDark);
    });
  }

  // Componente para las pestañas
  const TabButton = ({ id, label, icon, isActive }: {id: TabType, label: string, icon: React.ReactNode, isActive: boolean}) => (
    <button
      onClick={() => setActiveTab(id)}
      className={clsx(
        "flex items-center justify-center gap-2 px-4 py-2 rounded-t-lg",
        isActive 
          ? "bg-white text-gray-800 dark:bg-gray-700 dark:text-white border-b-2 border-blue-500" 
          : "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  // Renderizar el contenido basado en la pestaña activa
  const renderTabContent = () => {
    switch (activeTab) {
      case "time":
  return (
          <div className="p-4">
          <div className="rounded p-2 text-center">
            Time <span className="italic">(minutes)</span>
          </div>
          <div className="flex items-center justify-between gap-6 text-center">
            <ToggleOption
              title="Pomodoro"
              decrement="session-decrement"
              increment="session-increment"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                handleLengthChange(e, "session-decrement", "session-increment", 60, 3600, pomoCount, setPomoCount, 60)
              }
              onChange={e => {
                if (hasStarted) {
                  e.target.readOnly = true;
                  return;
                }
                setPomoCount(e.target.value * 60);
              }}
              propertyLength={Math.floor(pomoCount / 60)}
              hasStarted={hasStarted}
            />
            <ToggleOption
              title="Short Break"
              decrement="short-break-decrement"
              increment="short-break-increment"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                handleLengthChange(
                  e,
                  "short-break-decrement",
                  "short-break-increment",
                  60,
                  3600,
                  shortBreak,
                  setShortBreakState,
                  60
                )
              }
              onChange={e => {
                if (hasStarted) {
                  e.target.readOnly = true;
                  return;
                }
                setShortBreakState(e.target.value * 60);
              }}
              propertyLength={Math.floor(shortBreak / 60)}
              hasStarted={hasStarted}
            />
            <ToggleOption
              title="Long Break"
              decrement="long-break-decrement"
              increment="long-break-increment"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                handleLengthChange(
                  e,
                  "long-break-decrement",
                  "long-break-increment",
                  60,
                  3600,
                  longBreak,
                  setLongBreakState,
                  60
                )
              }
              onChange={e => {
                if (hasStarted) {
                  e.target.readOnly = true;
                  return;
                }
                setLongBreakState(e.target.value * 60);
              }}
              propertyLength={Math.floor(longBreak / 60)}
              hasStarted={hasStarted}
            />
          </div>
        </div>
        );
      case "alarm":
        return (
          <>
        <div className="border-gray-100 p-4">
          <div className="rounded p-2 text-center">Alarm Volume</div>
          <div className="items-center px-2 pb-2">
            <Slider
              defaultValue={audioVolume}
              onChange={value => {
                onVolumeChange(value as number);
              }}
              step={0.1}
              min={0}
              max={1}
            />
          </div>
        </div>
            <hr className="border-t-1 border-gray-200 dark:border-gray-700" />
        <div className="border-gray-100 p-4">
          <div className="rounded p-2 text-center">Alarm Sound</div>
          <div className="flex items-center justify-between gap-2 pb-2 text-center">
            <div className="w-1/4">
              Retro
              <div
                className={clsx(
                  "flex cursor-pointer items-center justify-center bg-gray-200 p-2 text-center dark:bg-gray-700 dark:text-gray-200",
                      currentAlarm == arcade && "border-2 border-blue-500"
                )}
                onClick={() => changeAlarm(arcade)}
              >
                <BsMusicPlayerFill />
              </div>
            </div>
            <div className="w-1/4">
              Bells
              <div
                className={clsx(
                  "flex cursor-pointer items-center justify-center bg-gray-200 p-2 text-center dark:bg-gray-700 dark:text-gray-200",
                      currentAlarm == bells && "border-2 border-blue-500"
                )}
                onClick={() => changeAlarm(bells)}
              >
                <BsBellFill />
              </div>
            </div>
            <div className="w-1/4">
              Flute
              <div
                className={clsx(
                  "flex cursor-pointer items-center justify-center bg-gray-200 p-2 text-center dark:bg-gray-700 dark:text-gray-200",
                      currentAlarm == flute && "border-2 border-blue-500"
                )}
                onClick={() => changeAlarm(flute)}
              >
                <GiPanFlute />
              </div>
            </div>
            <div className="w-1/4">
              Piano
              <div
                className={clsx(
                  "flex cursor-pointer items-center justify-center bg-gray-200 p-2 text-center dark:bg-gray-700 dark:text-gray-200",
                      currentAlarm == piano && "border-2 border-blue-500"
                )}
                onClick={() => changeAlarm(piano)}
              >
                <CgPiano />
              </div>
            </div>
          </div>
        </div>
          </>
        );
      case "layout":
        return (
          <>
        <div className="border-gray-100 p-4">
          <div className="rounded p-2 text-center">Grid Size (increasing Step Size)</div>
          <div className="items-center px-2 pb-2">
            <Slider
              //@ts-ignore
              defaultValue={onDefaultChange}
              onChange={value => {
                onGridChange(value as number);
              }}
              step={50}
              min={0}
              max={150}
            />
          </div>
        </div>
            <hr className="border-t-1 border-gray-200 dark:border-gray-700" />
        <div className="border-gray-100 p-4">
          <div className="rounded pb-2 text-center">Lock Widgets In-place</div>
          <div className="flex justify-center">
            <Button
              className={clsx(
                "float-right w-[70%] font-normal text-gray-800 hover:text-white dark:text-white ",
                currentWidgetLockState && " bg-red-500 hover:bg-red-700"
              )}
              variant="primary"
              onClick={() => setCurrentWidgetLockState(!currentWidgetLockState)}
            >
              {currentWidgetLockState ? "Unlock" : "Lock"} Widgets
            </Button>
          </div>
        </div>
          </>
        );
      case "ai":
        return (
          <div className="border-gray-100 p-4">
            <div className="rounded p-2 text-center">Configuración de Inteligencia Artificial</div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">API Key de Google</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                  value={currentApiKey}
                  onChange={(e) => setCurrentApiKey(e.target.value)}
                  placeholder="Ingresa tu API Key de Google"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Obtén tu API Key en <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-blue-500">Google AI Studio</a>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Modelo de Gemini</label>
                <select
                  className="w-full px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                  value={currentModel}
                  onChange={(e) => setCurrentModel(e.target.value as IAIConfig['model'])}
                  disabled={isLoadingModels || !currentApiKey}
                >
                  {isLoadingModels ? (
                    <option>Cargando modelos...</option>
                  ) : availableModels.length > 0 ? (
                    availableModels.map((model) => (
                      <option key={model.name} value={model.name}>
                        {model.displayName}
                      </option>
                    ))
                  ) : !currentApiKey ? (
                    <option>Ingresa tu API Key para ver los modelos disponibles</option>
                  ) : (
                    <option>No se encontraron modelos disponibles</option>
                  )}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Los modelos se cargan automáticamente desde la API de Google
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prompt para simplificación</label>
                <textarea
                  className="w-full px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 dark:text-gray-200 resize-vertical"
                  value={currentPromptTemplate}
                  onChange={(e) => setCurrentPromptTemplate(e.target.value)}
                  placeholder="Personaliza el prompt para simplificar tareas"
                  rows={4}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  El texto de la tarea se agregará al final de este prompt. Personalízalo según tus preferencias.
                </p>
              </div>
            </div>
          </div>
        );
      case "music":
        return (
          <div className="border-gray-100 p-4">
            <div className="rounded p-2 text-center">Configuración de Emisoras de Música</div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">API Key de YouTube (Opcional)</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                  value={youtubeApiKey}
                  onChange={(e) => setYoutubeApiKey(e.target.value)}
                  placeholder="Ingresa tu API Key de YouTube"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  La API Key te permitirá verificar con más precisión si las emisoras están en línea. Obtén una en <a href="https://console.developers.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500">Google Cloud Console</a>
                </p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Emisoras configuradas</h3>
                {currentSongs.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto border dark:border-gray-700 rounded-md">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID YouTube</th>
                          <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
                        {currentSongs.map((station, index) => (
                          <tr key={station.id} className={`${editingIndex === index ? 'bg-blue-50 dark:bg-blue-900' : ''}`}>
                            <td className="px-2 py-2 whitespace-nowrap text-sm text-center">
                              {checkingStatus === station.id ? (
                                <div className="w-3 h-3 mx-auto bg-yellow-400 rounded-full animate-pulse"></div>
                              ) : (
                                <div 
                                  className={`w-3 h-3 mx-auto ${stationStatuses[station.id]?.isOnline ? 'bg-green-500' : 'bg-red-500'} rounded-full`}
                                  title={stationStatuses[station.id]?.details}
                                  onClick={() => checkStationStatus(station.id)}
                                ></div>
                              )}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{station.artist}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{station.id}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-right text-sm">
                              <button
                                onClick={() => openYoutubeUrl(station.id)}
                                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 mr-2"
                                title="Abrir en YouTube"
                              >
                                Ver
                              </button>
                              <button
                                onClick={() => editStation(index)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mr-2"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => deleteStation(index)}
                                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center p-4 text-gray-500 dark:text-gray-400">
                    No hay emisoras configuradas
                  </div>
                )}
              </div>
              
              <div className="border-t dark:border-gray-700 pt-4">
                <h3 className="text-sm font-medium mb-2">
                  {editingIndex !== null ? 'Editar emisora' : 'Añadir nueva emisora'}
                </h3>
                <div className="flex flex-col space-y-2">
                  <div>
                    <label className="block text-sm mb-1">ID de YouTube</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={newStationId}
                        onChange={(e) => setNewStationId(e.target.value)}
                        placeholder="ej: jfKfPfyJRdk"
                        className="flex-1 px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                      />
                      <button
                        onClick={handlePasteUrl}
                        className="ml-2 px-3 py-2 bg-gray-300 dark:bg-gray-600 rounded-md text-sm"
                        title="Pegar URL de YouTube"
                      >
                        Pegar URL
                      </button>
                      {newStationId && (
                        <button
                          onClick={() => checkStationStatus(newStationId)}
                          className="ml-2 px-3 py-2 bg-gray-300 dark:bg-gray-600 rounded-md text-sm flex items-center"
                          title="Verificar estado"
                        >
                          {checkingStatus === newStationId ? (
                            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse mr-1"></div>
                          ) : (
                            <div className={`w-3 h-3 ${stationStatuses[newStationId]?.isOnline ? 'bg-green-500' : 'bg-red-500'} rounded-full mr-1`}></div>
                          )}
                          Verificar
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      ID de 11 caracteres del video de YouTube (ej: 11 caracteres finales de https://www.youtube.com/watch?v=jfKfPfyJRdk)
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1">Nombre de la emisora</label>
                    <input
                      type="text"
                      value={newStationName}
                      onChange={(e) => setNewStationName(e.target.value)}
                      placeholder="ej: Lofi Girl"
                      className="w-full px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                    />
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    {editingIndex !== null && (
                      <button
                        onClick={() => {
                          setNewStationId("");
                          setNewStationName("");
                          setEditingIndex(null);
                        }}
                        className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-md text-sm mr-2"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      onClick={addStation}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                    >
                      {editingIndex !== null ? 'Actualizar' : 'Añadir'} emisora
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-3xl rounded-lg bg-white text-gray-800 shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold">Configuración</h2>
        <IoCloseSharp 
          className="h-6 w-6 cursor-pointer text-red-500 hover:bg-red-200 rounded-full p-1" 
          onClick={onClose} 
        />
      </div>
      
      {/* Pestañas */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <TabButton 
          id="time" 
          label="Tiempo" 
          icon={<FiClock />} 
          isActive={activeTab === "time"} 
        />
        <TabButton 
          id="alarm" 
          label="Alarma" 
          icon={<FiVolume2 />} 
          isActive={activeTab === "alarm"} 
        />
        <TabButton 
          id="layout" 
          label="Diseño" 
          icon={<FiSettings />} 
          isActive={activeTab === "layout"} 
        />
        <TabButton 
          id="ai" 
          label="IA" 
          icon={<BiBot />} 
          isActive={activeTab === "ai"} 
        />
        <TabButton 
          id="music" 
          label="Música" 
          icon={<BiMusic />} 
          isActive={activeTab === "music"} 
        />
      </div>
      
      {/* Contenido de la pestaña activa */}
      <div className="p-2">
        {renderTabContent()}
      </div>
      
      {/* Botones de acción */}
      <div className="flex justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            className="font-normal text-gray-800 hover:text-white dark:text-white"
            variant="cold"
            onClick={handleDefaults}
          >
            Default
          </Button>

          <Button
            className="font-normal text-gray-800 hover:text-white dark:text-white"
            variant="cold"
            onClick={unHideInfo}
          >
            Unhide Info
          </Button>

          <Button
            className="font-normal text-gray-800 hover:text-white dark:text-white"
            variant="cold"
            onClick={onSubmit}
          >
          Guardar
          </Button>
      </div>
    </div>
  );
};
