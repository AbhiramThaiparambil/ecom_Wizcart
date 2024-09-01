const sharp = require("sharp");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadPath = path.join(__dirname, "../", "uploads");
const resizedPath = path.join(__dirname, "../", "public", "resizeImg");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

if (!fs.existsSync(resizedPath)) {
  fs.mkdirSync(resizedPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

const resizeImages = async (files) => {
  const resizePromises = files.map((file) => {
    const ext = path.extname(file.originalname);
    let filename = `${Date.now()}.jpg`;
    const resizedImagePath = path.join(resizedPath, filename);
    return sharp(file.path)
      .resize({
        width: 600,  // First resize to a larger size
        height: 600,
        fit: "cover",
        position: "center",
        kernel: sharp.kernel.lanczos3 // Using a high-quality interpolation method
      })
      .jpeg({
        quality: 100, // Increase quality to 100
        chromaSubsampling: '4:4:4',
        progressive: true // Enable progressive JPEG
      })
      .toBuffer()  // Convert to buffer to resize again
      .then(data => {
        return sharp(data)
          .resize(300, 300)  // Resize down to target size
          .jpeg({
            quality: 100, // Ensure quality remains high
            chromaSubsampling: '4:4:4',
            progressive: true // Ensure progressive JPEG
          })
          .toFile(resizedImagePath)
      })
      .then(() => resizedImagePath)
      .catch((err) => {
        console.error(`Error resizing image ${file.originalname}: ${err}`);
        return null;
      });
  });

  return Promise.all(resizePromises);
};

module.exports = {
  upload,
  resizeImages,
};
