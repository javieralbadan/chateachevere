'use client';
import Loading from '@/components/atoms/Loading';
import Image from 'next/image';
import { Suspense } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container legal-container mx-auto py-10">
      <Image src="/imgs/full-logo.png" alt="logo" width={200} height={50} />
      <Suspense fallback={<Loading />}>{children}</Suspense>
    </div>
  );
}
