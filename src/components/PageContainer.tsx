import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  }

  export function PageContainer({ children }: Props) {
    return (
        <div className="min-h-screen w-full bg-background">
              <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                      {children}
                            </div>