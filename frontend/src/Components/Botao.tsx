import React from "react";

interface BotaoProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary";
  className?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function Botao({
  children,
  onClick,
  type = "button",
  variant = "primary",
  className = "",
  icon,
  disabled = false,
}: BotaoProps) {

  const baseStyle = "w-full h-[45px] rounded-xl font-semibold transition flex items-center justify-center gap-3";

  const variants = {
    primary: "bg-yellow-500 text-black hover:bg-yellow-300",
    secondary: "bg-black text-white border border-[#6B6B6B] hover:bg-neutral-900"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${
        disabled ? "cursor-not-allowed opacity-60" : ""
      } ${className}`}
    >
      {icon && <span className="w-5 h-5">{icon}</span>}
      {children}
    </button>
  );
}
