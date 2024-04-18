import { Location, Quest, Sublocation } from "@prisma/client";
import { KeyboardBuilder } from "vk-io";
import { answerTimeLimit, chat_id, timer_text } from "../../..";
import prisma from "./prisma_client";
import { Confirm_User_Success, Logger, Send_Message } from "../../core/helper";

//контроллер управления локациями
async function Location_Get(cursor: number) {
    const batchSize = 5;
    let counter = 0
    let limiter = 0
    let res: Location[] = []
    for (const location of await prisma.location.findMany({})) {
        if ((cursor <= counter && batchSize+cursor >= counter) && limiter < batchSize) {
            res.push(location)
            limiter++
        }
        counter++
    }
    
   return res
}
export async function Location_Printer(context: any) {
    
    
    let location_tr = false
    let cursor = 0
    while (!location_tr) {
        const keyboard = new KeyboardBuilder()
        let event_logger = ``
        for await (const location of await Location_Get(cursor)) {
            keyboard.textButton({ label: `👀 ${location.id}-${location.name.slice(0,30)}`, payload: { command: 'location_select', cursor: cursor, id_location: location.id }, color: 'secondary' })
            .textButton({ label: `⛔`, payload: { command: 'location_delete', cursor: cursor, id_location: location.id }, color: 'secondary' }).row()
            //.callbackButton({ label: '👀', payload: { command: 'builder_controller', command_sub: 'builder_open', office_current: i, target: builder.id }, color: 'secondary' })
            event_logger += `💬 ${location.id} - ${location.name}\n`
        }
        if (cursor >= 5) { keyboard.textButton({ label: `←`, payload: { command: 'location_back', cursor: cursor }, color: 'secondary' }) }
        const location_counter = await prisma.location.count({})
        if (5+cursor < location_counter) { keyboard.textButton({ label: `→`, payload: { command: 'location_next', cursor: cursor }, color: 'secondary' }) }
        keyboard.textButton({ label: `➕`, payload: { command: 'location_create', cursor: cursor }, color: 'secondary' }).row()
        .textButton({ label: `🚫`, payload: { command: 'location_return', cursor: cursor }, color: 'secondary' }).oneTime()
        event_logger += `\n ${1+cursor} из ${location_counter}`
        const location_bt = await context.question(`🧷 Выберите локацию:\n\n ${event_logger}`,
            {	
                keyboard: keyboard, answerTimeLimit
            }
        )
        if (location_bt.isTimeout) { return await context.send(`⏰ Время ожидания выбора локации истекло!`) }
        if (!location_bt.payload) {
            await context.send(`💡 Жмите только по кнопкам с иконками!`)
        } else {
            const config: any = {
                'location_select': Location_Select,
                'location_create': Location_Create,
                'location_next': Location_Next,
                'location_back': Location_Back,
                'location_return': Location_Return,
                'location_delete': Location_Delete
            }
            const ans = await config[location_bt.payload.command](context, location_bt.payload)
            cursor = ans?.cursor || ans?.cursor == 0 ? ans.cursor : cursor
            location_tr = ans.stop ? ans.stop : false
        }
    }
    
}

async function Location_Delete(context: any, data: any) {
    const res = { cursor: data.cursor }
    const location_check = await prisma.location.findFirst({ where: { id: data.id_location } })
    const confirm: { status: boolean, text: String } = await Confirm_User_Success(context, `удалить локацию ${location_check?.id}-${location_check?.name} со всеми включенными в нее подлокациями и квестами?`)
    await context.send(`${confirm.text}`)
    if (!confirm.status) { return res }
    if (location_check) {
        const location_del = await prisma.location.delete({ where: { id: location_check.id } })
        if (location_del) {
            await Logger(`In database, deleted location: ${location_del.id}-${location_del.name} by admin ${context.senderId}`)
            await context.send(`Вы удалили локацию: ${location_del.id}-${location_del.name} со всеми включенными в нее подлокациями и квестами!`)
            await Send_Message(chat_id, `📅 @id${context.senderId}(GameMaster) > удаляет локацию: ${location_del.id}-${location_del.name} со всеми включенными в нее подлокациями и квестами!`)
        }
    }
    return res
}

