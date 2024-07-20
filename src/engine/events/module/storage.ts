import { Storage, User } from "@prisma/client";
import prisma from "./prisma_client";
import { KeyboardBuilder } from "vk-io";
import { answerTimeLimit, timer_text } from "../../..";
import { Confirm_User_Success, Logger } from "../../core/helper";

//контроллер управления локациями
async function Storage_Get(cursor: number, user: User) {
    const batchSize = 5;
    let counter = 0
    let limiter = 0
    let res: Storage[] = []
    for (const storage of await prisma.storage.findMany({ where: { id_user: user.id } })) {
        if ((cursor <= counter && batchSize+cursor >= counter) && limiter < batchSize) {
            res.push(storage)
            limiter++
        }
        counter++
    }
    
   return res
}

export async function Storage_Printer(context: any) {
    const user = await prisma.user.findFirst({ where: { idvk: context.senderId } })
    if (!user) { return }
    let storage_tr = false
    let cursor = 0
    while (!storage_tr) {
        const keyboard = new KeyboardBuilder()
        let event_logger = ``
        for await (const storage of await Storage_Get(cursor, user)) {
            keyboard.textButton({ label: `✏ ${storage.id}-${storage.name.slice(0,30)}`, payload: { command: 'storage_edit', cursor: cursor, id_storage: storage.id }, color: 'secondary' })
            .textButton({ label: `⛔`, payload: { command: 'storage_delete', cursor: cursor, id_storage: storage.id }, color: 'secondary' }).row()
            event_logger += `💬 ${storage.id} - ${storage.name}\n`
        }
        if (cursor >= 5) { keyboard.textButton({ label: `←`, payload: { command: 'storage_back', cursor: cursor }, color: 'secondary' }) }
        const storage_counter = await prisma.storage.count({ where: { id_user: user.id } })
        if (5+cursor < storage_counter) { keyboard.textButton({ label: `→`, payload: { command: 'storage_next', cursor: cursor }, color: 'secondary' }) }
        keyboard.textButton({ label: `➕`, payload: { command: 'storage_create', cursor: cursor }, color: 'secondary' }).row()
        .textButton({ label: `🚫`, payload: { command: 'storage_return', cursor: cursor }, color: 'secondary' }).oneTime()
        event_logger += `\n ${1+cursor} из ${storage_counter}`
        const storage_bt = await context.question(`🧷 Выберите предмет:\n\n ${event_logger}`,
            {	
                keyboard: keyboard, answerTimeLimit
            }
        )
        if (storage_bt.isTimeout) { return await context.send(`⏰ Время ожидания выбора предмета истекло!`) }
        if (!storage_bt.payload) {
            await context.send(`💡 Жмите только по кнопкам с иконками!`)
        } else {
            const config: any = {
                'storage_edit': Storage_Edit,
                'storage_create': Storage_Create,
                'storage_next': Storage_Next,
                'storage_back': Storage_Back,
                'storage_return': Storage_Return,
                'storage_delete': Storage_Delete
            }
            const ans = await config[storage_bt.payload.command](context, storage_bt.payload, user)
            cursor = ans?.cursor || ans?.cursor == 0 ? ans.cursor : cursor
            storage_tr = ans.stop ? ans.stop : false
        }
    }
    
}

async function Storage_Delete(context: any, data: any, user: User) {
    const res = { cursor: data.cursor }
    const storage_check = await prisma.storage.findFirst({ where: { id: data.id_storage } })
    const confirm: { status: boolean, text: String } = await Confirm_User_Success(context, `удалить предмет ${storage_check?.id}-${storage_check?.name}?`)
    await context.send(`${confirm.text}`)
    if (!confirm.status) { return res }
    if (storage_check) {
        const storage_del = await prisma.storage.delete({ where: { id: storage_check.id } })
        if (storage_del) {
            await Logger(`In database, deleted storage item: ${storage_del.id}-${storage_del.name} by admin ${context.senderId}`)
            await context.send(`Вы удалили предмет: ${storage_del.id}-${storage_del.name}!`)
        }
    }
    return res
}

async function Storage_Return(context: any, data: any, user: User) {
    const res = { cursor: data.cursor, stop: true }
    await context.send(`Вы отменили меню управления хранилищем`)
    return res
}

async function Storage_Edit(context: any, data: any, user: User) {
    const res = { cursor: data.cursor }
    let spec_check = false
    let name_loc = null
    const storage_check = await prisma.storage.findFirst({ where: { id: data.id_storage } })
	while (spec_check == false) {
		const name = await context.question( `🧷 Вы редактируете предмет: ${storage_check?.name}. Введите скорректированное название для него:`, timer_text)
		if (name.isTimeout) { return await context.send(`⏰ Время ожидания ввода для корректировки предмета истекло!`) }
		if (name.text.length <= 300) {
			spec_check = true
			name_loc = `${name.text}`
		} else { await context.send(`💡 Ввведите до 300 символов включительно!`) }
	}
    if (name_loc) {
        const quest_up = await prisma.storage.update({ where: { id: storage_check?.id }, data: { name: name_loc } })
        if (quest_up) {
            await Logger(`In database, updated storage: ${quest_up.id}-${quest_up.name} by admin ${context.senderId}`)
            await context.send(`⚙ Вы скорректировали предмет с ${storage_check?.id}-${storage_check?.name} на ${quest_up.id}-${quest_up.name}`)
        }
    }
    return res
}

async function Storage_Next(context: any, data: any, user: User) {
    const res = { cursor: data.cursor+5 }
    return res
}

async function Storage_Back(context: any, data: any, user: User) {
    const res = { cursor: data.cursor-5 }
    return res
}

async function Storage_Create(context: any, data: any, user: User) {
    const res = { cursor: data.cursor }
    let spec_check = false
    let name_loc = null
	while (spec_check == false) {
		const name = await context.question( `🧷 Введите название добавляемого предмета:`, timer_text)
		if (name.isTimeout) { return await context.send(`⏰ Время ожидания ввода имени добавляемого предмета истекло!`) }
		if (name.text.length <= 300) {
			spec_check = true
			name_loc = `${name.text}`
		} else { await context.send(`💡 Ввведите до 300 символов включительно!`) }
	}
    if (name_loc) {
        const loc_cr = await prisma.storage.create({ data: { name: name_loc, id_user: user.id } })
        if (loc_cr) {
            await Logger(`In database, created item: ${loc_cr.id}-${loc_cr.name} by admin ${context.senderId}`)
            await context.send(`⚙ Вы добавили новый предмет ${loc_cr.id}-${loc_cr.name}`)
        }
    }
    return res
}