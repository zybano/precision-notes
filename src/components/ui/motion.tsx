
import React from "react";

// Define the types for our motion components
type MotionProps = {
  children: React.ReactNode;
  initial?: any;
  animate?: any;
  exit?: any;
  transition?: any;
  className?: string;
  onClick?: () => void;
} & React.HTMLAttributes<HTMLDivElement>;

// Create a basic motion.div component
export const motion = {
  div: ({ 
    children, 
    initial, 
    animate, 
    exit, 
    transition, 
    className = "", 
    ...props 
  }: MotionProps) => {
    return (
      <div 
        className={`transition-all ${className}`}
        style={{
          opacity: animate?.opacity !== undefined ? animate.opacity : 1,
          transform: `translateY(${animate?.y || 0}px) translateX(${animate?.x || 0}px) scale(${animate?.scale || 1})`,
          transition: `all ${transition?.duration || 0.3}s ${transition?.ease || 'ease-out'}`
        }}
        {...props}
      >
        {children}
      </div>
    );
  },
  
  // More specialized motion components
  section: (props: MotionProps) => {
    const { children, ...rest } = props;
    return <motion.div {...rest}><section>{children}</section></motion.div>;
  },
  article: (props: MotionProps) => {
    const { children, ...rest } = props;
    return <motion.div {...rest}><article>{children}</article></motion.div>;
  },
  main: (props: MotionProps) => {
    const { children, ...rest } = props;
    return <motion.div {...rest}><main>{children}</main></motion.div>;
  }
};

// Utility component for fade-in effects
export const FadeIn = ({ 
  children, 
  delay = 0, 
  className = "" 
}: { 
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => {
  return (
    <div 
      className={`animate-fade-up ${className}`} 
      style={{ 
        animationDelay: `${delay}s`, 
        animationFillMode: "both" 
      }}
    >
      {children}
    </div>
  );
};

export default motion;
