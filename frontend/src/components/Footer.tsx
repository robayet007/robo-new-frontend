const Footer = () => {
  return (
    <footer className="py-4 mt-8 text-center border-t sm:mt-12 md:mt-16 sm:py-6 border-slate-200">
      <p className="text-xs sm:text-sm text-slate-600">
        All Rights Reserved | Developed By{' '}
        <a
          href="https://www.facebook.com/robayet02"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold transition-colors hover:underline"
          style={{ color: 'var(--theme-primary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--theme-primary-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--theme-primary)';
          }}
        >
          Robayet
        </a>
      </p>
    </footer>
  );
};

export default Footer;

