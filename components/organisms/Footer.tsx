import Link from 'next/link';

export const Footer = () => {
  return (
    <footer className="bg-gray-100 p-4">
      <div className="container mx-auto flex justify-center align-middle gap-4 text-gray-600">
        <Link href="/legal">Legal</Link>
        <span>|</span>
        <span>
          Diseñado por{' '}
          <a
            href="https://www.linkedin.com/in/javier-albadan/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-color hover:underline font-medium"
          >
            @javier.albadan
          </a>
        </span>
      </div>
    </footer>
  );
};
