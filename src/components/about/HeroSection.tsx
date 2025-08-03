import React from "react";

export function HeroSection({ title, subtitle, bgColorClass = "from-medical-50 to-medical-100" }: {
  title: string;
  subtitle?: string;
  bgColorClass?: string;
}) {
  return (
    <div className={`relative bg-gradient-to-r ${bgColorClass} h-[20vh] md:h-[30vh]`}>
      <div className="absolute inset-0 bg-black/5 backdrop-blur-[2px]"></div>
      <div className="container mx-auto px-6 h-full flex flex-col justify-center items-center relative z-10">
        <h1 className="text-3xl md:text-5xl font-bold text-center">{title}</h1>
        {subtitle && (
          <p className="mt-4 text-lg md:text-xl text-center max-w-2xl text-muted-foreground font-light italic">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
