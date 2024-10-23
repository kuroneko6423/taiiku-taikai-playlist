const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use("/downloads", express.static(path.join(__dirname, "downloads")));
app.use(express.static(path.join(__dirname, "public")));

app.get("/mp3-list", (req, res) => {
  const directoryPath = path.join(__dirname, "downloads");
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return res.status(500).send("Unable to scan directory");
    }

    // Filter only mp3 files
    const mp3Files = files.filter(
      (file) => path.extname(file).toLowerCase() === ".mp3"
    );
    res.json(mp3Files);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
