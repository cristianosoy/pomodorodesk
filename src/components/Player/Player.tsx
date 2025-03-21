import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { useEffect, useState } from "react";
import { IconContext } from "react-icons";
import { FaPauseCircle, FaPlayCircle, FaYoutube } from "react-icons/fa";
import { IoCloseSharp } from "react-icons/io5";
import YouTube from "react-youtube";
import { useSong, useToggleMusic, usePlayerAudioVolume, useSongLibrary } from "@Store";
import "./Player.scss";
import { StationSelector } from "./StationSelector";
import { IPlayer, IOptionType } from "./interfaces";
import { checkVideoDetails } from "@Root/src/services/youtube";

export const Player = () => {
  const { song, toggledSong } = useSong();
  const { isMusicToggled, setIsMusicToggled } = useToggleMusic();
  const { audioVolume, setAudioVolume } = usePlayerAudioVolume();
  const { songs } = useSongLibrary();
  const [player, setPlayer] = useState<IPlayer>();
  const [playAudio, setPlayAudio] = useState(true);
  const [autoplay, setAutoPlay] = useState(0);
  const [stationStatus, setStationStatus] = useState<{ isOnline: boolean, details?: string } | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    if (toggledSong) {
      if (playAudio) {
        setPlayAudio(false);
      }
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
    }
  }, [song]);

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
    e.target.setVolume(audioVolume);
    setPlayer(e.target);
  };

  const onPlayVideo = () => {
    player?.playVideo();
  };

  const onPauseVideo = () => {
    player?.pauseVideo();
  };

  const onVolumeChange = (value: number | number[]) => {
    setAudioVolume(value as number);
    player?.setVolume(value);
  };

  const triggerAudio = () => {
    if (playAudio) {
      onPlayVideo();
    } else {
      onPauseVideo();
    }
    setPlayAudio(!playAudio);
  };

  let opts: IOptionType = {
    playerVars: {
      autoplay: autoplay as number,
    },
  };

  return (
    <>
      <div className="mb-2 w-72 rounded-lg border border-gray-200 bg-white/[.96] py-4 px-3 text-gray-800 shadow-md dark:border-gray-700 dark:bg-gray-800/[.96] dark:text-gray-300 sm:w-96 ">
        <div className="flex items-center justify-between space-x-6">
          <div className="flex items-center">
            {song?.artist}
            <div className="flex items-center ml-2">
              {checkingStatus ? (
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
              ) : stationStatus !== null && (
                <div 
                  className={`w-3 h-3 ${stationStatus.isOnline ? 'bg-green-500' : 'bg-red-500'} rounded-full cursor-pointer`}
                  title={stationStatus.details}
                  onClick={() => song?.id && checkStationStatus(song.id)}
                ></div>
              )}
              {song?.id && (
                <span 
                  className="ml-1 text-xs text-blue-500 hover:text-blue-700 cursor-pointer"
                  onClick={() => openYoutubeUrl(song.id)}
                  title="Abrir en YouTube"
                >
                  ↗
                </span>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <IconContext.Provider value={{ size: "1.1rem" }}>
              <FaYoutube />
            </IconContext.Provider>
            <IconContext.Provider value={{ size: "1.1rem" }}>
              <IoCloseSharp
                className="cursor-pointer text-red-500 hover:bg-red-200"
                onClick={() => setIsMusicToggled(false)}
              />
            </IconContext.Provider>
          </div>
        </div>
        <YouTube
          className="hidden"
          videoId={song.id}
          onReady={onReady}
          // @ts-ignore
          opts={opts}
        />
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <IconContext.Provider value={{ size: "1.5rem" }}>
              {playAudio ? <FaPlayCircle onClick={triggerAudio} /> : <FaPauseCircle onClick={triggerAudio} />}
            </IconContext.Provider>
            <Slider
              defaultValue={audioVolume}
              onChange={value => {
                onVolumeChange(value as number);
              }}
              railStyle={{
                backgroundColor: "#000",
              }}
              handleStyle={{
                backgroundColor: "#fff",
                opacity: 1,
                color: "red",
              }}
              trackStyle={{
                backgroundColor: "#fff",
              }}
            />
          </div>
          <StationSelector />
        </div>
      </div>
    </>
  );
};
