import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { useEffect, useState } from "react";
import { IconContext } from "react-icons";
import { FaPauseCircle, FaPlayCircle, FaYoutube } from "react-icons/fa";
import { IoCloseSharp } from "react-icons/io5";
import { FiSkipBack, FiSkipForward, FiVolume2 } from "react-icons/fi";
import { BiShuffle } from "react-icons/bi";
import { IoIosRefresh } from "react-icons/io";
import YouTube from "react-youtube";
import { useSong, useToggleMusic, usePlayerAudioVolume, useSongLibrary } from "@Store";
import "./Player.scss";
import { StationSelector } from "./StationSelector";
import { IPlayer, IOptionType, getYouTubeThumbnail } from "./interfaces";
import { checkVideoDetails } from "@Root/src/services/youtube";

// Componente para mostrar una canción en la lista
interface SongItemProps {
  id: string;
  artist: string;
  title?: string;
  duration?: string;
  isActive?: boolean;
  onSelect: () => void;
  image?: string;
}

const SongListItem = ({ id, artist, title, duration, isActive, onSelect, image }: SongItemProps) => {
  // Usar la imagen proporcionada o la miniatura de YouTube
  const thumbnailUrl = image || getYouTubeThumbnail(id);
  
  return (
    <div 
      className={`flex items-center p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${isActive ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
      onClick={onSelect}
    >
      <div className="w-10 h-10 min-w-[40px] mr-3">
        <img src={thumbnailUrl} alt={artist} className="w-full h-full object-cover rounded" />
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="text-sm font-medium truncate">{title || artist}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{artist}</div>
      </div>
      {duration && (
        <div className="text-xs text-gray-500 dark:text-gray-400 ml-2">{duration}</div>
      )}
    </div>
  );
};

export const Player = () => {
  const { song, setSong, toggledSong, setToggledSong } = useSong();
  const { isMusicToggled, setIsMusicToggled } = useToggleMusic();
  const { audioVolume, setAudioVolume } = usePlayerAudioVolume();
  const { songs } = useSongLibrary();
  const [player, setPlayer] = useState<IPlayer>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoplay, setAutoPlay] = useState<0 | 1>(0);
  const [stationStatus, setStationStatus] = useState<{ isOnline: boolean, details?: string } | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [songDetails, setSongDetails] = useState<{title?: string, duration?: string}>({});
  const [volumeDisplayed, setVolumeDisplayed] = useState(false);
  
  // Formatear tiempo de reproducción
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  useEffect(() => {
    if (toggledSong) {
      setIsPlaying(true);
      setAutoPlay(1);
    }
  }, [toggledSong]);

  useEffect(() => {
    if (!isMusicToggled) {
      onPauseVideo();
    }
  }, [isMusicToggled]);

  useEffect(() => {
    // Verificar el estado de la emisora actual cuando cambia
    if (song?.id) {
      checkStationStatus(song.id);
      fetchVideoDetails(song.id);
    }
  }, [song]);

  // Obtener detalles del video
  const fetchVideoDetails = async (videoId: string) => {
    try {
      const videoStatus = await checkVideoDetails(videoId);
      if (videoStatus.status === 'online') {
        setSongDetails({
          title: videoStatus.title || '',
          duration: ''
        });
      }
    } catch (error) {
      console.error("Error obteniendo detalles del video:", error);
    }
  };

  // Función para verificar si una emisora está en línea
  const checkStationStatus = async (id: string) => {
    setCheckingStatus(true);
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

      setStationStatus({
        isOnline: videoStatus.status === 'online',
        details
      });
    } catch (error) {
      console.error("Error verificando estado de la emisora:", error);
      setStationStatus({
        isOnline: false,
        details: 'Error al verificar estado'
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  // Función para abrir la URL de YouTube
  const openYoutubeUrl = (id: string) => {
    window.open(`https://www.youtube.com/watch?v=${id}`, '_blank');
  };

  const onReady = (e: any) => {
    e.target.setVolume(audioVolume * 100);
    setPlayer(e.target);
    
    // Configurar intervalo para actualizar el tiempo de reproducción
    const interval = setInterval(() => {
      if (e.target && typeof e.target.getCurrentTime === 'function') {
        setCurrentTime(e.target.getCurrentTime());
        if (duration === 0 && typeof e.target.getDuration === 'function') {
          setDuration(e.target.getDuration());
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  };

  const onPlayVideo = () => {
    player?.playVideo();
    setIsPlaying(true);
  };

  const onPauseVideo = () => {
    player?.pauseVideo();
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      onPauseVideo();
    } else {
      onPlayVideo();
    }
  };

  const onVolumeChange = (value: number | number[]) => {
    const vol = typeof value === 'number' ? value : value[0];
    setAudioVolume(vol);
    player?.setVolume(vol * 100);
  };

  const playNextSong = () => {
    if (songs.length <= 1) return;
    
    const currentIndex = songs.findIndex(s => s.id === song.id);
    const nextIndex = (currentIndex + 1) % songs.length;
    setSong(songs[nextIndex].id);
    setToggledSong(songs[nextIndex].id);
  };

  const playPreviousSong = () => {
    if (songs.length <= 1) return;
    
    const currentIndex = songs.findIndex(s => s.id === song.id);
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    setSong(songs[prevIndex].id);
    setToggledSong(songs[prevIndex].id);
  };

  const togglePlaylist = () => {
    setShowPlaylist(!showPlaylist);
  };

  const playSong = (id: string) => {
    setSong(id);
    setToggledSong(id);
    setIsPlaying(true);
  };

  const playRandomSong = () => {
    if (songs.length <= 1) return;
    
    const currentIndex = songs.findIndex(s => s.id === song.id);
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * songs.length);
    } while (randomIndex === currentIndex);
    
    setSong(songs[randomIndex].id);
    setToggledSong(songs[randomIndex].id);
  };

  let opts: IOptionType = {
    playerVars: {
      autoplay: autoplay as 0 | 1,
    },
  };

  // Obtener la imagen actual (personalizada o miniatura de YouTube)
  const currentSongIndex = songs.findIndex(s => s.id === song?.id);
  const currentSong = currentSongIndex >= 0 ? songs[currentSongIndex] : null;
  const currentImage = currentSong?.image || (song?.id ? getYouTubeThumbnail(song.id) : '');
  const currentTitle = songDetails?.title || currentSong?.artist || '';

  return (
    <div className="w-72 rounded-lg border border-gray-200 bg-white/[.96] shadow-md dark:border-gray-700 dark:bg-gray-800/[.96] dark:text-gray-300 overflow-hidden sm:w-96">
      {/* Barra superior con controles principales */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <button 
          onClick={togglePlaylist} 
          className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
        >
          <IconContext.Provider value={{ size: "1.2rem" }}>
            <IoIosRefresh />
          </IconContext.Provider>
        </button>
        
        <div className="flex space-x-6">
          <button 
            onClick={playPreviousSong} 
            className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
          >
            <IconContext.Provider value={{ size: "1.2rem" }}>
              <FiSkipBack />
            </IconContext.Provider>
          </button>
          
          <button 
            onClick={togglePlayPause} 
            className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
          >
            <IconContext.Provider value={{ size: "1.5rem" }}>
              {isPlaying ? <FaPauseCircle /> : <FaPlayCircle />}
            </IconContext.Provider>
          </button>
          
          <button 
            onClick={playNextSong} 
            className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
          >
            <IconContext.Provider value={{ size: "1.2rem" }}>
              <FiSkipForward />
            </IconContext.Provider>
          </button>
        </div>
        
        <div className="flex items-center">
          <span className="text-sm text-gray-600 dark:text-gray-300 mr-2">
            {Math.round(audioVolume * 100)}%
          </span>
          <button 
            onClick={() => setVolumeDisplayed(!volumeDisplayed)} 
            className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
          >
            <IconContext.Provider value={{ size: "1.2rem" }}>
              <FiVolume2 />
            </IconContext.Provider>
          </button>
        </div>
      </div>
      
      {/* Sección principal */}
      {!showPlaylist ? (
        // Vista de reproducción actual
        <div className="p-4">
          {/* Canción actual */}
          <div className="flex items-center mb-4">
            <div className="w-16 h-16 mr-4 rounded overflow-hidden">
              <img src={currentImage} alt={currentTitle} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="font-medium text-lg truncate">{currentTitle}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{currentSong?.artist}</div>
              <div className="flex items-center mt-1">
                <span className="text-xs">
                  {formatTime(currentTime)}
                </span>
                <div className="flex-1 mx-2 h-1 bg-gray-200 dark:bg-gray-700 rounded">
                  <div 
                    className="h-full bg-blue-500 rounded" 
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-xs">
                  {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Control de volumen (condicional) */}
          {volumeDisplayed && (
            <div className="mb-4 px-4">
              <Slider
                value={audioVolume}
                onChange={onVolumeChange}
                min={0}
                max={1}
                step={0.01}
                railStyle={{
                  backgroundColor: "#e2e8f0",
                  height: 4
                }}
                handleStyle={{
                  backgroundColor: "#3b82f6",
                  border: "none",
                  boxShadow: "none",
                  height: 14,
                  width: 14,
                  marginTop: -5
                }}
                trackStyle={{
                  backgroundColor: "#3b82f6",
                  height: 4
                }}
              />
            </div>
          )}
          
          <YouTube
            className="hidden"
            videoId={song?.id}
            onReady={onReady}
            opts={opts}
          />
        </div>
      ) : (
        // Vista de lista de reproducción
        <div className="max-h-64 overflow-y-auto">
          {songs.map((song) => (
            <SongListItem
              key={song.id}
              id={song.id}
              artist={song.artist}
              title={song.artist} // Usado como título si no hay otro
              isActive={song.id === currentSong?.id}
              onSelect={() => playSong(song.id)}
              image={song.image}
            />
          ))}
        </div>
      )}
      
      {/* Barra de acciones inferior */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <button 
          onClick={playRandomSong} 
          className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
        >
          <IconContext.Provider value={{ size: "1.2rem" }}>
            <BiShuffle />
          </IconContext.Provider>
        </button>
        
        <IconContext.Provider value={{ size: "1.1rem" }}>
          <FaYoutube 
            className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white cursor-pointer"
            onClick={() => song?.id && openYoutubeUrl(song.id)}
          />
        </IconContext.Provider>
        
        <IconContext.Provider value={{ size: "1.1rem" }}>
          <IoCloseSharp
            className="cursor-pointer text-red-500 hover:bg-red-200"
            onClick={() => setIsMusicToggled(false)}
          />
        </IconContext.Provider>
      </div>
    </div>
  );
};
