import { useEffect, useState, type ReactNode } from "react";
import "./landscape-stage.css";
const ROTATED = "(any-pointer: coarse) and (orientation: portrait)";
/** A landscape canvas from selection onwards, without device rotation prompts. */
export default function LandscapeStage({ children }: { children: ReactNode }) {
  const [rotated, setRotated] = useState(() => matchMedia(ROTATED).matches);
  useEffect(() => {
    const query = matchMedia(ROTATED),
      update = () => setRotated(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return (
    <div className="landscape-shell">
      <div className="landscape-stage" data-rotated={rotated}>
        {children}
      </div>
    </div>
  );
}
export function landscapeDelta(element: Element, dx: number, dy: number) {
  return element.closest('[data-rotated="true"]')
    ? { dx: dy, dy: -dx }
    : { dx, dy };
}
