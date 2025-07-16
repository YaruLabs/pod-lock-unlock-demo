'use client';

export default function CotiLogo({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="128" cy="128" r="128" fill="#0A2540"/>
      <path d="M61 128c0-37.6 30.4-68 68-68s68 30.4 68 68-30.4 68-68 68-68-30.4-68-68z" fill="#1CB9FC"/>
      <path d="M61 128c0-37.6 30.4-68 68-68v136c-37.6 0-68-30.4-68-68z" fill="#3ED6F7"/>
      <path d="M128 60c37.6 0 68 30.4 68 68s-30.4 68-68 68V60z" fill="#1A7AC7"/>
      <path d="M128 60c-37.6 0-68 30.4-68 68s30.4 68 68 68V60z" fill="#1CB9FC"/>
    </svg>
  );
} 