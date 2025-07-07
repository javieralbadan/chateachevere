import useFetchData from '@/hooks/useFetchData';
import Image from 'next/image';

const Logo = () => {
  const { data: brandInfo } = useFetchData('negocio');

  return <Image src={brandInfo.logo} alt={`${brandInfo.title} logo`} width={200} height={200} />;
};

export default Logo;
