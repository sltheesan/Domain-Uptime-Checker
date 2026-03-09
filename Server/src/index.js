import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import http from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { seedAdmin } from "./seeds/seedAdmin.js";
import { startScheduler } from "./jobs/scheduler.js";
import { initSocketServer } from "./sockets/socketServer.js";

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  await connectDB();
  await seedAdmin();

  const server = http.createServer(app);
  initSocketServer(server);

  await startScheduler();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
