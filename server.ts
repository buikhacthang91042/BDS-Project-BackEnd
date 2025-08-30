// server.ts
import dotenv from "dotenv";
dotenv.config();
import express, { Express } from "express";
import cors from "cors";
import passport from "./config/passportConfig";
import authRoute from "./routes/authRoute";
import trendsRoute from "./routes/trendsRoute";
import mapRouter from "./routes/mapRouter";
import scrape from "./cron/scraperJob";

const app: Express = express();
const allowedOrigins: string[] = [
  "http://localhost:3000",
  "https://bds-project-dusky.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-client-type"],
    credentials: true,
  })
);
app.use(passport.initialize());
app.use(express.json());

app.use("/api/auth", authRoute);
app.use("/api/trends", trendsRoute);
app.use("/api/map", mapRouter);

const PORT: number = parseInt(process.env.PORT || "5001", 10);
app.listen(PORT, () => console.log("Server is running on port " + PORT));
scrape();