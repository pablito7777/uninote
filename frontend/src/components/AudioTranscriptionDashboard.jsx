import React, { useState, useEffect } from 'react';
import { Upload, FileAudio, Loader2, Download, Trash2, Key, AlertCircle, Info, Headphones, Mic, Volume2, Music, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AudioTranscriptionDashboard() {
  const [apiKey, setApiKey] = useState('');
  const [files, setFiles] = useState([]);
  const [transcribing, setTranscribing] = useState({});
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);


  // Simulazione caricamento iniziale
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

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

  // Funzione per spezzettare il file in parti più piccole
  const splitAudioFile = async (file) => {
    // Se il file è già abbastanza piccolo, restituiscilo direttamente
    if (file.size <= 20 * 1024 * 1024) {
      return [file];
    }
    
    // Dimensione di ogni chunk (20MB)
    const chunkSize = 20 * 1024 * 1024;
    const chunks = [];
    
    // Calcola quanti chunk ci saranno
    const totalChunks = Math.ceil(file.size / chunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(file.size, start + chunkSize);
      
      // Estrai il chunk dal file
      const chunk = file.slice(start, end);
      
      // Crea un nuovo File object con il nome originale più l'estensione
      const originalName = file.name;
      const extension = originalName.split('.').pop();
      const chunkFile = new File(
        [chunk], 
        `${originalName.replace(`.${extension}`, '')}_part${i+1}.${extension}`, 
        { type: file.type }
      );
      
      chunks.push(chunkFile);
    }
    
    return chunks;
  };
  
  // Funzione per trascrivere un singolo chunk
  const transcribeChunk = async (chunk, fileId, chunkIndex, totalChunks) => {
    const formData = new FormData();
    formData.append('file', chunk);
    formData.append('language', 'it');
    
    const proxyUrl = 'http://localhost:3001/api/transcribe';
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });
    
    if (!response.ok) {
      let errorMessage = `Errore nella trascrizione del chunk ${chunkIndex + 1}/${totalChunks}`;
      try {
        const error = await response.json();
        errorMessage = error.error?.message || errorMessage;
      } catch {
        errorMessage = `Errore HTTP: ${response.status} nel chunk ${chunkIndex + 1}/${totalChunks}`;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data.text;
  };
  
  // Verifica se il file è troppo grande
  const isFileTooLarge = (file) => {
    // Dimensione massima consentita (25MB)
    const MAX_FILE_SIZE = 25 * 1024 * 1024;
    return file.size > MAX_FILE_SIZE;
  };

  const transcribeAudio = async (fileItem) => {
    if (!apiKey) {
      alert('Inserisci la tua API Key di OpenAI');
      return;
    }

    // Verifica se il file è troppo grande
    if (isFileTooLarge(fileItem.file)) {
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, error: 'Il file supera i 25 MB. Per favore, comprimi il file o riduci la durata dell\'audio.' }
          : f
      ));
      return;
    }

    setTranscribing(prev => ({ ...prev, [fileItem.id]: true }));
    
    try {
      const formData = new FormData();
      formData.append('file', fileItem.file);
      formData.append('language', 'it');
      
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

  // Elementi decorativi
  const WaveBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-10 right-10 w-64 h-64 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 left-20 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-40 right-40 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      <div className="absolute bottom-20 left-40 w-60 h-60 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-6000"></div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-900 flex items-center justify-center">
        <WaveBackground />
        <div className="text-center">
          <div className="inline-block p-6 bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white border-opacity-20 mb-6">
            <Headphones className="text-white animate-pulse" size={64} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">VoiceScribe</h2>
          <p className="text-indigo-200">Caricamento in corso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-900 p-6 relative">
      <WaveBackground />
      
      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 mb-8 border border-white border-opacity-20 transition-all duration-500 hover:bg-opacity-15">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-xl shadow-lg relative overflow-hidden group">
                <Headphones className="text-white relative z-10" size={32} />
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white flex items-center gap-2">
                  VoiceScribe
                  <span className="inline-block">
                    <Sparkles className="text-yellow-300" size={20} />
                  </span>
                </h1>
                <p className="text-indigo-200">Trascrizione audio professionale con AI</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500 bg-opacity-20 text-green-200 border border-green-500 border-opacity-30">
                <span className="w-2 h-2 mr-1 bg-green-400 rounded-full animate-pulse"></span>
                Server attivo
              </span>
            </div>
          </div>
          
          {/* API Key Input */}
          <div className="bg-white bg-opacity-5 rounded-xl p-6 border border-white border-opacity-10 mb-6 transition-all duration-300 hover:border-opacity-20">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-indigo-600 p-2 rounded-lg relative overflow-hidden">
                <Key className="text-white relative z-10" size={20} />
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h2 className="text-xl font-semibold text-white">Configurazione API</h2>
            </div>
            
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
              <div className="flex-1 relative w-full">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Inserisci la tua OpenAI API Key (sk-...)"
                  className="w-full px-10 py-3 bg-white bg-opacity-10 border border-indigo-300 border-opacity-30 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-white placeholder-indigo-200 placeholder-opacity-50 transition-all duration-300 hover:bg-opacity-15"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key size={16} className="text-indigo-300" />
                </div>
              </div>
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl w-full md:w-auto"
              >
                {showApiKey ? 'Nascondi' : 'Mostra'}
              </button>
            </div>
            
            <div className="mt-3 flex items-start gap-2 text-sm text-indigo-200 bg-indigo-900 bg-opacity-30 p-3 rounded-lg border border-indigo-500 border-opacity-20">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-indigo-300" />
              <p>La tua API Key è salvata solo in memoria e non viene memorizzata permanentemente.</p>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 mb-8 border border-white border-opacity-20 transition-all duration-500 hover:bg-opacity-15">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-600 p-2 rounded-lg relative overflow-hidden group">
              <Mic className="text-white relative z-10" size={20} />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <h2 className="text-xl font-semibold text-white">Carica i tuoi file audio</h2>
          </div>
          
          <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-indigo-400 border-opacity-50 rounded-xl cursor-pointer bg-indigo-600 bg-opacity-10 hover:bg-opacity-20 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 opacity-0 group-hover:opacity-5 transition-all duration-500"></div>
            <div className="flex flex-col items-center justify-center pt-5 pb-6 relative z-10">
              <div className="mb-4 bg-gradient-to-r from-purple-500 to-indigo-600 p-4 rounded-full shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Upload className="text-white" size={36} />
              </div>
              <p className="mb-3 text-xl font-semibold text-white">
                Trascina i file qui o clicca per caricare
              </p>
              <p className="text-sm text-indigo-200 mb-2">
                Formati supportati: MP3, MP4, MPEG, MPGA, M4A, WAV, WEBM
              </p>
              <p className="text-xs text-indigo-300 flex items-center gap-1">
                <AlertCircle size={12} />
                File grandi verranno elaborati in parti
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
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-600 p-2 rounded-lg relative overflow-hidden group">
                <Volume2 className="text-white relative z-10" size={20} />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h2 className="text-xl font-semibold text-white">I tuoi file audio</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {files.map(fileItem => (
                <div 
                  key={fileItem.id} 
                  className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl shadow-xl p-6 border border-white border-opacity-20 transition-all duration-300 hover:bg-opacity-15 hover:shadow-2xl hover:translate-y-[-2px]"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-lg shadow-md relative overflow-hidden group">
                        <FileAudio className="text-white relative z-10" size={24} />
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-lg truncate">
                          {fileItem.name}
                        </h3>
                        <p className="text-sm text-indigo-200 flex items-center gap-1">
                          <Music size={14} className="text-indigo-300" />
                          {fileItem.size} MB
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 justify-end">
                      {!fileItem.transcription && !transcribing[fileItem.id] && (
                        <button
                          onClick={() => transcribeAudio(fileItem)}
                          disabled={!apiKey}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-500 disabled:to-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 relative overflow-hidden group"
                        >
                          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                          <FileAudio size={16} className="relative z-10" />
                          <span className="relative z-10">Trascrivi</span>
                        </button>
                      )}
                      
                      {transcribing[fileItem.id] && (
                        <button
                          disabled
                          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg shadow-lg flex items-center gap-2 relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 animate-pulse"></div>
                          <Loader2 size={16} className="animate-spin relative z-10" />
                          <span className="relative z-10">
                            {chunksProgress[fileItem.id]?.totalChunks > 1 
                              ? `Trascrivendo parte ${chunksProgress[fileItem.id]?.currentChunk || 0}/${chunksProgress[fileItem.id]?.totalChunks || 0}...` 
                              : "Trascrivendo..."}
                          </span>
                        </button>
                      )}
                      
                      {fileItem.transcription && (
                        <button
                          onClick={() => downloadTranscription(fileItem)}
                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 relative overflow-hidden group"
                        >
                          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-green-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                          <Download size={16} className="relative z-10" />
                          <span className="relative z-10">Scarica</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => removeFile(fileItem.id)}
                        className="p-2 bg-red-500 bg-opacity-20 text-red-300 rounded-lg hover:bg-opacity-30 transition-all duration-300 border border-red-500 border-opacity-30 hover:border-opacity-50 relative overflow-hidden group"
                      >
                        <span className="absolute inset-0 bg-red-500 bg-opacity-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                        <Trash2 size={16} className="relative z-10" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar for Chunks */}
                  {transcribing[fileItem.id] && (
                        <div className="mt-4 animate-fadeIn">
                          <div className="flex justify-between text-xs text-indigo-300 mb-1">
                             <span>Trascrizione in corso...</span>
                           </div>
                          <div className="w-full bg-indigo-900 bg-opacity-30 rounded-full h-2.5 mb-1">
                            <div 
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full transition-all duration-300 animate-pulse"
                              style={{ width: '60%' }}
                            ></div>
                          </div>
                        </div>
                      )}

                  {/* Error Message */}
                  {fileItem.error && (
                    <div className="mt-4 p-4 bg-red-900 bg-opacity-30 border border-red-500 border-opacity-30 rounded-lg animate-fadeIn">
                      <p className="text-sm text-red-200 flex items-start gap-2">
                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                        {fileItem.error}
                      </p>
                    </div>
                  )}

                  {/* Transcription Result */}
                  {fileItem.transcription && (
                    <div className="mt-5 animate-fadeIn">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-px flex-1 bg-indigo-300 bg-opacity-20"></div>
                        <h4 className="font-medium text-indigo-200 px-2 flex items-center gap-1">
                          <CheckCircle2 size={14} className="text-green-400" />
                          Trascrizione completata
                        </h4>
                        <div className="h-px flex-1 bg-indigo-300 bg-opacity-20"></div>
                      </div>
                      <div className="p-5 bg-white bg-opacity-5 rounded-lg border border-indigo-500 border-opacity-20 max-h-64 overflow-y-auto">
                        <p className="text-indigo-100 whitespace-pre-wrap leading-relaxed">
                          {fileItem.transcription}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {files.length === 0 && (
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl shadow-xl p-12 text-center border border-white border-opacity-20 transition-all duration-500 hover:bg-opacity-15">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-full inline-flex mb-6 shadow-lg relative overflow-hidden group">
              <FileAudio className="text-white relative z-10" size={48} />
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">
              Nessun file caricato
            </h3>
            <p className="text-indigo-200 max-w-md mx-auto">
              Carica i tuoi file audio per iniziare la trascrizione con l'intelligenza artificiale
            </p>
          </div>
        )}
        
        {/* Footer */}
        <div className="mt-12 text-center text-indigo-300 text-sm">
          <p className="flex items-center justify-center gap-1">
            <Sparkles size={14} className="text-yellow-300" />
            Powered by OpenAI Whisper API • Trascrizione audio di alta qualità
          </p>
        </div>
      </div>
    </div>
  );
}