// Servicio para verificar el estado de videos de YouTube
type YouTubeVideoStatus = 'online' | 'offline' | 'unknown';

interface YouTubeStatusResponse {
  status: YouTubeVideoStatus;
  title?: string;
  isLive?: boolean;
  details?: {
    streamStatus?: string; // active, created, error, inactive, ready
    uploadStatus?: string; // processed, etc.
  };
}

// Obtener la clave de API de YouTube desde localStorage
const getYouTubeApiKey = (): string => {
  return localStorage.getItem('youtube_api_key') || '';
};

// Función para verificar si un video existe realmente
export const verifyVideoExistence = async (videoId: string): Promise<boolean> => {
  try {
    // Método simple: Verificar usando oembed
    const oembedResponse = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    
    // Si oembed funciona, el video probablemente existe
    return oembedResponse.ok;
  } catch (error) {
    console.error('Error verificando existencia del video:', error);
    return false;
  }
};

// Verificar si un video es una transmisión en vivo usando liveBroadcasts.list
export const checkLiveStreamStatus = async (videoId: string): Promise<YouTubeStatusResponse> => {
  const apiKey = getYouTubeApiKey();
  
  if (!apiKey) {
    return { status: 'unknown', isLive: false };
  }
  
  try {
    // Primero, intentamos con liveBroadcasts para transmisiones en vivo
    const liveBroadcastResponse = await fetch(
      `https://youtube.googleapis.com/youtube/v3/liveBroadcasts?id=${videoId}&part=status,snippet&key=${apiKey}`
    );

    if (liveBroadcastResponse.ok) {
      const broadcastData = await liveBroadcastResponse.json();
      
      // Si encontramos datos en liveBroadcasts
      if (broadcastData.items && broadcastData.items.length > 0) {
        const broadcastInfo = broadcastData.items[0];
        const streamStatus = broadcastInfo.status?.streamStatus || '';
        const uploadStatus = broadcastInfo.status?.uploadStatus || '';
        
        // Determinar si está activo basado en streamStatus
        const isActive = streamStatus === 'active' || streamStatus === 'live';
        
        return {
          status: isActive ? 'online' : 'offline',
          title: broadcastInfo.snippet?.title || '',
          isLive: true, // Es un broadcast de todos modos, incluso si no está activo
          details: {
            streamStatus,
            uploadStatus
          }
        };
      }
    }
    
    // Si no encontramos nada en liveBroadcasts, intentamos con videos (para detectar livestreams públicos)
    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,status,liveStreamingDetails&id=${videoId}&key=${apiKey}`
    );

    if (!videoResponse.ok) {
      console.error(`YouTube API error: ${videoResponse.status}`);
      return { status: 'unknown', isLive: false };
    }

    const videoData = await videoResponse.json();
    
    // Si no hay items, no es una transmisión en vivo
    if (!videoData.items || videoData.items.length === 0) {
      return { status: 'offline', isLive: false };
    }

    const videoInfo = videoData.items[0];
    
    // Verificar si tiene detalles de livestreaming
    if (videoInfo.liveStreamingDetails) {
      // Es un stream si tiene liveStreamingDetails y no tiene actualEndTime
      const isCurrentlyLive = 
        videoInfo.liveStreamingDetails.actualEndTime === undefined || 
        videoInfo.liveStreamingDetails.actualEndTime === null;
      
      // Verificar el estado de la transmisión
      let streamStatus = 'unknown';
      
      if (videoInfo.liveStreamingDetails.concurrentViewers) {
        streamStatus = 'active'; // Si tiene viewers, está activo
      } else if (videoInfo.liveStreamingDetails.scheduledStartTime && !videoInfo.liveStreamingDetails.actualStartTime) {
        streamStatus = 'scheduled'; // Si tiene hora programada pero no ha iniciado
      } else if (videoInfo.liveStreamingDetails.actualStartTime && !videoInfo.liveStreamingDetails.actualEndTime) {
        streamStatus = 'active'; // Si ha iniciado pero no ha terminado
      } else if (videoInfo.liveStreamingDetails.actualEndTime) {
        streamStatus = 'completed'; // Si ya terminó
      }
      
      return {
        status: isCurrentlyLive ? 'online' : 'offline',
        title: videoInfo.snippet?.title || '',
        isLive: isCurrentlyLive,
        details: {
          streamStatus
        }
      };
    }
    
    // Si llegamos aquí, no es un livestream
    return { 
      status: 'online', // Existe pero no es livestream
      isLive: false
    };
  } catch (error) {
    console.error('Error al verificar el estado del stream en vivo:', error);
    return { status: 'unknown', isLive: false };
  }
};

// Verificar detalles generales del video (usado para videos regulares o en vivo)
export const checkVideoDetails = async (videoId: string): Promise<YouTubeStatusResponse> => {
  const apiKey = getYouTubeApiKey();
  
  // Primero verificamos si el video existe básicamente
  const exists = await verifyVideoExistence(videoId);
  
  // Si el video no existe según oembed, no necesitamos verificar más
  if (!exists) {
    return { 
      status: 'offline',
      isLive: false,
      details: {
        streamStatus: 'unavailable'
      }
    };
  }
  
  // Si no hay API key, devolvemos el resultado básico
  if (!apiKey) {
    return { 
      status: 'online', // Ya verificamos que existe
      isLive: false
    };
  }
  
  try {
    // Primero verificamos si es un livestream
    const liveStatus = await checkLiveStreamStatus(videoId);
    
    // Si se determinó que es un livestream, devolvemos ese resultado
    if (liveStatus.isLive) {
      return liveStatus;
    }
    
    // Si no es livestream, verificamos el video normal
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=${videoId}&key=${apiKey}`
    );

    if (!response.ok) {
      console.error(`YouTube API error: ${response.status}`);
      // Si la API falla pero sabemos que el video existe
      return { 
        status: 'online',
        isLive: false
      };
    }

    const data = await response.json();
    
    // Si no hay items, el video no existe o fue eliminado
    if (!data.items || data.items.length === 0) {
      return { 
        status: 'offline',
        isLive: false,
        details: {
          streamStatus: 'unavailable'
        }
      };
    }

    const videoInfo = data.items[0];
    
    // Verificar si el video está realmente disponible públicamente
    if (videoInfo.status) {
      if (videoInfo.status.uploadStatus !== 'processed') {
        return { 
          status: 'offline',
          isLive: false,
          details: {
            uploadStatus: videoInfo.status.uploadStatus
          }
        };
      }
      
      if (videoInfo.status.privacyStatus === 'private') {
        return { 
          status: 'offline',
          isLive: false,
          details: {
            streamStatus: 'private'
          }
        };
      }
      
      if (videoInfo.status.embeddable === false) {
        return { 
          status: 'offline', // Consideramos offline si no se puede incrustar
          isLive: false,
          details: {
            streamStatus: 'not_embeddable'
          }
        };
      }
    }
    
    // Si llegamos aquí, el video existe y está disponible
    return {
      status: 'online',
      title: videoInfo.snippet?.title || '',
      isLive: false
    };
  } catch (error) {
    console.error('Error al verificar detalles del video:', error);
    // Si todo falla pero sabemos que el video existe básicamente
    return { 
      status: 'online',
      isLive: false
    };
  }
};

