// Utility pre prístup k hardvérovej kamere zariadenia (PWA Camera Scanner)
// Umožňuje zadnú kameru (facingMode: 'environment') s vysokým rozlíšením pre čítanie textu.

export async function requestCameraStream(facingMode = 'environment') {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Prehliadač nepodporuje prístup k zariadeniu kamery.');
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    });
    return stream;
  } catch (err) {
    console.error('[Camera Access Error]', err);
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      throw new Error('Prístup ku kamere bol zamietnutý. Povoľte kameru v nastaveniach prehliadača.');
    }
    throw new Error('Nepodarilo sa spustiť kameru: ' + (err.message || 'Neznáma chyba'));
  }
}

export function captureFrameFromVideo(videoElement, quality = 0.92) {
  if (!videoElement || !videoElement.videoWidth) return null;

  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        const file = new File([blob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
        resolve({ blob, file, dataUrl: canvas.toDataURL('image/jpeg', quality) });
      },
      'image/jpeg',
      quality
    );
  });
}

export function stopCameraStream(stream) {
  if (!stream) return;
  stream.getTracks().forEach((track) => {
    try {
      track.stop();
    } catch (_) {}
  });
}
