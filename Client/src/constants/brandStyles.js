const DEFAULT_BRAND_STYLE = {
  background: "#e5e7eb",
  color: "#111827"
};

export const BRAND_STYLE_MAP = {
  A200M: { background: "linear-gradient(to right, #02bca2 0%, #039984 100%)", color: "#FFF" },
  B200M: { background: "linear-gradient(to right, #4582b4 0%, #305d82 100%)", color: "#FFF" },
  C200M: { background: "#67c700", color: "#000" },
  D200M: { background: "#00ff83", color: "#000" },
  E200M: { background: "linear-gradient(to bottom, #0053cb 0%, #fc7e03 100%)", color: "#FFF" },
  F200M: { background: "#fede9d", color: "#000" },
  G200M: { background: "#f60002", color: "#FFF" },
  K200M: { background: "#00e0ba", color: "#000" },
  P200M: { background: "#01ddff", color: "#000" },
  J200M: { background: "linear-gradient(rgb(129, 219, 1), rgb(52, 136, 3))", color: "#FFF" },
  Y200M: { background: "radial-gradient(farthest-corner at 20% 0, #7500b8 0%, #260040 50%)", color: "#FFF" },
  PASTI200M: { background: "linear-gradient(to bottom, #fa06ba 0%, #b40586 100%)", color: "#FFF" },
  SGCWIN: { background: "linear-gradient(to bottom, #02bca2 0%, #039984 100%)", color: "#FFF" },
  SGCWIN77: { background: "linear-gradient(270deg, #2b8cbb, #499dc6 50.31%, #2b8cbb 100.35%)", color: "#FFF" },
  SGCWIN88: { background: "linear-gradient(1turn, #7f6426, #fbf59f 50.13%, #8a7132)", color: "#000" },
  SGCPLAY: { background: "linear-gradient(1turn, #b7870c, #f4e303 43.57%, #97640e)", color: "#000" },
  SGCVIP: { background: "linear-gradient(270deg, #008262, #44af8b 50.31%, #008262 100.35%)", color: "#FFF" },
  ASIA100: { background: "linear-gradient(180deg, #fd5858 0%, #ff7f7d 100%)", color: "#FFF" },
  ASIA200: { background: "linear-gradient(180deg, #ffc325 0%, #ffc95c 100%)", color: "#000" },
  ASIA300: { background: "linear-gradient(120deg, #ffb100, #fe3bff, #bc5fe5)", color: "#FFF" },
  TIKET100: { background: "#d6b851", color: "#000" },
  TIKET200: { background: "#63fe4c", color: "#000" },
  TIKET300: { background: "linear-gradient(180deg, #579dff 0%, #85b8ff 100%)", color: "#FFF" },
  SUPER89: { background: "linear-gradient(to right, #ffd700, #ff0000)", color: "#FFF" },
  RAJA100: { background: "#2dbdfa", color: "#000" },
  TOP111: { background: "#fede9d", color: "#000" },
  PADUKA500: { background: "linear-gradient(to right, #02bca2 0%, #039984 100%)", color: "#FFF" },
  AUTOQRIS77: { background: "#00ff83", color: "#000" },
  FUFUSLOT: { background: "linear-gradient(to right, #f7a103 0%, #ff6c00 100%)", color: "#FFF" },
  JOS007: { background: "radial-gradient(farthest-corner at 20% 0, #41760c 0%, #0d3200 50%)", color: "#FFF" },
  DEPO89: { background: "linear-gradient(to bottom, #fa06ba 0%, #b40586 100%)", color: "#FFF" },
  BONASLOT: { background: "linear-gradient(to right, #4582b4 0%, #305d82 100%)", color: "#FFF" },
  MADURA88: { background: "radial-gradient(farthest-corner at 20% 0, #b80000 0%, #400000 50%)", color: "#FFF" },
  NUSA211: { background: "linear-gradient(to bottom, #fbeb8c 0%, #9d7e39 100%)", color: "#000" }
};

export const getBrandStyle = (code) => {
  const normalizedCode = String(code || "").trim().toUpperCase();
  return BRAND_STYLE_MAP[normalizedCode] || DEFAULT_BRAND_STYLE;
};
