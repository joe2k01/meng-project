import { invoke } from "@tauri-apps/api";
import { Accessor, createEffect, createSignal, onCleanup } from "solid-js";

type ProcessorsGraphT = {
  svg: Accessor<HTMLElement | undefined>;
};

function engageHover(ev: Event) {
  const id = (ev.target as HTMLElement).id
    .split(",")
    .map((n) => parseInt(n) - 1);
  invoke("get_procesor_info", { r: id[0], c: id[1] })
    .then((res) => console.log(res))
    .catch(console.error);
}

function releaseHover(ev: Event) {
  const id = (ev.target as HTMLElement).id
    .split(",")
    .map((n) => parseInt(n) - 1);
  console.log(`Left processor ${id[0] + 1},${id[1] + 1}`);
}

export default function ProcessorsGraph({ svg }: ProcessorsGraphT) {
  const [center, setCenter] = createSignal<{ x: number; y: number }>();
  const [matrix, setMatrix] = createSignal<number[]>([1, 0, 0, 1, 0, 0]);
  let container: HTMLDivElement | undefined;
  let svgRef: HTMLElement | undefined;

  function handleWheel(ev: WheelEvent) {
    const scale = ev.deltaY < 0 ? 0.25 : -0.25;
    console.log(scale);

    if (svgRef) {
      svgRef.style.scale = `${Math.max(
        parseFloat(svgRef.style.scale) + scale,
        0.5
      )}`;
    }
  }

  createEffect(() => {
    const svgElement = svg();
    if (container && svgElement) {
      // Calculate view box center
      const viewbox = svgElement.getAttribute("viewBox")?.split(" ");
      if (viewbox) {
        setCenter({
          x: parseInt(viewbox[2]) / 2,
          y: parseInt(viewbox[3]) / 2,
        });
      }
      // Attach hover listener to each processor
      svgElement.childNodes.forEach((node) => {
        node.addEventListener("mouseenter", engageHover);
        // Left hover listener
        node.addEventListener("mouseleave", releaseHover);
      });

      // Add wheel listener for zooming
      svgElement.addEventListener("wheel", handleWheel);

      // Style SVG so that it stretches through whole available space
      svgElement.classList.add("w-full", "max-h-full");
      svgElement.style.scale = "1";
      svgRef = container.appendChild(svgElement);
    }

    onCleanup(() => {
      if (svgElement && container) {
        svgElement.removeEventListener("wheel", handleWheel);
        container.childNodes.forEach((c) => {
          c.removeEventListener("mouseenter", engageHover);
          c.removeEventListener("mouseleave", releaseHover);
          container?.removeChild(c);
        });
      }
      svgRef = undefined;
    });
  });

  return <div class="h-full w-full overflow-hidden block" ref={container} />;
}
