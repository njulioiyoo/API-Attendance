const express = require("express");
const router = express.Router();
const apiController = require("../controllers/api.controller");
const multer = require("multer");
// konfigurasi storage untuk menyimpan file di folder "uploads"
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname +
        "-" +
        uniqueSuffix +
        "." +
        file.originalname.split(".").pop()
    );
  },
});

// filter untuk memastikan hanya file dengan tipe tertentu yang diupload
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(new Error("File type not supported"), false);
  }
};

// inisialisasi multer dengan storage dan filter
const upload = multer({ storage: storage, fileFilter: fileFilter });

router.post("/auth/signin", apiController.signIn);

router.get("/users", apiController.getUser);
router.post("/users", upload.single("photo"), apiController.createUser);
router.get("/users/detail/:userId", apiController.detailUser);
router.put(
  "/users/detail/:userId",
  upload.single("photo"),
  apiController.updateUser
);

router.get("/absen", apiController.getAbsensi);
router.post("/absen", apiController.createAttendance);
router.put("/absen", apiController.updateAttendance);
router.get(
  "/absen/summary-absen/:userId/summary",
  apiController.summaryAttendance
);

// Endpoint untuk mengambil file gambar
router.get("/gambar/:filename", (req, res) => {
  const fileName = req.params.filename;
  res.sendFile(__dirname + "/uploads/" + fileName);
});

module.exports = router;