async function Location_Return(context: any, data: any) {
    const res = { cursor: data.cursor, stop: true }
    await context.send(`Вы отменили меню управления ежедневными заданиями`)
    return res
}

async function Location_Select(context: any, data: any) {
    const res = { cursor: data.cursor }
    await Sublocation_Printer(context, data.id_location)
    return res
}

async function Location_Next(context: any, data: any) {
    const res = { cursor: data.cursor+5 }
    return res
}

async function Location_Back(context: any, data: any) {
    const res = { cursor: data.cursor-5 }
    return res
}

async function Location_Create(context: any, data: any) {
    const res = { cursor: data.cursor }
    let spec_check = false
    let name_loc = null
	while (spec_check == false) {
		const name = await context.question( `🧷 Введите название новой локации:`, timer_text)
		if (name.isTimeout) { return await context.send(`⏰ Время ожидания ввода имени новой локации истекло!`) }
		if (name.text.length <= 100) {
			spec_check = true
			name_loc = `${name.text}`
		} else { await context.send(`💡 Ввведите до 100 символов включительно!`) }
	}
    if (name_loc) {
        const loc_cr = await prisma.location.create({ data: { name: name_loc } })
        if (loc_cr) {
            await Logger(`In database, created location: ${loc_cr.id}-${loc_cr.name} by admin ${context.senderId}`)
            await context.send(`Вы создали новую локацию ${loc_cr.id}-${loc_cr.name}`)
            await Send_Message(chat_id, `📅 @id${context.senderId}(GameMaster) > создает новую локацию: ${loc_cr.id}-${loc_cr.name}`)
        }
    }
    return res
}

//контроллер управления локациями
async function Sublocation_Get(cursor: number, id_location: number) {
    const batchSize = 5;
    let counter = 0
    let limiter = 0
    let res: Location[] = []
    for (const sublocation of await prisma.sublocation.findMany({ where: { id_location: id_location } })) {
        if ((cursor <= counter && batchSize+cursor >= counter) && limiter < batchSize) {
            res.push(sublocation)
            limiter++
        }
        counter++
    }
    
   return res
}
export async function Sublocation_Printer(context: any, id_location: number) {
    const location = await prisma.location.findFirst({where: { id: id_location } })
    let sublocation_tr = false
    let cursor = 0
    while (!sublocation_tr) {
        const keyboard = new KeyboardBuilder()
        let event_logger = ``
        for await (const sublocation of await Sublocation_Get(cursor, id_location)) {
            keyboard.textButton({ label: `👀 ${sublocation.id}-${sublocation.name.slice(0,30)}`, payload: { command: 'sublocation_select', cursor: cursor, id_sublocation: sublocation.id }, color: 'secondary' })
            .textButton({ label: `⛔`, payload: { command: 'sublocation_delete', cursor: cursor, id_sublocation: sublocation.id }, color: 'secondary' }).row()
            //.callbackButton({ label: '👀', payload: { command: 'builder_controller', command_sub: 'builder_open', office_current: i, target: builder.id }, color: 'secondary' })
            event_logger += `💬 ${sublocation.id} - ${sublocation.name}\n`
        }
        if (cursor >= 5) { keyboard.textButton({ label: `←`, payload: { command: 'sublocation_back', cursor: cursor }, color: 'secondary' }) }
        const sublocation_counter = await prisma.sublocation.count({ where: { id_location: location?.id } })
        if (5+cursor < sublocation_counter) { keyboard.textButton({ label: `→`, payload: { command: 'sublocation_next', cursor: cursor }, color: 'secondary' }) }
        keyboard.textButton({ label: `➕`, payload: { command: 'sublocation_create', cursor: cursor }, color: 'secondary' }).row()
        .textButton({ label: `🚫`, payload: { command: 'sublocation_return', cursor: cursor }, color: 'secondary' }).oneTime()
        event_logger += `\n ${1+cursor} из ${sublocation_counter}` 
        
        const sublocation_bt = await context.question(`🧷 Выберите подлокацию для локации ${location?.name}:\n\n ${event_logger}`,
            {	
                keyboard: keyboard, answerTimeLimit
            }
        )
        if (sublocation_bt.isTimeout) { return await context.send(`⏰ Время ожидания выбора подлокации истекло!`) }
        if (!sublocation_bt.payload) {
            await context.send(`💡 Жмите только по кнопкам с иконками!`)
        } else {
            const config: any = {
                'sublocation_select': Sublocation_Select,
                'sublocation_create': Sublocation_Create,
                'sublocation_next': Sublocation_Next,
                'sublocation_back': Sublocation_Back,
                'sublocation_return': Sublocation_Return,
                'sublocation_delete': Sublocation_Delete
            }
            const ans = await config[sublocation_bt.payload.command](context, sublocation_bt.payload, location)
            cursor = ans?.cursor || ans?.cursor == 0 ? ans.cursor : cursor
            sublocation_tr = ans.stop ? ans.stop : false
        }
    }
    
}

