import { useSong, useSongLibrary } from "@Store";
import { useEffect, useState } from "react";
import { checkVideoDetails } from "@Root/src/services/youtube";

export const StationSelector = () => {
  const { setSong, setToggledSong } = useSong();
  const { songs } = useSongLibrary();
  const [stationStatuses, setStationStatuses] = useState<Record<string, { isOnline: boolean, details?: string }>>({});
  const [checkingStatus, setCheckingStatus] = useState<string | null>(null);

  useEffect(() => {
    // Verificar estados de las emisoras al cargar
    if (songs.length > 0) {
      songs.forEach(song => {
        checkStationStatus(song.id);
      });
    }
  }, [songs]);

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

  function setSongId(e: React.MouseEvent<HTMLInputElement>) {
    const target = e.target as Element;
    const id = target.id;
    setSong(id);
    songSelected(id);
  }

  function songSelected(id: string) {
    setToggledSong(id);
  }
  
  // Función para abrir la URL de YouTube
  const openYoutubeUrl = (id: string) => {
    window.open(`https://www.youtube.com/watch?v=${id}`, '_blank');
  };
  
  return (
    <div className="text-gray-800 dark:text-gray-200">
      {songs.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {songs.map((song, index) => (
            <div key={song.id} className="form-check">
              <label className="form-check-label inline-block cursor-pointer text-sm flex items-center">
                <input
                  className="form-check-input float-left mt-1 mr-2 h-4 w-4 appearance-none rounded-full border border-gray-300 bg-white bg-contain bg-center bg-no-repeat align-top transition duration-200 checked:border-blue-600 checked:bg-blue-600 focus:outline-none"
                  type="radio"
                  name="flexRadioDefault"
                  id={song.id}
                  onClick={e => setSongId(e)}
                />
                <span className="flex items-center">
                  {song.artist}
                  <span className="ml-1 flex items-center">
                    {checkingStatus === song.id ? (
                      <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse ml-1"></span>
                    ) : (
                      <span 
                        className={`w-2 h-2 ${stationStatuses[song.id]?.isOnline ? 'bg-green-500' : 'bg-red-500'} rounded-full ml-1`}
                        title={stationStatuses[song.id]?.details}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          checkStationStatus(song.id);
                        }}
                      ></span>
                    )}
                    <span 
                      className="ml-1 text-xs text-blue-500 hover:text-blue-700 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openYoutubeUrl(song.id);
                      }}
                      title="Abrir en YouTube"
                    >
                      ↗
                    </span>
                  </span>
                </span>
              </label>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          No hay emisoras configuradas
        </div>
      )}
    </div>
  );
};
