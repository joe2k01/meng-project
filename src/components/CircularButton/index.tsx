import { Accessor, Component, JSX } from "solid-js";
import "./index.css";

type CircularButtonT = {
  onClick: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>;
  svg: JSX.Element;
  enabled: Accessor<boolean>;
};

const CircularButton: Component<CircularButtonT> = ({
  onClick,
  svg,
  enabled,
}) => {
  return (
    <button onClick={onClick} disabled={!enabled()} class="circular-btn">
      {svg}
    </button>
  );
};

export default CircularButton;
