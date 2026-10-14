const express = require('express');
const multer = require('multer');
const { uploadBufferToCloudinary } = require('../utils/cloudinary');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    const folder = req.body.folder || 'menu';
    const result = await uploadBufferToCloudinary(req.file.buffer, folder);

    return res.status(200).json({
      message: 'Image uploaded successfully',
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    return res.status(500).json({ message: 'Cloudinary upload failed', error: error.message });
  }
});

module.exports = router;
