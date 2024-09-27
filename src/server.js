import express from "express";
import config from "./config.js"
import dataRouter from "./routes/data.router.js";
import cors from 'cors';

const app = express();

app.use(cors({
  origin: `${config.FRONT_URL}`, 
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"]
}));


app.use(express.json())

app.use("/api", dataRouter)

app.get("/", (req, res) => {
    res.json({message: "Server active"})
})

const PORT = config.PORT;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});