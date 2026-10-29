import RoadLoading from "./RoadLoading";
import { useEffect, useState, type ComponentType } from "react";

type Props = { onExit: () => void };
/** Keep navigation available when a deployment chunk is missing or a download stalls. */
export default function GameLoader({ onExit }: Props) {
  const [Game, setGame] = useState<ComponentType<Props> | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (active) setFailed(true);
    }, 30000);
    import("./game/Game").then(
      ({ default: component }) => {
        if (active) {
          setGame(() => component);
          setFailed(false);
        }
        window.clearTimeout(timer);
      },
      () => {
        if (active) setFailed(true);
        window.clearTimeout(timer);
      },
    );
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);
  if (Game) return <Game onExit={onExit} />;
  return (
    <div className="game-loading">
      {failed ? "Rasta load nahi hua, bhidu." : <RoadLoading />}
      {failed && (
        <small>
          Connection ruk gaya ya naya update aaya hai. Reload karke phir chalo.
        </small>
      )}
      {failed && (
        <button onClick={() => window.location.reload()}>Reload game</button>
      )}
    </div>
  );
}
