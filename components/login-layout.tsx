"use client";

import { ReactNode, Suspense } from 'react';
import NemoCloudAnimation from './nemo-cloud-animation';

interface LoginLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

function NemoCloudFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center text-white/80">
        <div className="relative">
          <h2 className="text-6xl font-bold mb-4 text-white/90">NEMO</h2>
          <div className="absolute inset-0 text-6xl font-bold mb-4 text-white/20 blur-sm">NEMO</div>
        </div>
        <p className="text-xl opacity-75">AI Chat as Org's projects Manager </p>
        
        {/* Animated cloud elements */}
        <div className="absolute top-1/4 left-1/4 w-16 h-8 bg-white/20 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-20 h-10 bg-white/15 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-12 h-6 bg-white/25 rounded-full animate-pulse delay-2000"></div>
        <div className="absolute bottom-1/4 right-1/3 w-18 h-9 bg-white/20 rounded-full animate-pulse delay-500"></div>
      </div>
    </div>
  );
}

export default function LoginLayout({ children, title, subtitle }: LoginLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-30">
        <svg className="absolute -left-10 top-0 h-[120%] w-[120%] text-primary/10" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="g" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="currentColor" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle cx="200" cy="150" r="200" fill="url(#g)" />
          <circle cx="650" cy="450" r="250" fill="url(#g)" />
        </svg>
      </div>

      <div className="flex min-h-screen">
        {/* Left side - Login Form */}
        <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold shadow-lg">
                N
              </div>
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="text-muted-foreground mt-2">{subtitle}</p>
            </div>

            <div className="rounded-2xl border bg-card/60 p-8 shadow-lg backdrop-blur">
              {children}
            </div>
          </div>
        </div>

        {/* Right side - Nemo Cloud Animation (hidden on mobile) */}
        <div className="hidden lg:block relative w-1/2 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/20">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-primary/10" />
          <div className="relative h-full w-full">
            <Suspense fallback={<NemoCloudFallback />}> 
              <NemoCloudAnimation />
            </Suspense>
          </div>
          
          {/* Overlay text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-white/80">
              <h2 className="text-4xl font-bold mb-4">Nemo</h2>
              <p className="text-lg opacity-75">Just Propmt any project you want </p>
              <p className="text-lg opacity-75">Nemo will create ,manage,guide you to the organization goals</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
