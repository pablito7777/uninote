import React, { useState } from 'react';
import { Upload, FileAudio, Loader2, Download, Trash2, Key, AlertCircle, Info } from 'lucide-react';

export default function AudioTranscriptionDashboard() {
  const [apiKey, setApiKey] = useState('');
  const [files, setFiles] = useState([]);
  const [transcribing, setTranscribing] = useState({});
  const [showApiKey, setShowApiKey] = useState(false);

  const handleFileUpload = (e) => {
    const newFiles = Array.from(e.target.files).map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2),
      transcription: null,
      error: null
    }));
    setFiles([...files, ...newFiles]);
  };

  const transcribeAudio = async (fileItem) => {
    if (!apiKey) {
      alert('Inserisci la tua API Key di OpenAI');
      return;
    }

    // Verifica dimensione file (max 25MB)
    if (fileItem.file.size > 25 * 1024 * 1024) {
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, error: 'Il file supera i 25 MB. Riduci la dimensione del file.' }
          : f
      ));
      return;
    }

    setTranscribing(prev => ({ ...prev, [fileItem.id]: true }));

    const formData = new FormData();
    formData.append('file', fileItem.file);
    formData.append('language', 'it');

    try {
      // Usa il server proxy locale
      const proxyUrl = 'http://localhost:3001/api/transcribe';
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        let errorMessage = 'Errore nella trascrizione';
        try {
          const error = await response.json();
          errorMessage = error.error?.message || errorMessage;
        } catch {
          errorMessage = `Errore HTTP: ${response.status}. Assicurati che il server proxy sia in esecuzione su localhost:3001`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, transcription: data.text, error: null }
          : f
      ));
    } catch (error) {
      console.error('Errore trascrizione:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, error: error.message || 'Impossibile connettersi al server. Verifica che il proxy sia in esecuzione.' }
          : f
      ));
    } finally {
      setTranscribing(prev => ({ ...prev, [fileItem.id]: false }));
    }
  };

  const downloadTranscription = (fileItem) => {
    const blob = new Blob([fileItem.transcription], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileItem.name.replace(/\.[^/.]+$/, '')}_trascrizione.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const removeFile = (id) => {
    setFiles(files.filter(f => f.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 flex items-center gap-3">
            <FileAudio className="text-indigo-600" size={32} />
            Dashboard Trascrizione Audio
          </h1>
          
          {/* Soluzione CORS Alert */}
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="text-blue-600 flex-shrink-0 mt-1" size={20} />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-2">Setup Richiesto</h3>
                <p className="text-sm text-blue-800 mb-2">
                  Per far funzionare la trascrizione, devi avviare il server proxy Node.js. Segui questi passaggi:
                </p>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Scarica i file server.js e package.json dagli artifacts</li>
                  <li>Apri il terminale nella cartella dei file</li>
                  <li>Esegui: <code className="bg-blue-100 px-2 py-1 rounded">npm install</code></li>
                  <li>Avvia il server: <code className="bg-blue-100 px-2 py-1 rounded">node server.js</code></li>
                  <li>Il server sarà disponibile su http://localhost:3001</li>
                </ol>
              </div>
            </div>
          </div>

          {/* API Key Input */}
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Key size={16} />
                OpenAI API Key
              </label>
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="mt-8 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {showApiKey ? 'Nascondi' : 'Mostra'}
            </button>
          </div>
          
          <div className="mt-3 flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <p>La tua API Key è salvata solo in memoria e non viene memorizzata permanentemente.</p>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-indigo-300 rounded-lg cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="text-indigo-600 mb-3" size={48} />
              <p className="mb-2 text-lg font-semibold text-gray-700">
                Carica file audio
              </p>
              <p className="text-sm text-gray-500">
                Formati supportati: MP3, MP4, MPEG, MPGA, M4A, WAV, WEBM
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Dimensione massima: 25 MB
              </p>
            </div>
            <input
              type="file"
              multiple
              accept="audio/*,.mp3,.mp4,.mpeg,.mpga,.m4a,.wav,.webm"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Files List */}
        {files.length > 0 && (
          <div className="space-y-4">
            {files.map(fileItem => (
              <div key={fileItem.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <FileAudio className="text-indigo-600 mt-1 flex-shrink-0" size={24} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {fileItem.name}
                      </h3>
                      <p className="text-sm text-gray-500">{fileItem.size} MB</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {!fileItem.transcription && !transcribing[fileItem.id] && (
                      <button
                        onClick={() => transcribeAudio(fileItem)}
                        disabled={!apiKey}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        <FileAudio size={16} />
                        Trascrivi
                      </button>
                    )}
                    
                    {transcribing[fileItem.id] && (
                      <button
                        disabled
                        className="px-4 py-2 bg-indigo-400 text-white rounded-lg flex items-center gap-2"
                      >
                        <Loader2 size={16} className="animate-spin" />
                        Trascrivendo...
                      </button>
                    )}
                    
                    {fileItem.transcription && (
                      <button
                        onClick={() => downloadTranscription(fileItem)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <Download size={16} />
                        Scarica
                      </button>
                    )}
                    
                    <button
                      onClick={() => removeFile(fileItem.id)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {fileItem.error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 flex items-start gap-2">
                      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                      {fileItem.error}
                    </p>
                  </div>
                )}

                {/* Transcription Result */}
                {fileItem.transcription && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Trascrizione:</h4>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {fileItem.transcription}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {files.length === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <FileAudio className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Nessun file caricato
            </h3>
            <p className="text-gray-500">
              Carica i tuoi file audio per iniziare la trascrizione
            </p>
          </div>
        )}
      </div>
    </div>
  );
}