export function setupVoiceTools({
  getCurrentNote,
  onAudioSaved,
  setStatus,
}) {
  // Keep recorder state private so switching notes cannot leak microphone handles.
  const recordState = {
    mediaRecorder: null,
    audioChunks: [],
    stream: null,
    isRecording: false,
  };

  async function startRecording() {
    // Audio is stored as a data URL so it survives reloads with the rest of the note.
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setStatus('Audio recording is not supported in this browser.');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find((type) => MediaRecorder.isTypeSupported(type)) || '';

      recordState.stream = stream;
      recordState.audioChunks = [];
      recordState.mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recordState.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordState.audioChunks.push(event.data);
        }
      };

      recordState.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(recordState.audioChunks, {
          type: recordState.mediaRecorder.mimeType || 'audio/webm',
        });

        const reader = new FileReader();
        reader.onloadend = async () => {
          const note = getCurrentNote();
          if (!note) return;
          note.audioData = reader.result;
          note.updatedAt = new Date().toISOString();
          await onAudioSaved(note);
        };

        if (audioBlob.size > 0) {
          reader.readAsDataURL(audioBlob);
        }

        if (recordState.stream) {
          recordState.stream.getTracks().forEach((track) => track.stop());
        }
      };

      recordState.isRecording = true;
      recordState.mediaRecorder.start();
      setStatus('Recording started.');
      return true;
    } catch (error) {
      setStatus('Microphone access was blocked or unavailable.');
      console.error(error);
      return false;
    }
  }

  function stopRecording() {
    if (recordState.mediaRecorder && recordState.isRecording) {
      recordState.mediaRecorder.stop();
      recordState.isRecording = false;
      setStatus('Recording saved.');
    }
  }

  return { startRecording, stopRecording };
}
