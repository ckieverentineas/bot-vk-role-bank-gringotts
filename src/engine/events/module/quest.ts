import { Location } from "@prisma/client";
import { KeyboardBuilder } from "vk-io";
import { answerTimeLimit, timer_text } from "../../..";
import prisma from "./prisma_client";

async function Location_Get(cursor: number | undefined) {
    const batchSize = 5;
    // Извлекаем порцию вопросов из базы данных
    const questions: Location[] = await prisma.$queryRaw<Location[]>`
        SELECT * FROM Location
        WHERE id > ${cursor ?? 0}
        ORDER BY id ASC
        LIMIT ${batchSize}
    `;
   return questions
}
export async function Location_Printer(context: any) {
    
    
    let location_tr = false
    let cursor = 0
    while (!location_tr) {
        const keyboard = new KeyboardBuilder()
        let event_logger = `Выберите Локацию:\n\n`
        for await (const location of await Location_Get(cursor)) {
            keyboard.textButton({ label: `👀 ${location.id}-${location.name.slice(0,30)}`, payload: { command: 'location_select', cursor: cursor }, color: 'secondary' })
            .textButton({ label: `⛔`, payload: { command: 'location_delete', cursor: cursor }, color: 'secondary' }).row()
            //.callbackButton({ label: '👀', payload: { command: 'builder_controller', command_sub: 'builder_open', office_current: i, target: builder.id }, color: 'secondary' })
            event_logger += `💬 ${location.id} - ${location.name}\n`
        }
        if (cursor >= 5) { keyboard.textButton({ label: `←`, payload: { command: 'location_back', cursor: cursor }, color: 'secondary' }) }
        
        keyboard.textButton({ label: `→`, payload: { command: 'location_next', cursor: cursor }, color: 'secondary' })
        keyboard.textButton({ label: `➕`, payload: { command: 'location_create', cursor: cursor }, color: 'secondary' }).row()
        .textButton({ label: `🚫`, payload: { command: 'location_back', cursor: cursor }, color: 'secondary' }).oneTime()
        const location_bt = await context.question(`🧷 Выберите локацию: ${event_logger}`,
            {	
                keyboard: keyboard, answerTimeLimit
            }
        )
        if (location_bt.isTimeout) { return await context.send(`⏰ Время ожидания выбора положения истекло!`) }
        if (!location_bt.payload) {
            await context.send(`💡 Жмите только по кнопкам с иконками!`)
        } else {
            const config: any = {
                'location_select': Location_Select,
                'location_create': Location_Create,
                'location_next': Location_Next,
                'location_back': Location_Back
            }
            const ans = await config[location_bt.payload.command](context, location_bt.payload)
            console.log(`Получено в селекторе ${ans}`)
            console.log(`Курсор до${cursor}`)
            console.log(`Проверка результата ${ans.cursor} =  ${ans.cursor ? ans.cursor : cursor}`)
            cursor = ans?.cursor || ans?.cursor == 0 ? ans.cursor : cursor
            console.log(`Курсор после ${cursor}`)
        }
    }
    
}

async function Location_Select(context: any, data: any) {
    
}

async function Location_Next(context: any, data: any) {
    console.log(`Передано дальше ${data}`)
    const res = { cursor: data.cursor+5 }
    console.log(`Получено дальше ${res}`)
    return res
}

async function Location_Back(context: any, data: any) {
    console.log(`Передано назад ${data}`)
    const res = { cursor: data.cursor-5 }
    console.log(`Получено назад ${res}`)
    return res
}

async function Location_Create(context: any, data: any) {
    const res = { cursor: data.cursor }
    let spec_check = false
    let name_loc = null
	while (spec_check == false) {
		const name = await context.question( `🧷 Введите название новой локации:`, timer_text)
		if (name.isTimeout) { return await context.send(`⏰ Время ожидания выбора специализации истекло!`) }
		if (name.text.length <= 30) {
			spec_check = true
			name_loc = `${name.text}`
		} else { await context.send(`💡 Ввведите до 30 символов включительно!`) }
	}
    if (name_loc) {
        await prisma.location.create({ data: { name: name_loc } })
    }
    return res
}