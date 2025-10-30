export function useRecipeUtils() {
  // Helper functions for image/video handling
  function getImageUrl(image: any): string {
    if (typeof image === 'string') return image;
    if (image && typeof image === 'object') {
      return image.url || image.contentUrl || '';
    }
    return '';
  }

  function getVideoUrl(video: any): string {
    if (typeof video === 'string') return video;
    if (video && typeof video === 'object') {
      return video.contentUrl || video.url || '';
    }
    return '';
  }

  function getVideoThumbnail(video: any): string {
    if (video && typeof video === 'object') {
      return video.thumbnailUrl || '';
    }
    return '';
  }

  // Helper function to format ISO 8601 duration to human-readable
  function formatDuration(duration: string | number | undefined): string {
    if (!duration) return '';
    if (typeof duration === 'number') {
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      const seconds = duration % 60;
      let timeString = '';
      if (hours > 0) {
        timeString = `${hours}h`;
      }
      if (minutes > 0) {
        if (minutes == 1) {
          timeString += ` ${minutes} minute`;
        } else {
          timeString += ` ${minutes} minutes`;
        }
      }
      if (seconds > 0) {
        timeString += ` ${seconds} seconds`;
      }
      if (duration < 60) {
        timeString = `${seconds} seconds`;
      }
      return timeString.trim();
    }

    const match = duration.match(/PT(\d+)M/) || duration.match(/PT(\d+)S/);
    if (match) {
      const value = parseInt(match[1]);
      if (duration.includes('M')) {
        return `${value}m`;
      } else {
        const minutes = Math.floor(value / 60);
        const secs = value % 60;
        if (minutes > 0) {
          return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
        }
        return `${secs}s`;
      }
    }
    return duration;
  }

  return {
    getImageUrl,
    getVideoUrl,
    getVideoThumbnail,
    formatDuration
  };
}