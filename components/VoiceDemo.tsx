"use client";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  BrainCircuit,
  Radio,
  Volume2,
} from "lucide-react";
const stages = [
  {
    short: "STT",
    name: "First, listen.",
    label: "Speech to text",
    icon: Radio,
    text: "Streaming speech recognition turns incoming audio into text, so the agent can work with what someone actually says.",
  },
  {
    short: "LLM",
    name: "Then, understand.",
    label: "Language & reasoning",
    icon: BrainCircuit,
    text: "The language model uses the conversation context to decide what to say next and whether it needs information from a tool.",
  },
  {
    short: "TTS",
    name: "And, respond.",
    label: "Text to speech",
    icon: Volume2,
    text: "Speech synthesis turns the response into audio. Streaming the output helps a conversation flow naturally.",
  },
];
export default function VoiceDemo() {
  const [stage, setStage] = useState(0);
  const current = stages[stage];
  const Icon = current.icon;
  return (
    <section
      id="voice"
      className="voice-section section-space"
      aria-labelledby="voice-heading"
    >
      <div className="container voice-grid">
        <div className="voice-copy" data-reveal>
          <span className="eyebrow">
            <span className="tiny-spark" aria-hidden="true">
              ✳
            </span>
            05 / The voice lab
          </span>
          <h2 id="voice-heading">
            Software with <br />
            something
            <br />
            <span>to say.</span>
          </h2>
          <p>
            I’m especially interested in what happens when an interface becomes
            a conversation. Here’s a look inside a real-time voice AI pipeline.
          </p>
          <a className="text-link" href="#projects">
            Explore my voice AI work{" "}
            <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </div>
        <div className="voice-console" data-reveal>
          <div className="voice-console-top">
            <span>
              <AudioLines size={17} aria-hidden="true" />
              Inside the conversation
            </span>
            <span>Architecture explorer</span>
          </div>
          <div
            className={`voice-rings voice-rings--${stage}`}
            aria-hidden="true"
          >
            <span />
            <span />
            <span />
            <span />
            <div>
              <Icon size={42} strokeWidth={1.25} />
            </div>
            <i className="voice-orbit-dot" />
          </div>
          <div
            className="voice-stage-tabs"
            role="group"
            aria-label="Explore the voice pipeline"
          >
            {stages.map((item, index) => (
              <button
                type="button"
                key={item.short}
                aria-pressed={stage === index}
                aria-controls="voice-stage-detail"
                onClick={() => setStage(index)}
              >
                <span>{item.short}</span>
                {index < 2 && <ArrowRight size={13} aria-hidden="true" />}
              </button>
            ))}
          </div>
          <div
            id="voice-stage-detail"
            className="voice-stage-detail"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="eyebrow">
              0{stage + 1} / {current.label}
            </span>
            <h3>{current.name}</h3>
            <p>{current.text}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
