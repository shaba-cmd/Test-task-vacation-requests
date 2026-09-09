import path from "node:path";
import { createApp } from "./app.js";
import { createStore } from "./store.js";

const PORT = Number(process.env.PORT ?? 4000);
const DATA_FILE = process.env.DATA_FILE
  ? path.resolve(process.env.DATA_FILE)
  : path.resolve(process.cwd(), "data/requests.json");

const app = createApp({ store: createStore({ file: DATA_FILE }) });

app.listen(PORT, () => {
  console.log(`API готов: http://localhost:${PORT}`);
  console.log(`Хранилище: ${DATA_FILE}`);
});
