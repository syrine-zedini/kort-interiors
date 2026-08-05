import path from "path";
import fs from "fs";
import { File } from "../models/file.model";

interface UploadFileInput {
    file: Express.Multer.File;
    type?: string;
}

export const saveFileMetadata = async ({ file, type }: UploadFileInput) => {
    if (!file) throw new Error("No file provided");

    const fileRecord = await File.create({
        type: type || "other",
        originalName: file.originalname,
        fileName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        url: `/public/${file.filename}`,
    });

    return fileRecord;
};

export const getFilePath = async (fileName: string) => {
    const file = await File.findOne({
        where: {
            fileName
        }
    });
    if (!file)
        throw new Error("File not saved on database");
    const filePath = path.join(__dirname, file.url);
    if (!fs.existsSync(filePath)) {
        throw new Error("File not found");
    }
    return filePath;
};