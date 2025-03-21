import type YouTube from "react-youtube";

export interface IPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  changeVideo: () => void;
  setVolume: (volume: number) => void;
}

export interface IOptionType {
  playerVars: {
    autoplay: 0 | 1;
  };
}

export interface IPlayerVarsType {
  autoplay: number;
}

export interface SongItem {
  id: string;
  artist: string;
  title?: string;
  duration?: string;
  link?: string;
  image?: string; // URL de imagen personalizada
}

export interface ISongTask {
  id: string;
  artist: string;
  image?: string;
}

// Función para obtener la miniatura de YouTube
export const getYouTubeThumbnail = (videoId: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'medium'): string => {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    standard: 'sddefault',
    maxres: 'maxresdefault'
  };
  
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
};
