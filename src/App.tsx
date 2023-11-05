import { invoke } from "@tauri-apps/api/tauri";
import { onMount } from "solid-js";
import "./App.css";

function App() {
  let render: HTMLDivElement | undefined;

  onMount(() => {
    invoke("get_svg")
      .then((res) => {
        if (render && typeof res === "string") {
          const parser = new DOMParser();
          const svg = parser.parseFromString(res, "image/svg+xml");
          svg.documentElement.childNodes.forEach((node, i) => {
            node.addEventListener("mouseenter", () => {
              const id = (node as HTMLElement).id
                .split(",")
                .map((n) => parseInt(n) - 1);
              invoke("get_procesor_info", { r: id[0], c: id[1] })
                .then((res) => console.log(res))
                .catch(console.error);
            });

            node.addEventListener("mouseleave", () => {
              console.log(`Left node ${i}`);
            });
          });
          render.appendChild(svg.documentElement);
        } else
          throw new Error(
            `Canvas is undefined: ${render === undefined}. Res is string: ${
              typeof res === "string"
            }`
          );
      })
      .catch(console.log);
  });
  return (
    <div class="container">
      <div class="side-panel"></div>
      <div class="render" ref={render}></div>
    </div>
  );
}

export default App;
