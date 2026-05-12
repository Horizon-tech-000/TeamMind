import * as React from "react";

type FieldProps = {
  label: string;
  type?: string;
  id: string;
  placeholder?: string;
  autoComplete?: string;
};

export function Field({ label, type = "text", id, placeholder, autoComplete }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="block w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
    </div>
  );
}

export function PrimaryButton({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className="inline-flex w-full items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-[var(--shadow-card)] transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent/40"
    >
      {children}
    </button>
  );
}
