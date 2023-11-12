import { invoke } from "@tauri-apps/api";
import { select, zoom } from "d3";
import { Accessor, createEffect, onCleanup } from "solid-js";

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
  let container: HTMLDivElement | undefined;

  createEffect(() => {
    const svgElement = svg();
    if (container && svgElement) {
      // Add to DOM
      container.appendChild(svgElement);

      const svgGraph = select<SVGSVGElement, unknown>("svg");
      const graphGroup = select<SVGGElement, unknown>("#graph");
      svgGraph.call(
        zoom<SVGSVGElement, unknown>().on(
          "zoom",
          (ev: d3.D3ZoomEvent<SVGGElement, any>) => {
            graphGroup.attr("transform", ev.transform.toString());
          }
        )
      );

      const graphGroupElement = graphGroup.node();
      if (graphGroupElement) {
        // Attach hover listener to each processor
        graphGroupElement.childNodes.forEach((node) => {
          node.addEventListener("mouseenter", engageHover);
          // Left hover listener
          node.addEventListener("mouseleave", releaseHover);
        });
      }
    }
    onCleanup(() => {
      if (svgElement && container) {
        container.childNodes.forEach((c) => {
          c.removeEventListener("mouseenter", engageHover);
          c.removeEventListener("mouseleave", releaseHover);
          container?.removeChild(c);
        });
      }
    });
  });

  return (
    <div
      class="h-full w-full overflow-hidden block"
      id="graphContainer"
      ref={container}
    ></div>
  );
}
