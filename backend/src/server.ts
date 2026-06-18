import app from "./app";
import connectDB from "./config/db";

const PORT = process.env.PORT || 3001;

connectDB();

app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});