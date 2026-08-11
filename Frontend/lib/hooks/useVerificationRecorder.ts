'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export const VERIFICATION_RECORDING_MIME_TYPE = 'video/webm';
export const VERIFICATION_VIDEO_BITS_PER_SECOND = 500_000;
export const VERIFICATION_AUDIO_BITS_PER_SECOND = 64_000;

const configuredMaxFileSizeMb = Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB ?? 10);
export const VERIFICATION_MAX_FILE_BYTES =
  (Number.isFinite(configuredMaxFileSizeMb) && configuredMaxFileSizeMb > 0
    ? configuredMaxFileSizeMb
    : 10) *
  1024 *
  1024;

export type VerificationRecorderStatus =
  | 'idle'
  | 'preparing'
  | 'ready'
  | 'recording'
  | 'interrupted'
  | 'stopped'
  | 'error';

interface RecordingCallbacks {
  onStarted: () => void;
  onStopped: (blob: Blob) => void;
  onCameraInterrupted: () => void;
  onCameraRestored: () => void;
  onError: (message: string) => void;
}

export function useVerificationRecorder() {
  const [status, setStatus] = useState<VerificationRecorderStatus>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const previewElementRef = useRef<HTMLVideoElement | null>(null);
  const statusRef = useRef<VerificationRecorderStatus>('idle');
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const updateStatus = useCallback((nextStatus: VerificationRecorderStatus) => {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  }, []);

  const clearTimers = useCallback(() => {
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    intervalRef.current = null;
    timeoutRef.current = null;
  }, []);

  const stopTracks = useCallback(() => {
    const stream = streamRef.current;
    stream?.getTracks().forEach((track) => {
      track.onended = null;
      track.onmute = null;
      track.onunmute = null;
      track.stop();
    });
    if (previewElementRef.current) previewElementRef.current.srcObject = null;
    streamRef.current = null;
  }, []);

  const releaseMedia = useCallback(() => {
    clearTimers();
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.ondataavailable = null;
      recorder.onstart = null;
      recorder.onstop = null;
      recorder.onerror = null;
      recorder.stop();
    }
    recorderRef.current = null;
    stopTracks();
    updateStatus('idle');
  }, [clearTimers, stopTracks, updateStatus]);

  useEffect(
    () => () => {
      clearTimers();
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.ondataavailable = null;
        recorder.onstart = null;
        recorder.onstop = null;
        recorder.onerror = null;
        recorder.stop();
      }
      stopTracks();
    },
    [clearTimers, stopTracks]
  );

  const previewRef = useCallback((element: HTMLVideoElement | null) => {
    previewElementRef.current = element;
    if (element) element.srcObject = streamRef.current;
  }, []);

  const prepareMedia = useCallback(async () => {
    if (!document.fullscreenEnabled) {
      throw new Error('Trình duyệt không hỗ trợ chế độ toàn màn hình bắt buộc.');
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Trình duyệt không hỗ trợ truy cập camera và microphone.');
    }
    if (typeof MediaRecorder === 'undefined') {
      throw new Error('Trình duyệt không hỗ trợ ghi hình MediaRecorder.');
    }
    if (!MediaRecorder.isTypeSupported(VERIFICATION_RECORDING_MIME_TYPE)) {
      throw new Error('Trình duyệt không hỗ trợ định dạng video WebM.');
    }

    const currentStream = streamRef.current;
    if (currentStream?.getTracks().every((track) => track.readyState === 'live')) return;

    updateStatus('preparing');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (stream.getVideoTracks().length === 0 || stream.getAudioTracks().length === 0) {
      stream.getTracks().forEach((track) => track.stop());
      throw new Error('Không tìm thấy đầy đủ camera và microphone.');
    }

    streamRef.current = stream;
    if (previewElementRef.current) previewElementRef.current.srcObject = stream;
    setElapsedSeconds(0);
    setRecordingBlob(null);
    updateStatus('ready');
  }, [updateStatus]);

  const startRecording = useCallback(
    (maximumDurationSeconds: number, callbacks: RecordingCallbacks) => {
      if (!document.fullscreenElement) {
        throw new Error('Phải ở chế độ toàn màn hình trước khi bắt đầu ghi hình.');
      }
      const stream = streamRef.current;
      if (!stream || stream.getTracks().some((track) => track.readyState !== 'live')) {
        throw new Error('Camera hoặc microphone không còn sẵn sàng.');
      }

      const chunks: BlobPart[] = [];
      let fatalError: string | null = null;
      let cameraInterrupted = false;
      const recorder = new MediaRecorder(stream, {
        mimeType: VERIFICATION_RECORDING_MIME_TYPE,
        videoBitsPerSecond: VERIFICATION_VIDEO_BITS_PER_SECOND,
        audioBitsPerSecond: VERIFICATION_AUDIO_BITS_PER_SECOND,
      });
      recorderRef.current = recorder;

      const failRecording = (message: string) => {
        if (fatalError) return;
        fatalError = message;
        updateStatus('error');
        if (recorder.state !== 'inactive') recorder.stop();
      };

      const permissionRevokedMessage =
        'Quyền camera hoặc microphone đã bị thu hồi hoặc thiết bị bị ngắt. Hãy cấp lại quyền trong trình duyệt rồi bấm Thử ghi hình lại.';
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      videoTrack.onmute = () => {
        if (statusRef.current !== 'recording') return;
        cameraInterrupted = true;
        updateStatus('interrupted');
        callbacks.onCameraInterrupted();
      };
      videoTrack.onunmute = () => {
        if (!cameraInterrupted || statusRef.current !== 'interrupted') return;
        cameraInterrupted = false;
        updateStatus('recording');
        callbacks.onCameraRestored();
      };
      videoTrack.onended = () => {
        if (!cameraInterrupted) callbacks.onCameraInterrupted();
        failRecording(permissionRevokedMessage);
      };
      audioTrack.onended = () => failRecording(permissionRevokedMessage);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onerror = () => failRecording('Trình duyệt gặp lỗi khi ghi hình.');
      recorder.onstart = () => {
        const startedAt = Date.now();
        updateStatus('recording');
        callbacks.onStarted();
        intervalRef.current = window.setInterval(() => {
          setElapsedSeconds(
            Math.min(Math.floor((Date.now() - startedAt) / 1000), maximumDurationSeconds)
          );
        }, 250);
        timeoutRef.current = window.setTimeout(() => {
          if (recorder.state === 'recording') recorder.stop();
        }, maximumDurationSeconds * 1000);
      };
      recorder.onstop = () => {
        clearTimers();
        videoTrack.onended = null;
        videoTrack.onmute = null;
        videoTrack.onunmute = null;
        audioTrack.onended = null;
        recorderRef.current = null;
        const blob = new Blob(chunks, { type: VERIFICATION_RECORDING_MIME_TYPE });
        stopTracks();

        if (cameraInterrupted && !fatalError) {
          fatalError = 'Camera chưa được khôi phục trước khi hết thời gian ghi hình.';
        }
        if (fatalError) {
          updateStatus('error');
          callbacks.onError(fatalError);
          return;
        }
        if (blob.size > VERIFICATION_MAX_FILE_BYTES) {
          updateStatus('error');
          callbacks.onError('Video vượt quá giới hạn dung lượng cho phép. Vui lòng thử lại.');
          return;
        }

        setElapsedSeconds(maximumDurationSeconds);
        setRecordingBlob(blob);
        updateStatus('stopped');
        callbacks.onStopped(blob);
      };

      recorder.start(1000);
    },
    [clearTimers, stopTracks, updateStatus]
  );

  return {
    status,
    elapsedSeconds,
    recordingBlob,
    previewRef,
    prepareMedia,
    startRecording,
    releaseMedia,
  };
}
