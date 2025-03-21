import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { useEffect, useState } from "react";
import { IconContext } from "react-icons";
import { FaPauseCircle, FaPlayCircle } from "react-icons/fa";
import { IoCloseSharp } from "react-icons/io5";
import { FiSkipBack, FiSkipForward, FiVolume2, FiVolume, FiVolumeX, FiMaximize } from "react-icons/fi";
import { BiShuffle } from "react-icons/bi";
import { IoIosRefresh } from "react-icons/io";
import { MdOutlineRadio } from "react-icons/md";
import { BsYoutube } from "react-icons/bs";
import YouTube from "react-youtube";
import { useSong, useToggleMusic, usePlayerAudioVolume, useSongLibrary } from "@Store";
import "./Player.scss";
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
      <div className="w-10 h-10 min-w-[40px] mr-3 rounded-md overflow-hidden">
        <img src={thumbnailUrl} alt={artist} className="w-full h-full object-cover" />
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
  const [stationStatus, setStationStatus] = useState<{ isOnline: boolean, details?: string, isLive?: boolean } | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [songDetails, setSongDetails] = useState<{title?: string, duration?: string}>({});
  const [previousImage, setPreviousImage] = useState<string>('');
  const [isImageTransitioning, setIsImageTransitioning] = useState(false);
  
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
        details,
        isLive: videoStatus.isLive
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
  
  // Garantizar que se use correctamente la imagen personalizada si existe
  const hasCustomImage = !!(currentSong?.image);
  const currentImage = hasCustomImage 
    ? currentSong?.image 
    : (song?.id ? getYouTubeThumbnail(song.id, 'high') : '');
  
  const currentTitle = songDetails?.title || currentSong?.artist || '';
  
  // Logs para depuración
  useEffect(() => {
    console.log("Song ID actual:", song?.id);
    console.log("Songs disponibles:", songs);
    console.log("Índice de la canción actual:", currentSongIndex);
    console.log("Canción actual:", currentSong);
    console.log("¿Tiene imagen personalizada?:", hasCustomImage);
    console.log("Imagen personalizada:", currentSong?.image);
    console.log("Imagen que se está usando:", currentImage);
  }, [song, songs, currentSong, currentImage, hasCustomImage]);

  // Efecto para manejar la transición de imágenes
  useEffect(() => {
    if (currentImage && currentImage !== previousImage) {
      setIsImageTransitioning(true);
      setPreviousImage(currentImage);
      
      // Resetear el estado de transición después de que termine la animación
      const timer = setTimeout(() => {
        setIsImageTransitioning(false);
      }, 500); // Duración de la transición
      
      return () => clearTimeout(timer);
    }
  }, [currentImage]);

  // Determina el icono de volumen basado en el nivel
  const getVolumeIcon = () => {
    if (audioVolume === 0) return <FiVolumeX />;
    if (audioVolume < 0.5) return <FiVolume />;
    return <FiVolume2 />;
  };

  const handleClosePlaylist = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowPlaylist(false);
      setIsClosing(false);
    }, 300);
  };

  const refreshStation = async () => {
    if (!song?.id) return;
    
    // Pausar la reproducción actual
    onPauseVideo();
    
    // Reiniciar el reproductor
    if (player) {
      player.stopVideo();
      player.loadVideoById(song.id);
    }
    
    // Verificar el estado de la emisora
    await checkStationStatus(song.id);
    
    // Reanudar la reproducción si estaba reproduciendo
    if (isPlaying) {
      setTimeout(() => {
        onPlayVideo();
      }, 1000); // Pequeño delay para asegurar que el video se haya cargado
    }
  };

  return (
    <div className="w-72 rounded-3xl overflow-hidden bg-[#1a1a1a] shadow-xl text-white sm:w-96 transition-all duration-300">
      {/* Modal del Playlist */}
      {showPlaylist && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center ${
            isClosing ? 'animate-[fadeOut_0.3s_ease-out]' : 'animate-[fadeIn_0.3s_ease-out]'
          }`}
        >
          {/* Fondo con blur */}
          <div 
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${
              isClosing ? 'animate-[fadeOut_0.3s_ease-out]' : 'animate-[fadeIn_0.3s_ease-out]'
            }`}
            onClick={handleClosePlaylist}
          ></div>
          
          {/* Contenedor del playlist */}
          <div 
            className={`relative bg-[#1a1a1a]/90 rounded-3xl w-72 sm:w-96 max-h-[80vh] overflow-hidden shadow-2xl ${
              isClosing ? 'animate-[slideDown_0.3s_ease-out]' : 'animate-[slideUp_0.3s_ease-out]'
            }`}
          >
            <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
              <h3 className="text-sm font-semibold">Lista de reproducción</h3>
              <button 
                onClick={handleClosePlaylist} 
                className="text-gray-300 hover:text-white transition-colors duration-200"
              >
                <IconContext.Provider value={{ size: "1.2rem" }}>
                  <IoCloseSharp />
                </IconContext.Provider>
              </button>
            </div>
            
            <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-500">
              <div className="max-h-[60vh] py-2">
                {songs.map((song) => (
                  <SongListItem
                    key={song.id}
                    id={song.id}
                    artist={song.artist}
                    title={song.artist}
                    isActive={song.id === currentSong?.id}
                    onSelect={() => {
                      playSong(song.id);
                      handleClosePlaylist();
                    }}
                    image={song.image}
                  />
                ))}
              </div>
            </div>
          </div>

          <style>
            {`
              /* Estilos para el scrollbar */
              .scrollbar-thin::-webkit-scrollbar {
                width: 6px;
              }
              
              .scrollbar-thin::-webkit-scrollbar-track {
                background: transparent;
              }
              
              .scrollbar-thin::-webkit-scrollbar-thumb {
                background-color: rgba(156, 163, 175, 0.3);
                border-radius: 3px;
              }
              
              .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                background-color: rgba(156, 163, 175, 0.5);
              }
              
              /* Ocultar scrollbar en Firefox */
              .scrollbar-thin {
                scrollbar-width: thin;
                scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
              }
              
              /* Asegurar scroll suave */
              .scrollbar-thin {
                scroll-behavior: smooth;
                -webkit-overflow-scrolling: touch;
              }
            `}
          </style>
        </div>
      )}

      {/* Vista principal del reproductor */}
      <div className="relative">
        {/* Imagen de fondo con efecto */}
        <div className="absolute inset-0 before:content-[''] before:absolute before:inset-0 before:bg-[#1a1a1a]/30">
          {/* Imagen anterior para el crossfade */}
          {isImageTransitioning && previousImage && (
            <div className="absolute inset-0 animate-[fadeOut_500ms_ease-out]">
              <img 
                src={previousImage} 
                alt="Previous background"
                className="absolute w-full h-full object-cover object-center scale-150" 
                style={{
                  top: '-25%',
                  left: '-25%',
                  width: '150%',
                  height: '150%'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1a1a1a]/70 to-[#1a1a1a]"></div>
            </div>
          )}
          
          {/* Imagen actual */}
          <div className={`absolute inset-0 ${isImageTransitioning ? 'animate-[fadeIn_500ms_ease-out]' : ''}`}>
            <img 
              key={currentImage}
              src={currentImage} 
              alt={currentTitle} 
              className="absolute w-full h-full object-cover object-center scale-150" 
              style={{
                top: '-25%',
                left: '-25%',
                width: '150%',
                height: '150%'
              }}
              onError={() => {
                console.error("Error cargando imagen:", currentImage);
                // Si falla la carga y es una imagen personalizada, intentar con la miniatura
                if (hasCustomImage && song?.id) {
                  const fallbackImage = getYouTubeThumbnail(song.id, 'high');
                  console.log("Usando imagen de respaldo:", fallbackImage);
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1a1a1a]/70 to-[#1a1a1a]"></div>
          </div>
        </div>

        {/* Botón de cierre */}
        <button 
          onClick={() => setIsMusicToggled(false)}
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/40 transition-all duration-200 hover:scale-105"
          title="Cerrar reproductor"
        >
          <IconContext.Provider value={{ size: "1.2rem" }}>
            <IoCloseSharp />
          </IconContext.Provider>
        </button>

        {/* Contenido central */}
        <div className="relative flex flex-col items-center justify-center p-8 z-10 min-h-[300px]">
          <h2 className="text-2xl font-bold text-center mb-2 transition-all duration-300">{currentTitle}</h2>
          <p className="text-sm text-gray-300 text-center mb-3 transition-all duration-300">{currentSong?.artist}</p>
          
          {/* Indicador de estado */}
          {stationStatus && (
            <div className="flex items-center justify-center transition-all duration-300">
              {stationStatus.isLive ? (
                <div className="flex items-center text-[10px] text-green-400/80 bg-green-400/10 px-2 py-0.5 rounded-full">
                  <span className="w-1 h-1 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                  EN VIVO
                </div>
              ) : !stationStatus.isOnline && (
                <div className="flex items-center text-[10px] text-red-400/80 bg-red-400/10 px-2 py-0.5 rounded-full">
                  <span className="w-1 h-1 bg-red-400 rounded-full mr-1"></span>
                  No disponible
                </div>
              )}
            </div>
          )}
        </div>

        {/* Control de volumen */}
        <div className="relative px-6 z-10 mb-2">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onVolumeChange(audioVolume === 0 ? 0.5 : 0)}
              className="text-white/80 hover:text-white transition-all duration-200"
              title={audioVolume === 0 ? "Activar sonido" : "Silenciar"}
            >
              <IconContext.Provider value={{ size: "1.2rem" }}>
                {getVolumeIcon()}
              </IconContext.Provider>
            </button>
            
            <div className="flex-1">
              <Slider
                value={audioVolume}
                onChange={onVolumeChange}
                min={0}
                max={1}
                step={0.01}
                railStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  height: 4,
                  borderRadius: 2
                }}
                trackStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  height: 4,
                  borderRadius: 2
                }}
                handleStyle={{
                  backgroundColor: "#ffffff",
                  border: "none",
                  boxShadow: "0 0 10px rgba(0,0,0,0.2)",
                  opacity: 1,
                  height: 12,
                  width: 12,
                  marginTop: -4,
                  cursor: "pointer",
                  transition: "transform 0.2s"
                }}
              />
            </div>

            <span className="text-xs text-white/80 min-w-[40px] text-right">
              {Math.round(audioVolume * 100)}%
            </span>
          </div>
        </div>

        {/* Controles principales y adicionales */}
        <div className="relative p-8 pt-4 z-10">
          {/* Controles de navegación */}
          <div className="flex justify-center items-center gap-8 mb-6">
            <button 
              onClick={playPreviousSong}
              className="text-blue-900/90 hover:text-blue-800 transition-all duration-200 hover:scale-110"
              title="Estación anterior"
            >
              <IconContext.Provider value={{ size: "2rem" }}>
                <FiSkipBack />
              </IconContext.Provider>
            </button>

            <button 
              onClick={togglePlayPause} 
              className="w-16 h-16 flex items-center justify-center rounded-full bg-blue-900/60 text-white hover:bg-blue-800/70 transition-all duration-200 hover:scale-105 hover:shadow-lg"
              title={isPlaying ? "Pausar" : "Reproducir"}
            >
              <IconContext.Provider value={{ size: "1.8rem" }}>
                {isPlaying ? <FaPauseCircle /> : <FaPlayCircle />}
              </IconContext.Provider>
            </button>

            <button 
              onClick={playNextSong}
              className="text-blue-900/90 hover:text-blue-800 transition-all duration-200 hover:scale-110"
              title="Siguiente estación"
            >
              <IconContext.Provider value={{ size: "2rem" }}>
                <FiSkipForward />
              </IconContext.Provider>
            </button>
          </div>

          {/* Controles adicionales */}
          <div className="flex justify-between items-center px-4">
            <button 
              onClick={togglePlaylist}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/40 transition-all duration-200 hover:scale-105"
              title="Lista de estaciones"
            >
              <IconContext.Provider value={{ size: "1.2rem" }}>
                <MdOutlineRadio />
              </IconContext.Provider>
            </button>

            <button 
              onClick={refreshStation}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/40 transition-all duration-200 hover:scale-105"
              title="Refrescar estación"
            >
              <IconContext.Provider value={{ size: "1.2rem" }}>
                <IoIosRefresh />
              </IconContext.Provider>
            </button>

            <button 
              onClick={playRandomSong}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/40 transition-all duration-200 hover:scale-105"
              title="Estación aleatoria"
            >
              <IconContext.Provider value={{ size: "1.2rem" }}>
                <BiShuffle />
              </IconContext.Provider>
            </button>

            <button 
              onClick={() => song?.id && openYoutubeUrl(song.id)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/40 transition-all duration-200 hover:scale-105"
              title="Abrir en YouTube"
            >
              <IconContext.Provider value={{ size: "1.2rem" }}>
                <BsYoutube />
              </IconContext.Provider>
            </button>
          </div>
        </div>
      </div>

      <YouTube
        className="hidden"
        videoId={song?.id}
        onReady={onReady}
        opts={opts}
      />

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }

          @keyframes slideUp {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @keyframes slideDown {
            from {
              transform: translateY(0);
              opacity: 1;
            }
            to {
              transform: translateY(20px);
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
};
