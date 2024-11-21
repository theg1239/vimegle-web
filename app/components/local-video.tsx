import React from 'react';

interface LocalVideoProps {
  localStream: MediaStream | null;
}

const LocalVideo: React.FC<LocalVideoProps> = ({ localStream }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (localStream && videoRef.current) {
      videoRef.current.srcObject = localStream;
      videoRef.current.muted = true;
      videoRef.current.play().catch((error) => {
        console.error('Error playing local video:', error);
      });
    }
  }, [localStream]);

  const hasVideo = localStream ? localStream.getVideoTracks().length > 0 : false;

  return (
    <>
      {hasVideo ? (
        <video
          ref={videoRef}
          className="w-full h-auto bg-black"
          autoPlay
          playsInline
          muted
          aria-label="Local Video"
        />
      ) : (
        <div className="w-full h-auto bg-gray-800 flex items-center justify-center">
          <p className="text-white">No Video Available</p>
        </div>
      )}
    </>
  );
};

LocalVideo.defaultProps = {
  localStream: null,
};

export default LocalVideo;
