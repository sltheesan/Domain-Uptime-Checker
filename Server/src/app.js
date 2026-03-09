import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import routes from "./routes/index.js";

const app = express();
const defaultClientUrl = "http://localhost:5173";
const configuredClientUrl = process.env.CLIENT_URL || defaultClientUrl;

app.use(
  cors({
    origin: configuredClientUrl,
    credentials: true
  })
);

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  "/screenshots",
  express.static(
    path.resolve(
      process.cwd(),
      process.env.SCREENSHOT_STORAGE_PATH || "src/storage/screenshots"
    )
  )
);

app.get("/", (req, res) => {
  res.json({ message: "Domain Uptime Checker API is running." });
});

app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

export default app;
