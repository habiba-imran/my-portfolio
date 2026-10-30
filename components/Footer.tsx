import { ArrowUp } from "lucide-react";
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-wordmark" aria-hidden="true">
          habiba<span>✳</span>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Habiba Imran</p>
          <span>Designed with intention. Built with curiosity.</span>
          <a href="#home">
            Back to top <ArrowUp size={15} aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
