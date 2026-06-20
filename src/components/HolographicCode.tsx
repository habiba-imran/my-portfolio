import { useEffect, useState, memo } from 'react';

const codeSnippet = `
def initialize_voice_agent(model="watsonx"):
    """
    Configures real-time STT/TTS pipeline 
    for interactive AI workflows.
    """
    pipeline = VoicePipeline(
        stt_provider=DeepgramConfig(),
        llm_provider=WatsonXConfig(temperature=0.7),
        tts_provider=ElevenLabsConfig(voice_id="clarity")
    )
    
    pipeline.connect_websocket(port=8080)
    
    async def handle_stream(audio_chunk):
        transcript = await pipeline.stt.decode(audio_chunk)
        response = await pipeline.llm.generate(transcript)
        audio_out = await pipeline.tts.synthesize(response)
        return audio_out

    return pipeline
`;

const HolographicCode = memo(function HolographicCode() {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let i = 0;
    
    // Start much sooner
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayedText(codeSnippet.slice(0, i));
        i += 4; // Type 4 characters at a time
        if (i > codeSnippet.length) {
          setDisplayedText(codeSnippet);
          clearInterval(interval);
        }
      }, 15); // Ultra-fast interval
      
      return () => clearInterval(interval);
    }, 200);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div 
      className="absolute left-[-5%] top-[10%] overflow-hidden pointer-events-none z-0 opacity-[0.06] font-mono text-sm md:text-base leading-loose whitespace-pre text-accent mix-blend-screen"
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)',
      }}
      aria-hidden="true"
    >
      {displayedText}
      <span className="animate-pulse">_</span>
    </div>
  );
});

export default HolographicCode;
