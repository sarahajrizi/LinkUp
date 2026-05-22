import { app } from './app.js';
import { env } from './config/env.js';
import { attachRealtime } from './realtime.js';

const server = app.listen(env.port, () => {
  console.log(`SAFE backend running on http://localhost:${env.port}`);
});

attachRealtime(server, app);
