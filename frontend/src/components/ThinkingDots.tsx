import React from 'react'

export const ThinkingDots: React.FC = () => (
  <div className="flex flex-col items-start space-y-xs mb-lg message-spring">
    <div className="bg-white border border-outline-variant/20 p-md rounded-2xl rounded-bl-none shadow-sm min-w-[100px]">
      <div className="thinking-dots flex gap-1.5 px-1 py-0.5">
        <span className="w-2 h-2 bg-primary/40 rounded-full"></span>
        <span className="w-2 h-2 bg-primary/40 rounded-full"></span>
        <span className="w-2 h-2 bg-primary/40 rounded-full"></span>
      </div>
    </div>
  </div>
)
