import { unlink } from "fs";
import Jimp = require("jimp")
import { UploadAllowedSource } from "vk-io";
import { vk } from "../..";


async function Gen_Image(image_path: string, x: number, y: number, text: string, idvk: number) {
    const lenna: any = await Jimp.read(image_path)
    const font = await Jimp.loadFont('./src/art/font/harlow.fnt')
    const res = await lenna.print(font, x, y, text);
    const link: any = `./src/art/temp/${idvk}_card.jpg`
    await lenna.writeAsync(link);
    return link
}

export async function Image_Processor(context: any, image_path: string, x: number, y: number, text: string) {
    const link  = await Gen_Image(image_path, x, y, text, context.senderId)
    await context.send({ attachment: await vk.upload.messagePhoto({ source: { value: link } }) });
    unlink(link, (err) => { if (err) throw err; console.log(`successfully deleted ${link}`); });
}