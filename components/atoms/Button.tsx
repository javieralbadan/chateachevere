interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  href?: string;
  target?: string;
  variant?: 'primary' | 'inverted';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  href,
  variant = 'primary',
  className,
  ...props
}) => {
  const baseClass =
    'px-6 py-2 rounded-2xl shadow-md transition transform hover:-translate-y-1 hover:bg-opacity-90 hover:text-opacity-80 font-medium';

  const variantStyles = {
    primary: 'bg-[var(--primary-color)] text-white border-2 border-primary-color',
    inverted: 'bg-white text-[var(--primary-color)] border-2 border-white',
  };

  const style = href
    ? `inline-block text-center ${variantStyles[variant]}`
    : variantStyles[variant];

  const combinedClassName = `${baseClass} ${style} ${className ?? ''}`;

  if (href) {
    // Only pass anchor-allowed props
    const {
      onClick,
      style: styleProp,
      id,
      title,
      rel,
      ...anchorProps
    } = props as {
      onClick?: React.MouseEventHandler<HTMLAnchorElement>;
      style?: React.CSSProperties;
      id?: string;
      title?: string;
      rel?: string;
    };

    return (
      <a
        href={href}
        className={combinedClassName}
        style={styleProp}
        id={id}
        title={title}
        target="_blank"
        rel={rel}
        onClick={onClick}
        {...anchorProps}
      >
        {children}
      </a>
    );
  }

  return (
    <button className={combinedClassName} {...props}>
      {children}
    </button>
  );
};
