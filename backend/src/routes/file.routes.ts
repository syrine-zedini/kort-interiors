import { Router } from "express";
import { saveFileMetadata } from "../services/file.service";
import { upload } from "../middleware/upload";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: File upload and management
 */

/**
 * @swagger
 * /files:
 *   post:
 *     summary: Upload a file
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               type:
 *                 type: string
 *                 example: "image"
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     type:
 *                       type: string
 *                     originalName:
 *                       type: string
 *                     fileName:
 *                       type: string
 *                     mimeType:
 *                       type: string
 *                     size:
 *                       type: integer
 *                     url:
 *                       type: string
 *       400:
 *         description: No file uploaded
 *       500:
 *         description: Upload failed
 */
router.post("/", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const fileRecord = await saveFileMetadata({ file: req.file });
        const plain = fileRecord.toJSON?.() || fileRecord;

        res.status(201).json({
            message: "File uploaded successfully",
            data: {
                id: plain.id,
                type: plain.type,
                originalName: plain.originalName,
                fileName: plain.fileName,
                mimeType: plain.mimeType,
                size: plain.size,
                url: plain.url,
            },
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message || "Upload failed" });
    }
});

// POST /files/upload  — multi-file upload for the admin panel
// Accepts field name "files" (multiple)
router.post("/upload", upload.array("files", 20), async (req, res) => {
    try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            return res.status(400).json({ message: "No files uploaded" });
        }

        const records = await Promise.all(
            files.map((file) => saveFileMetadata({ file }))
        );

        res.status(201).json(
            records.map((r) => {
                const plain = r.toJSON?.() || r;
                return { id: plain.id, path: plain.url, url: plain.url };
            })
        );
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message || "Upload failed" });
    }
});

export default router;