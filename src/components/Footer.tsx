export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="section-padding py-10 md:py-12">
      <div className="flex flex-col items-center gap-4 text-sm text-muted text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted/60">
          Designed & Built with ❤️
        </p>
        <div className="flex items-center gap-6">
          <a href="https://github.com/habiba-imran" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors duration-200">
            GitHub
          </a>
          <span className="text-border">·</span>
          <a href="https://linkedin.com/in/habiba-imran" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors duration-200">
            LinkedIn
          </a>
          <span className="text-border">·</span>
          <a href="mailto:habiba.imran@example.com" className="hover:text-accent transition-colors duration-200">
            Email
          </a>
        </div>
        <p className="text-muted/40">© {currentYear} Habiba Imran</p>
      </div>
    </footer>
  );
}
