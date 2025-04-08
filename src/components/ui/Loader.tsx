import React from "react";

interface LoaderProps {
  size?: number; // in pixels
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({ size = 48, className = "" }) => {
  const squareSize = size / 4;

  return (
    <div className={className} style={{ position: "relative", width: size, height: size }}>
      {[...Array(4)].map((_, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            width: squareSize,
            height: squareSize,
            background: "linear-gradient(45deg, #b44bcb, #ff4081)",
            animation: `spin 1s linear infinite`,
            transform: `rotate(${index * 90}deg) translate(${size / 2 - squareSize / 2}px)`,
            transformOrigin: "0 0",
          }}
        />
      ))}
      <style>
        {`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Loader;