async function Sublocation_Delete(context: any, data: any, location: Location) {
    const res = { cursor: data.cursor }
    const sublocation_check = await prisma.sublocation.findFirst({ where: { id: data.id_sublocation } })
    const confirm: { status: boolean, text: String } = await Confirm_User_Success(context, `удалить подлокацию ${sublocation_check?.id}-${sublocation_check?.name} со всеми включенными в нее квестами?`)
    await context.send(`${confirm.text}`)
    if (!confirm.status) { return res }
    if (sublocation_check) {
        const sublocation_del = await prisma.sublocation.delete({ where: { id: sublocation_check.id } })
        if (sublocation_del) {
            await Logger(`In database, deleted location: ${sublocation_del.id}-${sublocation_del.name} by admin ${context.senderId}`)
            await context.send(`Вы удалили подлокацию: ${sublocation_del.id}-${sublocation_del.name} со всеми квестами по ней для локации: ${location.id}-${location.name}`)
            await Send_Message(chat_id, `📅 @id${context.senderId}(GameMaster) > удаляет подлокацию: ${sublocation_del.id}-${sublocation_del.name} со всеми квестами по ней для локации: ${location.id}-${location.name}`)
        }
    }
    return res
}

async function Sublocation_Return(context: any, data: any, location: Location) {
    const res = { cursor: data.cursor, stop: true }
    await context.send(`Вы отменили меню управления подлокациями`)
    return res
}

async function Sublocation_Select(context: any, data: any, location: Location) {
    const res = { cursor: data.cursor }
    await Quest_Printer(context, data.id_sublocation)
    return res
}

async function Sublocation_Next(context: any, data: any, location: Location) {
    const res = { cursor: data.cursor+5 }
    return res
}

async function Sublocation_Back(context: any, data: any, location: Location) {
    const res = { cursor: data.cursor-5 }
    return res
}

async function Sublocation_Create(context: any, data: any, location: Location) {
    const res = { cursor: data.cursor }
    let spec_check = false
    let name_loc = null
	while (spec_check == false) {
		const name = await context.question( `🧷 Введите название новой подлокации:`, timer_text)
		if (name.isTimeout) { return await context.send(`⏰ Время ожидания ввода новой подлокации истекло!`) }
		if (name.text.length <= 30) {
			spec_check = true
			name_loc = `${name.text}`
		} else { await context.send(`💡 Ввведите до 30 символов включительно!`) }
	}
    if (name_loc) {
        const subloc_cr = await prisma.sublocation.create({ data: { name: name_loc, id_location: location.id } })
        if (subloc_cr) {
            await Logger(`In database, created sublocation: ${subloc_cr.id}-${subloc_cr.name} by admin ${context.senderId}`)
            await context.send(`Вы создали новую подлокацию ${subloc_cr.id}-${subloc_cr.name} для локации: ${location.id}-${location.name}`)
            await Send_Message(chat_id, `📅 @id${context.senderId}(GameMaster) > создает новую подлокацию ${subloc_cr.id}-${subloc_cr.name} для локации: ${location.id}-${location.name}`)
        }
    }
    return res
}

