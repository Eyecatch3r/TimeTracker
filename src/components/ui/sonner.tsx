import { Toaster as Sonner } from "sonner"
import type { ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      style={
        {
          "--normal-bg": "hsl(280 20% 20%)",
          "--normal-text": "hsl(0 0% 98%)",
          "--normal-border": "hsl(280 10% 35%)",
          "--success-bg": "hsl(142 76% 15%)",
          "--success-text": "hsl(142 70% 60%)",
          "--error-bg": "hsl(0 70% 15%)",
          "--error-text": "hsl(0 90% 70%)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
