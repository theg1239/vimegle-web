interface ImageCapture {
    new (videoTrack: MediaStreamTrack): ImageCapture;
    takePhoto(): Promise<Blob>;
    grabFrame(): Promise<ImageBitmap>;
  }
  declare var ImageCapture: {
    prototype: ImageCapture;
    new (videoTrack: MediaStreamTrack): ImageCapture;
  };