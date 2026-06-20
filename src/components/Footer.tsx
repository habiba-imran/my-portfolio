export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="section-padding py-8 border-t border-border">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted">
        <p>© {currentYear} Alex Chen. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <a href="https://github.com/alexchen" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors duration-200">
            GitHub
          </a>
          <a href="https://linkedin.com/in/alexchen" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors duration-200">
            LinkedIn
          </a>
          <a href="mailto:alex.chen@stanford.edu" className="hover:text-accent transition-colors duration-200">
            Email
          </a>
        </div>
      </div>
    </footer>
  );
}
