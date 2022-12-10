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
    const image0 = await Jimp.read('./src/art/composer/0.jpg')
    const image1 = await Jimp.read('./src/art/composer/1.png');
    const image2 = await Jimp.read('./src/art/composer/2.png');
    const image3 = await Jimp.read('./src/art/composer/3.png');
    image0.composite(image1.resize(500,600), 100, 100, { mode: Jimp.BLEND_ADD, opacitySource: 1, opacityDest: 0.2})
    .composite(image2.resize(500,300), 200, 200, { mode: Jimp.BLEND_MULTIPLY, opacitySource: 1, opacityDest: 0.2})
    .composite(image3.resize(500,300), 500, 350, { mode: Jimp.BLEND_OVERLAY, opacitySource: 1, opacityDest: 0.2}).write('./src/art/temp/test.jpg')
}

export async function Image_Composer2() {
    const font = await Jimp.loadFont('./src/art/font/harlow_white/harlow.fnt')
    const image0 = await Jimp.read('./src/art/composer2/0.jpg')
    const image1 = await Jimp.read('./src/art/composer2/1.jpg');
    const image2 = await Jimp.read('./src/art/composer2/2.jpg');
    const image3 = await Jimp.read('./src/art/composer2/3.jpg');
    image0
    .composite(image1.resize(320,320),290, 390)
    .composite(image2.resize(300,300), 300, 400)
    .composite(image1.resize(320,320), image0.getWidth()-image3.getWidth()+125, 390)
    .composite(image3.resize(300,300), image0.getWidth()-image3.getWidth()-300, 400, )
    .print(font, 750, 500, "VS").quality(0).dither565() 
    .print(font, 300, 100, "Битва Века, кто сьест больше?").quality(0).dither565() 
    .write('./src/art/temp/test2.jpg')
}