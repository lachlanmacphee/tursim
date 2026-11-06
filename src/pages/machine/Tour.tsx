import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const WELCOME_STORAGE_KEY = "tursim:welcome-seen";

type Placement = "right" | "left" | "below" | "center";

type Step = {
  title: string;
  body: string;
  // CSS selector for the element to highlight
  target: string;
  placement: Placement;
};

const STEPS: Step[] = [
  {
    title: "Restarting the tour",
    body: "You can run this tour again at any time from here in the header.",
    target: '[data-tour="tour-menu"]',
    placement: "below",
  },
  {
    title: "The canvas",
    body: "Hold down on blank space to add a node. Drag a node by its number to move it, drag from its outer ring to another node to connect them, and hover a node to delete it. The green node is the start and the red node is the end; both are permanent.",
    target: '[data-tour="canvas"]',
    placement: "center",
  },
  {
    title: "Transitions",
    body: "Each edge passes through a transition box. The three parts are the symbol to read, the symbol to write and the direction to move (click it to switch). Hover the box to add another rule with + or remove one with the red crosses.",
    target: '[data-tour="transition"]',
    placement: "below",
  },
  {
    title: "The tape",
    body: "The tape runs down the right-hand side. Click a cell and type to change its symbol. The marker on the left shows where the head is, and _ is a blank.",
    target: '[data-tour="tape"]',
    placement: "left",
  },
  {
    title: "Running a machine",
    body: "Use the RUN controls on the left to play or pause, reset, or step through it (and back). A transition takes three steps: move onto the edge, take its action, then arrive at the next node. Only the current node or edge is highlighted, and the settings button allows you to adjust the speed.",
    target: '[data-tour="playTape"]',
    placement: "right",
  },
  {
    title: "Saving and undoing",
    body: "Save and load tapes and machines from the TAPE and MACHINE sections. Cmd/Ctrl+Z undoes a change to the canvas and Shift+Cmd/Ctrl+Z redoes it.",
    target: '[data-tour="saveMachine"]',
    placement: "right",
  },
];

type Rect = { x: number; y: number; width: number; height: number };

const HIGHLIGHT_PADDING = 6;
const CARD_GAP = 16;
const VIEWPORT_MARGIN = 16;

const sameRect = (a: Rect | null, b: Rect | null) =>
  a == b ||
  (!!a &&
    !!b &&
    a.x == b.x &&
    a.y == b.y &&
    a.width == b.width &&
    a.height == b.height);

function Spotlight({
  step,
  index,
  onBack,
  onNext,
  onClose,
}: {
  step: Step;
  index: number;
  onBack: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardSize, setCardSize] = useState({ width: 340, height: 220 });
  const cardRef = useRef<HTMLDivElement>(null);
  const isLast = index == STEPS.length - 1;

  // Keep following the target, since nodes and toolbars can move or animate
  useEffect(() => {
    let frame: number;
    const tick = () => {
      // Some targets exist twice (e.g. desktop and mobile header); use the visible one
      const bounds = [...document.querySelectorAll(step.target)]
        .find((el) => el.getClientRects().length > 0)
        ?.getBoundingClientRect();
      const next = bounds
        ? {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
          }
        : null;
      setRect((prev) => (sameRect(prev, next) ? prev : next));

      const card = cardRef.current;
      if (card) {
        setCardSize((prev) =>
          prev.width == card.offsetWidth && prev.height == card.offsetHeight
            ? prev
            : { width: card.offsetWidth, height: card.offsetHeight },
        );
      }
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [step.target]);

  const { width: cardWidth, height: cardHeight } = cardSize;
  let left = (window.innerWidth - cardWidth) / 2;
  let top = (window.innerHeight - cardHeight) / 2;
  if (rect && step.placement != "center") {
    if (step.placement == "right") {
      left = rect.x + rect.width + CARD_GAP + HIGHLIGHT_PADDING;
      top = rect.y + rect.height / 2 - cardHeight / 2;
    } else if (step.placement == "left") {
      left = rect.x - cardWidth - CARD_GAP - HIGHLIGHT_PADDING;
      top = rect.y + rect.height / 2 - cardHeight / 2;
    } else {
      left = rect.x + rect.width / 2 - cardWidth / 2;
      top = rect.y + rect.height + CARD_GAP + HIGHLIGHT_PADDING;
    }
  }
  left = Math.max(
    VIEWPORT_MARGIN,
    Math.min(left, window.innerWidth - cardWidth - VIEWPORT_MARGIN),
  );
  top = Math.max(
    VIEWPORT_MARGIN,
    Math.min(top, window.innerHeight - cardHeight - VIEWPORT_MARGIN),
  );

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Blocks clicks on the app; the tour can only be left with Exit tour */}
      <div className="absolute inset-0" />
      {rect ? (
        <div
          className="pointer-events-none absolute rounded-lg border-2 border-primary transition-all duration-200"
          style={{
            left: rect.x - HIGHLIGHT_PADDING,
            top: rect.y - HIGHLIGHT_PADDING,
            width: rect.width + HIGHLIGHT_PADDING * 2,
            height: rect.height + HIGHLIGHT_PADDING * 2,
            boxShadow: "0 0 0 9999px hsl(0 0% 0% / 0.6)",
          }}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-black/60" />
      )}
      <div
        ref={cardRef}
        className="absolute w-[340px] rounded-lg border bg-background p-4 shadow-lg transition-all duration-200"
        style={{ left, top }}
      >
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold leading-none tracking-tight">
            {step.title}
          </h2>
          <span className="text-sm text-muted-foreground">
            {index + 1} of {STEPS.length}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
        <div className="mt-4 flex items-center justify-between">
          <Button variant="ghost" onClick={onClose}>
            Exit tour
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" disabled={index == 0} onClick={onBack}>
              Back
            </Button>
            <Button onClick={isLast ? onClose : onNext}>
              {isLast ? "Done" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const TourContext = createContext<{ startTour: () => void }>({
  startTour: () => {},
});

export const useTour = () => useContext(TourContext);

export function TourProvider({ children }: { children: ReactNode }) {
  // "closed" until we've checked whether this is the first visit
  const [mode, setMode] = useState<"closed" | "ask" | "tour">("closed");
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (localStorage.getItem(WELCOME_STORAGE_KEY)) return;
      localStorage.setItem(WELCOME_STORAGE_KEY, "true");
    } catch {
      return;
    }
    setMode("ask");
  }, []);

  const close = () => {
    setMode("closed");
    setStep(0);
  };

  const startTour = () => {
    setStep(0);
    setMode("tour");
  };

  return (
    <TourContext.Provider value={{ startTour }}>
      {children}
      <Dialog open={mode == "ask"} onOpenChange={(open) => !open && close()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Welcome to tursim</DialogTitle>
            <DialogDescription>
              Would you like a quick tour of how it works?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={close}>
              No thanks
            </Button>
            <Button onClick={startTour}>Take the tour</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {mode == "tour" && (
        <Spotlight
          step={STEPS[step]}
          index={step}
          onBack={() => setStep(step - 1)}
          onNext={() => setStep(step + 1)}
          onClose={close}
        />
      )}
    </TourContext.Provider>
  );
}
