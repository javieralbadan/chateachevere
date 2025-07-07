interface IconButtonProps {
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

export const IconButton: React.FC<IconButtonProps> = ({ icon, href, onClick }) =>
  href ? (
    <a
      href={href}
      aria-label="icon-button"
      className="inline-block p-2 rounded-full hover:bg-[var(--primary-color)] hover:text-white transition"
    >
      {icon}
    </a>
  ) : (
    <button
      onClick={onClick}
      className="p-2 rounded-full hover:bg-[var(--primary-color)] hover:text-white transition"
    >
      {icon}
    </button>
  );
