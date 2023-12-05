import { invoke } from "@tauri-apps/api/tauri";
import { createSignal, onMount } from "solid-js";
import "./App.css";
import "@fontsource/roboto-mono";
import ProcessorsGraph from "./ProcessorsGraph";
import CircularButton from "./components/CircularButton";

export type TransformDataT = {
  x: number;
  y: number;
  k: number;
  width: number;
  height: number;
};

function App() {
  const [svg, setSvg] = createSignal<SVGSVGElement | undefined>(undefined);
  const [btnEnable, setBtnEnable] = createSignal<boolean>(false);
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
      <div class="fixed left-7 bottom-7">
        <CircularButton svg={<></>} enabled={btnEnable} onClick={(ev) => {}}/>
      </div>
      <button class="" onClick={renderSVG}>
        Export
      </button>
    </div>
  );
}

export default App;
