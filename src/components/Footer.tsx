export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="section-padding py-10 md:py-12">
      <div className="flex flex-col items-center gap-4 text-sm text-muted text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted/60">
          Designed & Built with ❤️
        </p>
        <p className="text-muted/40">© {currentYear} Habiba Imran</p>
      </div>
    </footer>
  );
}
