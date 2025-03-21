import type YouTube from "react-youtube";

export interface IPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  loadVideoById: (videoId: string) => void;
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

export interface ImagePosition {
  x?: number; // posición horizontal (0 = izquierda, 50 = centro, 100 = derecha)
  y?: number; // posición vertical (0 = arriba, 50 = centro, 100 = abajo)
}

export interface SongItem {
  id: string;
  artist: string;
  title?: string;
  duration?: string;
  link?: string;
  image?: string; // URL de imagen personalizada
  imagePosition?: ImagePosition; // Posición de la imagen
}

export interface ISongTask {
  id: string;
  artist: string;
  link?: string;
  image?: string;
  imagePosition?: ImagePosition;
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
