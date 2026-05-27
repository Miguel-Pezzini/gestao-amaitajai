import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import { env } from "./config/env.js";
import routes from "./routes/index.js";

const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use("/api", routes);

export default app;