//контроллер управления квестами
async function Quest_Get(cursor: number, id_sublocation: number) {
    const batchSize = 5;
    let counter = 0
    let limiter = 0
    let res: Quest[] = []
    for (const quest of await prisma.quest.findMany({ where: { id_sublocation: id_sublocation } })) {
        if ((cursor <= counter && batchSize+cursor >= counter) && limiter < batchSize) {
            res.push(quest)
            limiter++
        }
        counter++
    }
    
   return res
}
export async function Quest_Printer(context: any, id_sublocation: number) {
    const sublocation = await prisma.sublocation.findFirst({where: { id: id_sublocation } })
    let quest_tr = false
    let cursor = 0
    while (!quest_tr) {
        const keyboard = new KeyboardBuilder()
        let event_logger = ``
        for await (const quest of await Quest_Get(cursor, id_sublocation)) {
            keyboard.textButton({ label: `✏ ${quest.id}-${quest.name.slice(0,30)}`, payload: { command: 'quest_edit', cursor: cursor, id_quest: quest.id }, color: 'secondary' })
            .textButton({ label: `⛔`, payload: { command: 'quest_delete', cursor: cursor, id_quest: quest.id }, color: 'secondary' }).row()
            //.callbackButton({ label: '👀', payload: { command: 'builder_controller', command_sub: 'builder_open', office_current: i, target: builder.id }, color: 'secondary' })
            event_logger += `💬 ${quest.id} - ${quest.name}\n`
        }
        if (cursor >= 5) { keyboard.textButton({ label: `←`, payload: { command: 'quest_back', cursor: cursor }, color: 'secondary' }) }
        const quest_counter = await prisma.quest.count({ where: { id_sublocation: sublocation?.id } })
        if (5+cursor < quest_counter) { keyboard.textButton({ label: `→`, payload: { command: 'quest_next', cursor: cursor }, color: 'secondary' }) }
        keyboard.textButton({ label: `➕`, payload: { command: 'quest_create', cursor: cursor }, color: 'secondary' }).row()
        .textButton({ label: `🚫`, payload: { command: 'quest_return', cursor: cursor }, color: 'secondary' }).oneTime()
        event_logger += `\n ${1+cursor} из ${quest_counter}` 
        
        const quest_bt = await context.question(`🧷 Выберите квест для подлокации ${sublocation?.name}:\n\n ${event_logger}`,
            {	
                keyboard: keyboard, answerTimeLimit
            }
        )
        if (quest_bt.isTimeout) { return await context.send(`⏰ Время ожидания выбора квеста истекло!`) }
        if (!quest_bt.payload) {
            await context.send(`💡 Жмите только по кнопкам с иконками!`)
        } else {
            const config: any = {
                'quest_edit': Quest_Edit,
                'quest_create': Quest_Create,
                'quest_next': Quest_Next,
                'quest_back': Quest_Back,
                'quest_return': Quest_Return,
                'quest_delete': Quest_Delete
            }
            const ans = await config[quest_bt.payload.command](context, quest_bt.payload, sublocation)
            cursor = ans?.cursor || ans?.cursor == 0 ? ans.cursor : cursor
            quest_tr = ans.stop ? ans.stop : false
        }
    }
    
}

