/* eslint-disable @next/next/no-img-element */
export function Logo({ variant = "white", className = "h-7 w-auto" }: { variant?: "white" | "color" | "black"; className?: string }) {
  const src = variant === "white" ? "/brand/zedtix-logo-white.svg" : variant === "black" ? "/brand/zedtix-logo-black.svg" : "/brand/zedtix-logo.svg";
  return <img src={src} alt="ZedTix" className={className} width={140} height={28} />;
}
