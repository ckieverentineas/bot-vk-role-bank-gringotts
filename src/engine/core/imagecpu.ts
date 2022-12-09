import { unlink } from "fs";
import Jimp = require("jimp")
import { UploadAllowedSource } from "vk-io";
import { vk } from "../..";


export async function Image_Text_Add(context: any, image_path: string, x: number, y: number, text: string) {
    const font = await Jimp.loadFont('./src/art/font/harlow.fnt')
    const lenna: any = await Jimp.read(image_path)
    const res = await lenna.print(font, x, y, text).quality(0).dither565(); 
    await context.send({ attachment: await vk.upload.messagePhoto({ source: { value: await res.getBufferAsync(Jimp.MIME_JPEG) } }) });
}
export async function Image_Composer() {
    // Reading Image
    const image1 = await Jimp.read
    ('./src/art/inventory.jpg');
    const image2 = await Jimp.read
    ('./src/art/admin.jpg');
    const image3 = await Jimp.read
    ('./src/art/artefact.jpg');
    image1.blit(image2, 100, 150).blit(image3, 300, 250)
    .write('./src/art/temp/test.jpg')
}