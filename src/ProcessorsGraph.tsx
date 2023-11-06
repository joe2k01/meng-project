import { invoke } from "@tauri-apps/api";
import { Accessor, createEffect, createSignal, onCleanup } from "solid-js";

type ProcessorsGraphT = {
  svg: Accessor<SVGSVGElement | undefined>;
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
  const [matrix, setMatrix] = createSignal<DOMMatrix>();
  const [point, setPoint] = createSignal<DOMPoint>(new DOMPoint(0, 0));
  const [scale, setScale] = createSignal<number>(1);
  const [coordinates, setCoordinates] = createSignal<{
    x: number;
    y: number;
  }>();

  let container: HTMLDivElement | undefined;
  let svgRef: SVGSVGElement | undefined;

  function handleWheel(ev: WheelEvent) {
    const delta = ev.deltaY < 0;

    const coor = coordinates();
    if (!svgRef || !coor) return undefined;
    const x = coor.x - svgRef.clientWidth / 2;
    const y = coor.y - svgRef.clientHeight / 2;
    const scaleFactor = delta ? 1.1 : 0.9;

    const s = setScale((s) => (s *= scaleFactor));
    const p = setPoint((p) => {
      p.x = x - (x - p.x) * scaleFactor;
      p.y = y - (y - p.y) * scaleFactor;

      return p;
    });

    if (svgRef && p && s) {
      svgRef.style.transform = `matrix(${s}, 0, 0, ${s}, ${p.x}, ${p.y})`;
    }

    ev.preventDefault();
  }

  function handleMouseMove(ev: MouseEvent) {
    setCoordinates({
      x: ev.offsetX,
      y: ev.offsetY,
    });
    ev.preventDefault();
  }

  createEffect(() => {
    const svgElement = svg();
    if (container && svgElement) {
      // Attach hover listener to each processor
      svgElement.childNodes.forEach((node) => {
        node.addEventListener("mouseenter", engageHover);
        // Left hover listener
        node.addEventListener("mouseleave", releaseHover);
      });

      // Add wheel listener for zooming
      svgElement.addEventListener("wheel", handleWheel);
      // Add move listener for coordinates
      svgElement.addEventListener("mousemove", handleMouseMove);

      // Add to DOM
      svgRef = container.appendChild(svgElement);

      svgRef.classList.add("origin-center");

      // Create SVG matrix to handle transforms
      setMatrix(svgRef.createSVGMatrix());
      // Create SVG Point to handle transforms
      setPoint(svgRef.createSVGPoint());
    }

    onCleanup(() => {
      if (svgElement && container) {
        svgElement.removeEventListener("wheel", handleWheel);
        container.removeEventListener("mousemove", handleMouseMove);
        container.childNodes.forEach((c) => {
          c.removeEventListener("mouseenter", engageHover);
          c.removeEventListener("mouseleave", releaseHover);
          container?.removeChild(c);
        });
      }
      setMatrix(undefined);
      svgRef = undefined;
    });
  });

  return <div class="h-full w-full overflow-hidden block" ref={container} />;
}
