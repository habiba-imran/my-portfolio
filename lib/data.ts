export const projects = [
  {
    id: 1,
    title: 'Awaaz Labs - AI Voice Platform',
    description: 'Multi-product AI voice platform with real-time voice agents and QualiCall, an LLM-based call QA module for evaluation, scoring, and report generation.',
    tags: ['FastAPI', 'NestJS', 'LiveKit', 'Twilio'],
    link: '',
    image: '',
    status: 'Production platform',
    highlights: ['Realtime voice-agent workflows', 'LLM-based call QA and scoring', 'Dashboard configuration flows'],
    role: 'Full-stack product engineering',
    problem: 'Teams need a reliable way to configure AI voice agents and evaluate call quality without jumping between disconnected tools.',
    approach: [
      'Designed dashboard flows around voice-agent configuration and call QA review.',
      'Connected backend APIs with real-time voice infrastructure and LLM-based evaluation logic.',
      'Supported report-generation workflows for call scoring and operational review.',
    ],
    results: [
      'Production product work at Finova Solutions.',
      'Private implementation details can be added here later.',
      'Add any usage, latency, call volume, or QA accuracy metrics when available.',
    ],
    metrics: ['Realtime calls', 'LLM scoring', 'Private product'],
  },
  {
    id: 2,
    title: 'EarthScan AI',
    description: 'Satellite-image damage classifier trained on xBD/xView2 disaster imagery, with CNN and hybrid CNN+KNN models, Flask inference, confidence output, and visual-change heatmaps.',
    tags: ['Python', 'TensorFlow', 'Flask', 'OpenCV'],
    link: 'https://github.com/habiba-imran/EarthScan-AI',
    image: '',
    status: 'ML research app',
    highlights: ['CNN and CNN+KNN model pipeline', 'xBD/xView2 disaster imagery', 'Inference UI with heatmaps'],
    role: 'ML model development and Flask app engineering',
    problem: 'Post-disaster assessment is slow when satellite imagery has to be inspected manually across damaged regions.',
    approach: [
      'Trained CNN and hybrid CNN+KNN models for building damage classification.',
      'Built a Flask interface for image upload, inference, confidence display, and heatmap output.',
      'Used pre/post-disaster imagery to make visual changes easier to inspect.',
    ],
    results: [
      'Trained on xBD/xView2 disaster imagery.',
      'Add final model accuracy, dataset split, and example outputs here.',
      'Add before/after screenshots once available.',
    ],
    metrics: ['2,799 image pairs', '4 damage classes', 'Heatmap output'],
  },
  {
    id: 3,
    title: 'VertexVoyage Visualizer',
    description: 'Interactive C++/SFML desktop visualizer for Dijkstra\'s shortest path algorithm on a Pakistan map, supporting multi-stop routing and real-time path rendering.',
    tags: ['C++', 'SFML', 'Algorithms', 'Data Structures'],
    link: 'https://github.com/habiba-imran/VERTEX-VOYAGE-SFML-BASED-DSA-PROJECT',
    image: '',
    status: 'Desktop visualizer',
    highlights: ['Dijkstra route rendering', 'Pakistan map interaction', 'Multi-stop path visualization'],
    role: 'C++ desktop application engineering',
    problem: 'Shortest-path algorithms are easier to understand when users can see routes update on a real map instead of static diagrams.',
    approach: [
      'Implemented graph data structures and Dijkstra shortest-path logic.',
      'Rendered interactive route paths with SFML on a Pakistan map.',
      'Supported multi-stop routing and real-time visual feedback.',
    ],
    results: [
      'Built as a data structures and algorithms visualization project.',
      'Add route count, graph size, or demo GIF later.',
      'Add screenshots of the map and route output once available.',
    ],
    metrics: ['C++/SFML', 'Dijkstra', 'Multi-stop routes'],
  },
  {
    id: 4,
    title: 'AIDRA - AI Disaster Response',
    description: 'Hybrid AI disaster-response simulator for urban triage, routing, and resource allocation, combining real-time simulation, ML predictions, and dynamic pathfinding.',
    tags: ['React', 'TypeScript', 'AI/ML', 'Algorithms'],
    link: 'https://aidra-048.netlify.app/',
    image: '',
    status: 'Simulation system',
    highlights: ['Urban disaster triage flow', 'ML-driven response predictions', 'Dynamic routing simulation'],
    role: 'Frontend and AI simulation engineering',
    problem: 'Urban disaster response needs fast triage, routing, and allocation decisions under changing conditions.',
    approach: [
      'Built an interactive disaster-response simulation interface.',
      'Combined ML-driven predictions with dynamic pathfinding behavior.',
      'Designed workflows for triage, routing, and resource allocation.',
    ],
    results: [
      'Live demo available on Netlify.',
      'Add simulation scenarios, model details, and screenshots later.',
      'Add any performance or response-time metrics when available.',
    ],
    metrics: ['Live demo', 'Dynamic routing', 'AI simulation'],
  },
];

export const skillCategories = [
  {
    title: 'Languages',
    skills: ['Python', 'JavaScript', 'C++', 'SQL', 'Assembly'],
  },
  {
    title: 'Frameworks & Libraries',
    skills: ['FastAPI', 'NestJS', 'React', 'NumPy', 'Pandas'],
  },
  {
    title: 'AI & Voice Technologies',
    skills: ['LLM Integration', 'Prompt Engineering', 'STT', 'TTS', 'Deepgram', 'ElevenLabs', 'IBM watsonx'],
  },
  {
    title: 'Backend & Databases',
    skills: ['REST APIs', 'WebSockets', 'Twilio', 'LiveKit', 'PostgreSQL', 'Supabase'],
  },
  {
    title: 'Tools',
    skills: ['Git', 'GitHub', 'VS Code'],
  },
  {
    title: 'CS Core',
    skills: ['Data Structures & Algorithms', 'OOP', 'Operating Systems'],
  },
];

export const experiences = [
  {
    id: 1,
    title: 'Full Stack Developer',
    company: 'Finova Solutions',
    period: 'April 2026 - Ongoing',
    description: 'Built full-stack SaaS features across dashboards, backend APIs, and configuration workflows for AI-powered voice and call evaluation products.',
  },
  {
    id: 2,
    title: 'Intern',
    company: 'Finova Solutions',
    period: 'February 2026 - April 2026',
    description: 'Developed a production voice AI pipeline for phone-call automation, connecting call input, LLM processing, and TTS output.',
  },
  {
    id: 3,
    title: 'Intern',
    company: 'SPS-NASTP',
    period: 'July 2025 - Sept 2025',
    description: 'Built GreenKeyper, a conversational AI app using IBM watsonx Assistant, with chatbot logic, assistant configuration, and interaction-flow design.',
  },
];
