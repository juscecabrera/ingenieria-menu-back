import express from "express";
import config from "./config.js"
import dataRouter from "./routes/data.router.js"

const app = express();

app.use(express.json())

app.use("/api", dataRouter)


const PORT = config.PORT;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});