async function Quest_Delete(context: any, data: any, sublocation: Sublocation) {
    const res = { cursor: data.cursor }
    const quest_check = await prisma.quest.findFirst({ where: { id: data.id_quest } })
    const confirm: { status: boolean, text: String } = await Confirm_User_Success(context, `удалить квест ${quest_check?.id}-${quest_check?.name}?`)
    await context.send(`${confirm.text}`)
    if (!confirm.status) { return res }
    if (quest_check) {
        const quest_del = await prisma.quest.delete({ where: { id: quest_check.id } })
        if (quest_del) {
            await Logger(`In database, deleted quest: ${quest_del.id}-${quest_del.name} by admin ${context.senderId}`)
            await context.send(`Вы удалили квест: ${quest_del.id}-${quest_del.name} для подлокации: ${sublocation.id}-${sublocation.name}`)
            await Send_Message(chat_id, `📅 @id${context.senderId}(GameMaster) > удаляет квест: ${quest_del.id}-${quest_del.name} для подлокации: ${sublocation.id}-${sublocation.name}`)
        }
    }
    return res
}

async function Quest_Return(context: any, data: any, sublocation: Sublocation) {
    const res = { cursor: data.cursor, stop: true }
    await context.send(`Вы отменили меню управление квестами`)
    return res
}

async function Quest_Edit(context: any, data: any, sublocation: Sublocation) {
    const res = { cursor: data.cursor }
    let spec_check = false
    let name_loc = null
    const quest_check = await prisma.quest.findFirst({ where: { id: data.id_quest } })
	while (spec_check == false) {
		const name = await context.question( `🧷 Вы редактируете квест ${quest_check?.name} для подлокации ${sublocation.name}. Введите исправленный квест:`, timer_text)
		if (name.isTimeout) { return await context.send(`⏰ Время ожидания ввода для корректировки квеста истекло!`) }
		if (name.text.length <= 20000) {
			spec_check = true
			name_loc = `${name.text}`
		} else { await context.send(`💡 Ввведите до 20000 символов включительно!`) }
	}
    if (name_loc) {
        const quest_up = await prisma.quest.update({ where: { id: quest_check?.id }, data: { name: name_loc } })
        if (quest_up) {
            await Logger(`In database, updated quest: ${quest_up.id}-${quest_up.name} by admin ${context.senderId}`)
            await context.send(`Вы скорректировали квест с ${quest_check?.id}-${quest_check?.name} на ${quest_up.id}-${quest_up.name} для подлокации: ${sublocation.id}-${sublocation.name}`)
            await Send_Message(chat_id, `📅 @id${context.senderId}(GameMaster) > изменяет квест с ${quest_check?.id}-${quest_check?.name} на ${quest_up.id}-${quest_up.name} для подлокации: ${sublocation.id}-${sublocation.name}`)
        }
    }
    return res
}

async function Quest_Next(context: any, data: any, sublocation: Sublocation) {
    const res = { cursor: data.cursor+5 }
    return res
}

async function Quest_Back(context: any, data: any, sublocation: Sublocation) {
    const res = { cursor: data.cursor-5 }
    return res
}

async function Quest_Create(context: any, data: any, sublocation: Sublocation) {
    const res = { cursor: data.cursor }
    let spec_check = false
    let name_loc = null
	while (spec_check == false) {
		const name = await context.question( `🧷 Придумайте новый квест:`, timer_text)
		if (name.isTimeout) { return await context.send(`⏰ Время ожидания ввода задания квеста истекло!`) }
		if (name.text.length <= 20000) {
			spec_check = true
			name_loc = `${name.text}`
		} else { await context.send(`💡 Ввведите до 20000 символов включительно!`) }
	}
    if (name_loc) {
        const quest_cr = await prisma.quest.create({ data: { name: name_loc, id_sublocation: sublocation.id } })
        if (quest_cr) {
            await Logger(`In database, created quest: ${quest_cr.id}-${quest_cr.name} by admin ${context.senderId}`)
            await context.send(`Вы создали новый квест ${quest_cr.id}-${quest_cr.name} для подлокации: ${sublocation.id}-${sublocation.name}`)
            await Send_Message(chat_id, `📅 @id${context.senderId}(GameMaster) > создает новый квест ${quest_cr.id}-${quest_cr.name} для подлокации: ${sublocation.id}-${sublocation.name}`)
        }
    }
    return res
}