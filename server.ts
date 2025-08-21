import express, { Express } from "express";
import cors from "cors";
import connectDB from "./config/db";
import dotenv from "dotenv";
import authRoute from "./routes/authRoute";
import trendsRoute from "./routes/trendsRoute";
import scrape from "./cron/scraperJob";
dotenv.config();
connectDB();
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
app.use(express.json());

app.use("/api/auth", authRoute);
app.use("/api/trends", trendsRoute);

const PORT: number = parseInt(process.env.PORT || "5001", 10);
app.listen(PORT, () => console.log("Sever is running on port " + PORT));
scrape();
