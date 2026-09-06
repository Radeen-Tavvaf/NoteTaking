export function setupVoiceTools({
  getCurrentNote,
  onAudioSaved,
  onTranscriptSaved,
  setStatus,
}) {
  // Keep recorder and recognition state private so switching notes cannot leak browser handles.
  const recordState = {
    mediaRecorder: null,
    audioChunks: [],
    stream: null,
    isRecording: false,
    recognition: null,
    isTranscribing: false,
    receivedTranscript: false,
  };

  const getSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    return SpeechRecognition ? new SpeechRecognition() : null;
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

  function startTranscription() {
    // SpeechRecognition is optional and browser-specific, so every run starts with capability checks.
    if (recordState.isTranscribing) {
      setStatus('Already listening for a transcript.');
      return;
    }

    const recognitionInstance = getSpeechRecognition();
    if (!recognitionInstance) {
      setStatus('Speech-to-text is not supported in this browser.');
      return;
    }

    recordState.recognition = recognitionInstance;
    recordState.isTranscribing = true;
    recordState.receivedTranscript = false;
    recordState.recognition.continuous = false;
    recordState.recognition.interimResults = false;
    recordState.recognition.lang = 'en-US';

    recordState.recognition.onresult = async (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || '')
        .join(' ')
        .trim();

      if (!transcript) return;

      recordState.receivedTranscript = true;

      const note = getCurrentNote();
      if (!note) return;
      note.transcript = transcript;
      note.updatedAt = new Date().toISOString();
      await onTranscriptSaved(note, transcript);
    };

    recordState.recognition.onerror = (event) => {
      recordState.isTranscribing = false;
      console.error(event.error);
      setStatus('Transcription failed. Please try again.');
    };

    recordState.recognition.onend = () => {
      recordState.isTranscribing = false;
      if (!recordState.receivedTranscript) {
        setStatus('No speech detected. Please try again.');
      }
    };

    try {
      recordState.recognition.start();
      setStatus('Listening for transcript...');
    } catch (error) {
      recordState.isTranscribing = false;
      setStatus('The microphone is already in use. Please try again.');
    }
  }

  return { startRecording, stopRecording, startTranscription };
}
