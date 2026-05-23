import { app } from "./app.js";
import { env } from "./config/env.js";
import { attachRealtime } from "./realtime.js";

const server = app.listen(env.port, "0.0.0.0", () => {
  console.log(`SAFE backend running on http://0.0.0.0:${env.port}`);
});

attachRealtime(server, app);
