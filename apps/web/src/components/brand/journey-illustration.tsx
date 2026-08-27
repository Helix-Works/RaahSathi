import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function JourneyIllustration({
  className,
  ...props
}: ComponentProps<"svg">) {
  return (
    <svg
      {...props}
      viewBox="0 0 720 440"
      fill="none"
      className={cn("h-auto w-full", className)}
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        d="M29 306c45-53 91-80 138-80 55 0 77 43 130 43 59 0 77-90 145-90 70 0 92 87 136 87 36 0 66-38 113-38v145H29V306Z"
        className="fill-secondary"
      />
      <path
        d="M78 268c41-54 83-82 125-82 47 0 70 46 112 46 48 0 72-111 133-111 47 0 70 67 104 67 29 0 48-36 85-36 22 0 41 9 56 27v132H78v-43Z"
        className="fill-accent/75"
      />

      <g className="stroke-primary/25" strokeWidth="3" strokeLinecap="round">
        <path d="M86 179v-47M72 155h29M627 152v-40M613 132h27" />
        <path d="M115 201v-32h27v32M566 184v-41h34v41" />
      </g>
      <g className="fill-card stroke-border-strong" strokeWidth="2">
        <path d="M48 279v-69h71v69H48Z" />
        <path d="M128 279v-99h89v99h-89Z" />
        <path d="M518 279v-83h68v83h-68Z" />
        <path d="M594 279v-61h79v61h-79Z" />
      </g>
      <g className="fill-secondary">
        <path d="M63 225h14v16H63zM89 225h14v16H89zM63 251h14v16H63zM89 251h14v16H89z" />
        <path d="M145 199h16v18h-16zM174 199h16v18h-16zM145 230h16v18h-16zM174 230h16v18h-16z" />
        <path d="M533 211h14v17h-14zM558 211h14v17h-14zM533 241h14v17h-14zM558 241h14v17h-14z" />
        <path d="M611 234h14v15h-14zM638 234h14v15h-14z" />
      </g>

      <path
        d="M-15 421c137-97 278-93 404-41 121 50 225 30 350-64"
        className="stroke-surface-strong"
        strokeWidth="92"
        strokeLinecap="round"
      />
      <path
        d="M-15 421c137-97 278-93 404-41 121 50 225 30 350-64"
        className="stroke-primary-foreground/75"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="22 22"
      />

      <g transform="translate(340 302)">
        <path
          d="M20 50h116c9 0 16 7 16 16v29H5V67c0-10 6-17 15-17Z"
          className="fill-primary stroke-primary-hover"
          strokeWidth="3"
        />
        <path
          d="m36 50 17-31h54l24 31H36Z"
          className="fill-card stroke-primary-hover"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="m58 24-13 26h35V24H58ZM86 24v26h35l-19-26H86Z" className="fill-accent" />
        <circle cx="38" cy="95" r="13" className="fill-surface-strong stroke-card" strokeWidth="5" />
        <circle cx="122" cy="95" r="13" className="fill-surface-strong stroke-card" strokeWidth="5" />
        <path d="M15 67h17M125 67h17" className="stroke-primary-foreground" strokeWidth="5" strokeLinecap="round" />
      </g>

      <g className="fill-primary">
        <circle cx="276" cy="139" r="7" />
        <circle cx="655" cy="91" r="6" />
      </g>
      <g className="stroke-primary" strokeWidth="3" strokeLinecap="round">
        <path d="M276 121v-13M276 170v-13M258 139h-13M307 139h-13" />
        <path d="M655 75V64M655 118v-11M639 91h-11M682 91h-11" />
      </g>
    </svg>
  );
}
