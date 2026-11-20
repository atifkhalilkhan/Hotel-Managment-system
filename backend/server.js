import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import connectDB from "./config/db.js";
import dns from "node:dns";
    
dns.setServers(["8.8.8.8"]);

const PORT = process.env.PORT || 2008;

await connectDB();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

