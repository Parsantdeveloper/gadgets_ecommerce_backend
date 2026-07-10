import { app } from "./app.js";
import { env } from "./config/env.js";



 app.get("/", (req, res) => {
  res.send("Hello, World!");
});
app.set('trust proxy', 1);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
   
  });
});
app.listen(env.PORT, () => {
console.log(`Server running on port ${env.PORT}`);
});