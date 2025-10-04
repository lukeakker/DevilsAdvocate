import React, { useState, useRef, useEffect } from 'react';

/**
 * Main application component for the Devil's Advocate Debater UI.
 *
 * This component implements a simple chat interface similar to ChatGPT. Users
 * can select a character persona (Socrates, Karen 2.0 or Professor Logic)
 * via a dropdown in the header. They can enter a stance in the text input
 * at the bottom, or record their stance using the microphone button. When
 * the stance is submitted, the app sends it to the Django backend which
 * generates a rebuttal and returns a session identifier. The response is
 * displayed in the chat transcript and converted to speech via ElevenLabs.
 *
 * State variables:
 *   - persona: which character to use for rebuttals
 *   - sessionId: unique identifier for the current conversation
 *   - input: contents of the text input field
 *   - transcript: array of message objects { role, text }
 *   - loading: whether the app is waiting for a response
 *   - audioUrl: URL of the latest generated audio for playback
 *   - recording: whether mic capture is in progress
 *   - recorder: a MediaRecorder instance for capturing audio
 */
export default function App() {
  const [persona, setPersona] = useState('socrates');
  const [sessionId, setSessionId] = useState(null);
  const [input, setInput] = useState('');
  const [transcript, setTranscript] = useState([]);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioPlayerRef = useRef(null);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

  /**
   * Helper: append a message to the transcript state.
   */
  const appendMessage = (role, text) => {
    setTranscript((prev) => [...prev, { role, text }]);
  };

  /**
   * Handle submission of a text stance. Sends a request to the backend to
   * generate a rebuttal and updates state accordingly.
   */
  const submitStance = async (stanceText) => {
    const trimmed = stanceText.trim();
    if (!trimmed) return;
    appendMessage('user', trimmed);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/rebuttal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stance: trimmed, persona, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error generating rebuttal');
      // Update session
      if (data.sessionId) setSessionId(data.sessionId);
      // Display rebuttal
      appendMessage('assistant', data.rebuttal_text);
      // Generate TTS
      const ttsRes = await fetch(`${API_BASE}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: data.rebuttal_text }),
      });
      const ttsData = await ttsRes.json();
      if (ttsRes.ok) {
        setAudioUrl(ttsData.audio_url);
        // wait a moment then play
        setTimeout(() => {
          if (audioPlayerRef.current) {
            audioPlayerRef.current.play().catch(() => {});
          }
        }, 200);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form submission from the text input. Prevents default form
   * behaviour and triggers the API call.
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return;
    submitStance(input);
    setInput('');
  };

  /**
   * Toggle microphone recording. Uses the MediaRecorder API to capture
   * audio and sends it to the backend when stopped. Note: due to
   * browser security restrictions you must serve the site over HTTPS
   * or from localhost to access the microphone.
   */
  const toggleRecording = async () => {
    if (recording) {
      // Stop recording
      recorderRef.current.stop();
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        recorderRef.current = recorder;
        chunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = async () => {
          // Convert to Blob and send to STT endpoint
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
          setRecording(false);
          try {
            const formData = new FormData();
            formData.append('file', blob, 'recording.webm');
            const res = await fetch(`${API_BASE}/stt`, {
              method: 'POST',
              body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Speech‑to‑text failed');
            // Use transcript as stance
            submitStance(data.transcript);
          } catch (err) {
            alert(err.message);
          }
        };
        recorder.start();
        setRecording(true);
      } catch (err) {
        alert('Failed to access microphone');
      }
    }
  };

  /**
   * Reset the current session and clear the transcript.
   */
  const resetSession = async () => {
    if (!sessionId) {
      setTranscript([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error resetting session');
      setTranscript([]);
      setAudioUrl('');
    } catch (err) {
      alert(err.message);
    }
  };

  /**
   * Download the transcript as a text file. Opens a new tab to the
   * backend download endpoint.
   */
  const downloadTranscript = () => {
    if (!sessionId) return;
    const url = `${API_BASE}/download?sessionId=${sessionId}`;
    window.open(url, '_blank');
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <strong>Devil's Advocate</strong>
        </div>
        <div>
          <label htmlFor="persona" style={{ marginRight: 8 }}>Character:</label>
          <select
            id="persona"
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            style={styles.select}
          >
            <option value="socrates">Socrates</option>
            <option value="karen2.0">Karen 2.0</option>
            <option value="professorlogic">Professor Logic</option>
          </select>
          <button onClick={resetSession} style={styles.smallButton} title="Reset conversation">
            Reset
          </button>
          <button onClick={downloadTranscript} style={styles.smallButton} title="Download transcript">
            Download
          </button>
        </div>
      </header>
      <main style={styles.transcript}>
        {transcript.map((msg, idx) => (
          <div key={idx} style={msg.role === 'user' ? styles.userMsg : styles.assistantMsg}>
            <strong>{msg.role === 'user' ? 'You' : 'Opponent'}:</strong> {msg.text}
          </div>
        ))}
      </main>
      {audioUrl && (
        <audio ref={audioPlayerRef} src={`${API_BASE.replace('/api', '')}${audioUrl}`} controls style={styles.audio} />
      )}
      <form onSubmit={handleSubmit} style={styles.inputBar}>
        <button type="button" onClick={toggleRecording} style={styles.voiceButton}>
          {recording ? 'Stop' : '🎤'}
        </button>
        <input
          type="text"
          placeholder="Enter your stance here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={styles.input}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} style={styles.sendButton}>
          {loading ? '...' : 'Send'}
        </button>
      </form>
      <footer style={styles.footer}>
        <small>Built with Django and React. Speak responsibly!</small>
      </footer>
    </div>
  );
}

// Inline styles for simplicity. Feel free to extract these into CSS.
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    maxWidth: 800,
    margin: '0 auto',
    fontFamily: 'sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px',
    borderBottom: '1px solid #ccc',
  },
  transcript: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    backgroundColor: '#f9f9fa',
  },
  userMsg: {
    marginBottom: 8,
    background: '#e8f0fe',
    padding: '8px',
    borderRadius: 4,
  },
  assistantMsg: {
    marginBottom: 8,
    background: '#fff',
    padding: '8px',
    borderRadius: 4,
  },
  inputBar: {
    display: 'flex',
    padding: '8px',
    borderTop: '1px solid #ccc',
  },
  input: {
    flex: 1,
    padding: '8px',
    margin: '0 8px',
    fontSize: 16,
  },
  voiceButton: {
    padding: '8px',
    fontSize: 18,
    background: '#f0f0f0',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
  },
  sendButton: {
    padding: '8px 16px',
    fontSize: 16,
    background: '#4b80f0',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
  },
  select: {
    marginRight: 8,
    padding: '4px 8px',
  },
  smallButton: {
    marginLeft: 8,
    padding: '4px 8px',
    fontSize: 12,
    background: '#eee',
    border: '1px solid #ccc',
    borderRadius: 4,
    cursor: 'pointer',
  },
  audio: {
    width: '100%',
    margin: '0',
    padding: '8px 16px',
    borderTop: '1px solid #ccc',
    background: '#fff',
  },
  footer: {
    textAlign: 'center',
    padding: '4px',
    fontSize: '12px',
    color: '#666',
  },
};