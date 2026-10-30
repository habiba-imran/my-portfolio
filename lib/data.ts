export const profile = {
  name: "Habiba Imran",
  email: "habibaimrannn@gmail.com",
  github: "https://github.com/habiba-imran",
  linkedin: "https://www.linkedin.com/in/habiba-imran-118624258/",
  cv: "/Umm-e-Habiba-Imran-CV.pdf",
  university: "Bahria University",
  degree: "BS Computer Science",
  cgpa: "3.87",
  graduation: "December 2027",
};

export const navigation = [
  { name: "Home", href: "#home" },
  { name: "Work", href: "#projects" },
  { name: "About", href: "#about" },
  { name: "Experience", href: "#experience" },
  { name: "Contact", href: "#contact" },
];

export const projects = [
  {
    id: 1,
    name: "Awaaz Labs",
    category: "Voice AI / Professional work",
    action: "Private work — case study",
    title: "Awaaz Labs - AI Voice Platform",
    description:
      "Multi-product AI voice platform with real-time voice agents and QualiCall, an LLM-based call QA module for evaluation, scoring, and report generation.",
    tags: ["FastAPI", "NestJS", "LiveKit", "Twilio"],
    link: "",
    image: "",
    status: "Production platform",
    highlights: [
      "Realtime voice-agent workflows",
      "LLM-based call QA and scoring",
      "Dashboard configuration flows",
    ],
    role: "Full-stack product engineering",
    problem:
      "Teams need a reliable way to configure AI voice agents and evaluate call quality without jumping between disconnected tools.",
    approach: [
      "Designed dashboard flows around voice-agent configuration and call QA review.",
      "Connected backend APIs with real-time voice infrastructure and LLM-based evaluation logic.",
      "Supported report-generation workflows for call scoring and operational review.",
    ],
    results: ["Production product work at Finova Solutions."],
    metrics: ["Realtime calls", "LLM scoring", "Private product"],
  },
  {
    id: 2,
    name: "EarthScan AI",
    category: "Applied ML / Satellite imagery",
    action: "View source",
    title: "EarthScan AI",
    description:
      "Satellite-image damage classifier trained on xBD/xView2 disaster imagery, with CNN and hybrid CNN+KNN models, Flask inference, confidence output, and visual-change heatmaps.",
    tags: ["Python", "TensorFlow", "Flask", "OpenCV"],
    link: "https://github.com/habiba-imran/EarthScan-AI",
    image: "",
    status: "ML research app",
    highlights: [
      "CNN and CNN+KNN model pipeline",
      "xBD/xView2 disaster imagery",
      "Inference UI with heatmaps",
    ],
    role: "ML model development and Flask app engineering",
    problem:
      "Post-disaster assessment is slow when satellite imagery has to be inspected manually across damaged regions.",
    approach: [
      "Trained CNN and hybrid CNN+KNN models for building damage classification.",
      "Built a Flask interface for image upload, inference, confidence display, and heatmap output.",
      "Used pre/post-disaster imagery to make visual changes easier to inspect.",
    ],
    results: [
      "Trained on 2,799 paired pre/post-disaster satellite images from xBD/xView2 for four-class damage classification.",
      "Flask inference interface with confidence visualization and visual-change heatmaps.",
    ],
    metrics: ["2,799 image pairs", "4 damage classes", "Heatmap output"],
  },
  {
    id: 3,
    name: "VertexVoyage",
    category: "Algorithms / Interactive visualizer",
    action: "View source",
    title: "VertexVoyage Visualizer",
    description:
      "Interactive C++/SFML desktop visualizer for Dijkstra's shortest path algorithm on a Pakistan map, supporting multi-stop routing and real-time path rendering.",
    tags: ["C++", "SFML", "Algorithms", "Data Structures"],
    link: "https://github.com/habiba-imran/VERTEX-VOYAGE-SFML-BASED-DSA-PROJECT",
    image: "",
    status: "Desktop visualizer",
    highlights: [
      "Dijkstra route rendering",
      "Pakistan map interaction",
      "Multi-stop path visualization",
    ],
    role: "C++ desktop application engineering",
    problem:
      "Shortest-path algorithms are easier to understand when users can see routes update on a real map instead of static diagrams.",
    approach: [
      "Implemented graph data structures and Dijkstra shortest-path logic.",
      "Rendered interactive route paths with SFML on a Pakistan map.",
      "Supported multi-stop routing and real-time visual feedback.",
    ],
    results: [
      "Built as a data structures and algorithms visualization project.",
      "Interactive multi-stop route rendering on a Pakistan map.",
    ],
    metrics: ["C++/SFML", "Dijkstra", "Multi-stop routes"],
  },
  {
    id: 4,
    name: "AIDRA",
    category: "Full stack / Disaster response",
    action: "Explore demo",
    title: "AIDRA - AI Disaster Response",
    description:
      "Hybrid AI disaster-response simulator for urban triage, routing, and resource allocation, combining real-time simulation, ML predictions, and dynamic pathfinding.",
    tags: ["React", "TypeScript", "AI/ML", "Algorithms"],
    link: "https://aidra-048.netlify.app/",
    image: "",
    status: "Simulation system",
    highlights: [
      "Urban disaster triage flow",
      "ML-driven response predictions",
      "Dynamic routing simulation",
    ],
    role: "Frontend and AI simulation engineering",
    problem:
      "Urban disaster response needs fast triage, routing, and allocation decisions under changing conditions.",
    approach: [
      "Built an interactive disaster-response simulation interface.",
      "Combined ML-driven predictions with dynamic pathfinding behavior.",
      "Designed workflows for triage, routing, and resource allocation.",
    ],
    results: [
      "Live demo available on Netlify.",
      "Interactive workflows for urban triage, routing, and resource allocation.",
    ],
    metrics: ["Live demo", "Dynamic routing", "AI simulation"],
  },
];

