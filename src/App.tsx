import { ReactFlowProvider } from "@xyflow/react";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Applayout } from "./components/layouts/AppLayout";
import Machine from "./pages/machine/machine";
import { TourProvider } from "./pages/machine/Tour";

export default function App() {
  return (
    <ThemeProvider>
      <TourProvider>
        <Applayout>
          <ReactFlowProvider>
            <Machine />
          </ReactFlowProvider>
        </Applayout>
      </TourProvider>
    </ThemeProvider>
  );
}
