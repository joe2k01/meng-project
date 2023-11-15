import { invoke } from "@tauri-apps/api/tauri";
import { createSignal, onMount } from "solid-js";
import "./App.css";
import "@fontsource/roboto-mono";
import ProcessorsGraph from "./ProcessorsGraph";

export type TransformDataT = {
  x: number;
  y: number;
  k: number;
  width: number;
  height: number;
};

function App() {
  const [svg, setSvg] = createSignal<SVGSVGElement | undefined>(undefined);
  const [transform, setTransform] = createSignal<TransformDataT>({
    x: 0,
    y: 0,
    k: 1,
    width: 0,
    height: 0,
  });

  function renderSVG() {
    invoke("render_svg", transform());
  }

  onMount(() => {
    invoke("get_svg")
      .then((res) => {
        if (typeof res === "string") {
          const parser = new DOMParser();

          const svg = parser.parseFromString(res, "image/svg+xml")
            .documentElement as unknown;

          setSvg(svg as SVGSVGElement | undefined);
        } else throw new Error(`Res is string: ${typeof res === "string"}`);
      })
      .catch(console.error);
  });
  return (
    <div class="flex h-full">
      {/* <div class="h-full bg-pink-500"></div> */}
      <ProcessorsGraph svg={svg} setTransform={setTransform} />
      <button class="fixed top-10 right-10" onClick={renderSVG}>
        Export
      </button>
    </div>
  );
}

export default App;
