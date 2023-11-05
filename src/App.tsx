import { invoke } from "@tauri-apps/api/tauri";
import { createSignal, onMount } from "solid-js";
import "./App.css";
import ProcessorsGraph from "./ProcessorsGraph";

function App() {
  const [svg, setSvg] = createSignal<HTMLElement | undefined>(undefined);

  onMount(() => {
    invoke("get_svg")
      .then((res) => {
        if (typeof res === "string") {
          const parser = new DOMParser();
          const svg = parser.parseFromString(
            res,
            "image/svg+xml"
          ).documentElement;

          setSvg(svg);
        } else throw new Error(`Res is string: ${typeof res === "string"}`);
      })
      .catch(console.log);
  });
  return (
    <div class="grid grid-cols-[20%_80%] h-full">
      <div class="h-full bg-pink-500"></div>
      <ProcessorsGraph svg={svg} />
    </div>
  );
}

export default App;
