import { ReactNode } from "react";
import { Header } from "./Header";

export function Applayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <main className="relative flex-1 min-h-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
