import React from 'react';

export interface AppleSpinnerProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  color?: string;
}

export const AppleSpinner: React.FC<AppleSpinnerProps> = ({
  size = 16,
  className = '',
  style = {},
  color = 'currentColor',
}) => {
  const spokes = 8;
  const spokeList = Array.from({ length: spokes });

  return (
    <span
      className={`apple-spinner-wrapper ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`,
        flexShrink: 0,
        verticalAlign: 'middle',
        lineHeight: 1,
        ...style,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className="apple-spinner-svg"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          display: 'block',
          overflow: 'visible',
        }}
      >
        {spokeList.map((_, i) => {
          const angle = (360 / spokes) * i;
          const opacity = (i + 1) / spokes;
          return (
            <line
              key={i}
              x1="12"
              y1="3"
              x2="12"
              y2="7.5"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              transform={`rotate(${angle} 12 12)`}
              style={{
                opacity: Math.max(0.18, opacity),
              }}
            />
          );
        })}
      </svg>
    </span>
  );
};
