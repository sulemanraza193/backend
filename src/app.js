import express from 'express'
import cors from "cors"
import healthCheckRouter from "./routs/healthcheck.routs.js";
import authRouter from "./routs/auth.route.js";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";


const app = express()

app.use(express.json({ limit: "10mb" }));       // increase JSON limit
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.get('/', (req, res) => {
    res.send("Welcome to Express App with ES6 Modules and dotenv ")
})

// basic configuration for express app
app.use(express.json({ limit: "16k" }))
app.use(express.urlencoded({ extended: true, limit: "16k" }))
app.use(express.static("public"))

app.use(cookieParser());

// cors configuration
app.use(
    cors({
        origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
)


app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/auth", authRouter);

app.get("/", (req, res) => {
    res.send("Welcom to the Express Project")
});

export default app 