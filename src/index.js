import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./db/db_connect.js";
import dns from "dns";

dns.setServers(['1.1.1.1', '8.8.8.8']);

const port = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`App listening at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error", err);
    process.exit(1);
  });

