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
  const [center, setCenter] = createSignal<{ x: number; y: number }>();
  const [matrix, setMatrix] = createSignal<DOMMatrix>();
  const [point, setPoint] = createSignal<DOMPoint>();
  const [coordinates, setCoordinates] = createSignal<{
    x: number;
    y: number;
  }>();

  let container: HTMLDivElement | undefined;
  let svgRef: SVGSVGElement | undefined;

  function handleWheel(ev: WheelEvent) {
    const delta = ev.deltaY < 0;
    let p = setPoint((p) => {
      if (!p) return undefined;
      const c = coordinates();
      if (!c) return undefined;
      p.x = c.x;
      p.y = c.y;

      return p;
    });

    const m = setMatrix((m) => {
      if (!m || !p || !container) return undefined;
      const scaleFactor = delta ? 1.1 : 0.9;

      const wx = p.x / container.clientWidth;
      const wy = p.y / container.clientHeight;


      // console.log(m);
      // m = m.translate(p.x, p.y);
      console.log(m);
      
      m = m.scale(scaleFactor, scaleFactor);
      console.log(m);
      m = m.translate(p.x, -p.y);
      // console.log(m);
      return m;
    });

    if (svgRef && m) {
      svgRef.style.transform = `matrix(${m.a}, ${m.b}, ${m.c}, ${m.d}, ${m.e}, ${m.f})`;
    }
  }

  function handleMouseMove(ev: MouseEvent) {
    setCoordinates({
      x: ev.offsetX,
      y: ev.offsetY,
    });
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
      // Add move listener for coordinates
      container.addEventListener("mousemove", handleMouseMove);

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