// Verificar si un video es una transmisión en vivo activa
export const isYouTubeLiveStream = async (videoId: string): Promise<boolean> => {
  const status = await checkVideoDetails(videoId);
  return status.status === 'online' && status.isLive === true;
};

// Verificar si un video existe y está disponible (en vivo o no)
export const isYouTubeVideoAvailable = async (videoId: string): Promise<boolean> => {
  const status = await checkVideoDetails(videoId);
  return status.status === 'online';
};

// Versión más permisiva - considera disponible si existe el video
export const isYouTubeVideoDefinitelyAvailable = async (videoId: string): Promise<boolean> => {
  const status = await checkVideoDetails(videoId);
  return status.status === 'online';
};

// Verificar varios videos a la vez y devolver un mapa de estados
export const batchCheckYouTubeVideos = async (videoIds: string[]): Promise<Record<string, YouTubeStatusResponse>> => {
  const results: Record<string, YouTubeStatusResponse> = {};
  
  // Para no sobrecargar, limitamos a 3 peticiones concurrentes
  const batchSize = 3;
  
  for (let i = 0; i < videoIds.length; i += batchSize) {
    const batch = videoIds.slice(i, i + batchSize);
    const promises = batch.map(id => checkVideoDetails(id));
    
    const batchResults = await Promise.all(promises);
    
    batch.forEach((id, index) => {
      results[id] = batchResults[index];
    });
    
    // Añadimos una pequeña pausa entre lotes para evitar sobrecargar
    if (i + batchSize < videoIds.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return results;
}; 