export type Project = (typeof projects)[number];

export const expertise = [
  {
    title: "Real-time Voice AI",
    summary: "From the first word to the spoken response.",
    stack: "LiveKit · Deepgram · STT / LLM / TTS",
    description:
      "Conversational pipelines, streaming audio, LLM orchestration, phone-call workflows, and call quality evaluation.",
    skills: [
      "LiveKit",
      "Twilio",
      "Deepgram",
      "ElevenLabs",
      "STT",
      "TTS",
      "LLM Integration",
      "Prompt Engineering",
      "IBM watsonx",
    ],
  },
  {
    title: "Backend & Realtime APIs",
    summary: "The systems that make everything connect.",
    stack: "Python · FastAPI · WebSockets",
    description:
      "Backend services, asynchronous workflows, REST endpoints, and database integration for full-stack and AI products.",
    skills: [
      "Python",
      "FastAPI",
      "NestJS",
      "REST APIs",
      "WebSockets",
      "SQL",
      "PostgreSQL",
      "Supabase",
      "Docker",
    ],
  },
  {
    title: "Full-Stack Applications",
    summary: "Thoughtful interfaces. Useful products.",
    stack: "React · JavaScript · Product workflows",
    description:
      "Product dashboards, configuration flows, and usable interfaces connected to the services behind them.",
    skills: [
      "React",
      "JavaScript",
      "TypeScript",
      "Git",
      "GitHub",
      "VS Code",
      "OOP",
      "Operating Systems",
    ],
  },
  {
    title: "Applied AI & Algorithms",
    summary: "Making complex ideas tangible.",
    stack: "TensorFlow · OpenCV · C++",
    description:
      "Image classification, model inference, visual-change heatmaps, graph algorithms, and interactive simulations.",
    skills: [
      "TensorFlow",
      "Flask",
      "OpenCV",
      "NumPy",
      "Pandas",
      "C++",
      "SFML",
      "Data Structures & Algorithms",
      "Assembly",
    ],
  },
];

export const recognition = [
  { title: "CodeQuest", detail: "2nd Position · GDGOC x YOTA" },
  {
    title: "Merit Scholarship",
    detail: "1st in 5th Sem · 2nd in 3rd Sem · 3rd in 2nd Sem",
  },
  { title: "PM’s Laptop Scheme 2025", detail: "Selected Recipient · Phase IV" },
  { title: "IBM watsonx", detail: "Technical Sales Intermediate" },
];

export const experiences = [
  {
    id: 1,
    title: "Full Stack Developer",
    company: "Finova Solutions",
    period: "April 2026 - Ongoing",
    description:
      "Built full-stack SaaS features across dashboards, backend APIs, and configuration workflows for AI-powered voice and call evaluation products.",
  },
  {
    id: 2,
    title: "Intern",
    company: "Finova Solutions",
    period: "February 2026 - April 2026",
    description:
      "Developed a production voice AI pipeline for phone-call automation, connecting call input, LLM processing, and TTS output.",
  },
  {
    id: 3,
    title: "Intern",
    company: "SPS-NASTP",
    period: "July 2025 - Sept 2025",
    description:
      "Built GreenKeyper, a conversational AI app using IBM watsonx Assistant, with chatbot logic, assistant configuration, and interaction-flow design.",
  },
];
