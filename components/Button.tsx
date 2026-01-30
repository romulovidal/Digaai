import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'md' | 'lg';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "rounded-xl font-bold transition-all active:scale-95 focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-diga-primary text-white focus:ring-diga-primary/50 shadow-lg hover:bg-blue-800",
    secondary: "bg-diga-accent text-diga-text border-2 border-diga-text/10 focus:ring-diga-accent/50 hover:bg-yellow-400",
    danger: "bg-diga-error text-white focus:ring-diga-error/50 hover:bg-red-700",
    ghost: "bg-transparent text-diga-text hover:bg-black/5"
  };

  const sizes = {
    md: "h-12 px-6 text-lg",
    lg: "h-16 px-8 text-xl" // 64px height for easy touch
  };

  const width = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${width} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
