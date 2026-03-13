import { User } from "@prisma/client";
import prisma from "./prisma_client";
import { KeyboardBuilder } from "vk-io";
import { answerTimeLimit, timer_text } from "../../..";
import { Confirm_User_Success, Logger, Question_Is_Back, Question_Is_Cancel } from "../../core/helper";

//контроллер управления локациями
async function Storage_Get(cursor: number, user: User) {
    const batchSize = 5;
    return await prisma.storage.findMany({
        where: { id_user: user.id },
        orderBy: { id: 'asc' },
        skip: cursor,
        take: batchSize,
    })
}

function Storage_Image_Is_Valid(value: string): boolean {
    const text = String(value ?? '').trim()
    if (!text || text.length > 1000) {
        return false
    }
    return /^photo-?\d+_\d+$/i.test(text) || /^https?:\/\/\S+$/i.test(text)
}

function Storage_Image_Short(value: string | null | undefined): string {
    const text = String(value ?? '').trim()
    if (!text) {
        return 'нет изображения'
    }
    return text.length > 70 ? `${text.slice(0, 67)}...` : text
}

async function Storage_Target_UID_Input(context: any, currentUid: number): Promise<number | null> {
    while (true) {
        const uid = await context.question(
            `🧷 Введите 💳UID получателя для перемещения предмета:`,
            {
                keyboard: new KeyboardBuilder()
                .textButton({ label: '🔙', payload: { command: 'back' }, color: 'secondary' })
                .textButton({ label: '🚫', payload: { command: 'cancel' }, color: 'secondary' }).oneTime(),
                answerTimeLimit
            }
        )

        if (Question_Is_Cancel(uid) || Question_Is_Back(uid)) {
            return null
        }
        if (uid.isTimeout) {
            await context.send(`⏰ Время ожидания ввода UID получателя истекло!`)
            return null
        }

        const text = String(uid.text ?? '').trim()
        if (!/^\d+$/.test(text)) {
            await context.send(`💡 Необходимо ввести корректный UID!`)
            continue
        }

        const targetUid = Number(text)
        if (targetUid === currentUid) {
            await context.send(`💡 Укажите другой UID, отличный от текущего.`)
            continue
        }

        return targetUid
    }
}

export async function Storage_Printer(context: any, targetUserId?: number) {
    const actor = await prisma.user.findFirst({ where: { idvk: context.senderId } })
    if (!actor) { return }

    let user = actor
    if (typeof targetUserId === 'number') {
        const userTarget = await prisma.user.findFirst({ where: { id: targetUserId } })
        if (!userTarget) {
            await context.send(`⛔ Банковская карточка с 💳UID ${targetUserId} не найдена`)
            return
        }
        if (actor.id_role !== 2 && actor.id !== userTarget.id) {
            await context.send(`⛔ Недостаточно прав для управления чужим хранилищем`)
            return
        }
        user = userTarget
    }

    const isAdminMode = actor.id !== user.id
    let storage_tr = false
    let cursor = 0
    while (!storage_tr) {
        const keyboard = new KeyboardBuilder()
        let event_logger = ``
        const storage_list: any[] = await Storage_Get(cursor, user)
        for (const storage of storage_list) {
            keyboard.textButton({ label: `✏ ${storage.id}-${storage.name.slice(0,30)}`, payload: { command: 'storage_edit', cursor: cursor, id_storage: storage.id }, color: 'secondary' })
            .textButton({ label: `⛔`, payload: { command: 'storage_delete', cursor: cursor, id_storage: storage.id }, color: 'secondary' })
            if (actor.id_role === 2) {
                keyboard.textButton({ label: `↔`, payload: { command: 'storage_move', cursor: cursor, id_storage: storage.id }, color: 'secondary' })
            }
            keyboard.row()
            event_logger += `💬 ${storage.id} - ${storage.name}\n🖼 ${Storage_Image_Short(storage.image)}\n`
        }
        if (storage_list.length === 0) {
            event_logger += `💬 Предметов пока нет\n`
        }
        if (cursor >= 5) { keyboard.textButton({ label: `←`, payload: { command: 'storage_back', cursor: cursor }, color: 'secondary' }) }
        const storage_counter = await prisma.storage.count({ where: { id_user: user.id } })
        if (5+cursor < storage_counter) { keyboard.textButton({ label: `→`, payload: { command: 'storage_next', cursor: cursor }, color: 'secondary' }) }
        keyboard.textButton({ label: `➕`, payload: { command: 'storage_create', cursor: cursor }, color: 'secondary' }).row()
        .textButton({ label: `🚫`, payload: { command: 'storage_return', cursor: cursor }, color: 'secondary' }).oneTime()
        const startPosition = storage_counter > 0 ? cursor + 1 : 0
        event_logger += `\n ${startPosition} из ${storage_counter}`
        const storage_title = isAdminMode
            ? `🧷 Режим админа: хранилище пользователя @id${user.idvk}(${user.name}) UID ${user.id}.\n\n${event_logger}`
            : `🧷 Выберите предмет:\n\n${event_logger}`
        const storage_bt = await context.question(storage_title,
            {	
                keyboard: keyboard, answerTimeLimit
            }
        )
        if (Question_Is_Cancel(storage_bt) || Question_Is_Back(storage_bt)) {
            return await context.send(`⚙ Вы отменили меню управления хранилищем`)
        }
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
                'storage_delete': Storage_Delete,
                'storage_move': Storage_Move
            }
            const ans = await config[storage_bt.payload.command](context, storage_bt.payload, user, actor)
            cursor = ans?.cursor || ans?.cursor == 0 ? ans.cursor : cursor
            storage_tr = ans.stop ? ans.stop : false
        }
    }
    
}

async function Storage_Delete(context: any, data: any, user: User, actor: User) {
    const res = { cursor: data.cursor }
    const storage_check: any = await prisma.storage.findFirst({ where: { id: data.id_storage, id_user: user.id } })
    if (!storage_check) {
        await context.send(`⛔ Предмет не найден в выбранном хранилище`)
        return res
    }
    const confirm: { status: boolean, text: String } = await Confirm_User_Success(context, `удалить предмет ${storage_check?.id}-${storage_check?.name}?`)
    await context.send(`${confirm.text}`)
    if (!confirm.status) { return res }
    if (storage_check) {
        const storage_del = await prisma.storage.delete({ where: { id: storage_check.id } })
        if (storage_del) {
            await Logger(`In database, deleted storage item: ${storage_del.id}-${storage_del.name} by ${actor.idvk} for uid ${user.id}`)
            await context.send(`Вы удалили предмет: ${storage_del.id}-${storage_del.name}!`)
        }
    }
    return res
}

async function Storage_Move(context: any, data: any, user: User, actor: User) {
    const res = { cursor: data.cursor }
    if (actor.id_role !== 2) {
        await context.send(`⛔ Недостаточно прав для перемещения предметов`)
        return res
    }

    const storage_check: any = await prisma.storage.findFirst({ where: { id: data.id_storage, id_user: user.id } })
    if (!storage_check) {
        await context.send(`⛔ Предмет не найден в выбранном хранилище`)
        return res
    }

    const targetUid = await Storage_Target_UID_Input(context, user.id)
    if (targetUid === null) {
        return res
    }

    const targetUser = await prisma.user.findFirst({ where: { id: targetUid } })
    if (!targetUser) {
        await context.send(`⛔ Банковская карточка с 💳UID ${targetUid} не найдена`)
        return res
    }

    const moved: any = await prisma.storage.update({
        where: { id: storage_check.id },
        data: { id_user: targetUser.id }
    })

    await Logger(`In database, moved storage item: ${moved.id}-${moved.name} by ${actor.idvk} from uid ${user.id} to uid ${targetUser.id}`)
    await context.send(`⚙ Предмет ${moved.id}-${moved.name} перемещен в хранилище @id${targetUser.idvk}(${targetUser.name}) UID ${targetUser.id}`)
    return res
}

async function Storage_Return(context: any, data: any, user: User, actor: User) {
    const res = { cursor: data.cursor, stop: true }
    await context.send(`Вы отменили меню управления хранилищем`)
    return res
}

async function Storage_Edit(context: any, data: any, user: User, actor: User) {
    const res = { cursor: data.cursor }
    const storage_check: any = await prisma.storage.findFirst({ where: { id: data.id_storage, id_user: user.id } })
    if (!storage_check) {
        await context.send(`⛔ Предмет не найден в выбранном хранилище`)
        return res
    }

    const field = await context.question(
        `🧷 Вы редактируете предмет: ${storage_check.name}. Что изменить?`,
        {
            keyboard: new KeyboardBuilder()
            .textButton({ label: '✏ Название', payload: { command: 'storage_edit_name' }, color: 'secondary' })
            .textButton({ label: '🖼 Картинку', payload: { command: 'storage_edit_image' }, color: 'secondary' }).row()
            .textButton({ label: '🔙', payload: { command: 'back' }, color: 'secondary' })
            .textButton({ label: '🚫', payload: { command: 'cancel' }, color: 'secondary' }).oneTime(),
            answerTimeLimit
        }
    )
    if (Question_Is_Cancel(field) || Question_Is_Back(field)) { return res }
    if (field.isTimeout) { return await context.send(`⏰ Время ожидания выбора поля для корректировки предмета истекло!`) }
    if (!field.payload) {
        await context.send(`💡 Выберите действие кнопками`)
        return res
    }

    if (field.payload.command === 'storage_edit_name') {
        let spec_check = false
        let name_loc: string | null = null
        while (spec_check == false) {
            const name = await context.question(`🧷 Введите скорректированное название для предмета:`, timer_text)
            if (Question_Is_Cancel(name) || Question_Is_Back(name)) { return res }
            if (name.isTimeout) { return await context.send(`⏰ Время ожидания ввода для корректировки предмета истекло!`) }
            if (name.text.length <= 300) {
                spec_check = true
                name_loc = `${name.text}`
            } else { await context.send(`💡 Ввведите до 300 символов включительно!`) }
        }
        if (name_loc) {
            const storage_up: any = await prisma.storage.update({ where: { id: storage_check.id }, data: { name: name_loc } as any })
            if (storage_up) {
                await Logger(`In database, updated storage name: ${storage_up.id}-${storage_up.name} by ${actor.idvk} for uid ${user.id}`)
                await context.send(`⚙ Вы скорректировали предмет с ${storage_check.id}-${storage_check.name} на ${storage_up.id}-${storage_up.name}`)
            }
        }
        return res
    }

    if (field.payload.command === 'storage_edit_image') {
        let image_check = false
        let image_loc: string | null = null
        while (image_check == false) {
            const image = await context.question(`🧷 Введите новую ссылку изображения предмета. Поддерживается photo-... и https://...`, timer_text)
            if (Question_Is_Cancel(image) || Question_Is_Back(image)) { return res }
            if (image.isTimeout) { return await context.send(`⏰ Время ожидания ввода ссылки изображения истекло!`) }
            const image_text = String(image.text ?? '').trim()
            if (Storage_Image_Is_Valid(image_text)) {
                image_check = true
                image_loc = image_text
            } else {
                await context.send(`💡 Введите корректную ссылку: photo-... или https://...`)
            }
        }
        if (image_loc) {
            const storage_up: any = await prisma.storage.update({ where: { id: storage_check.id }, data: { image: image_loc } as any })
            if (storage_up) {
                await Logger(`In database, updated storage image: ${storage_up.id}-${storage_up.name} by ${actor.idvk} for uid ${user.id}`)
                await context.send(`⚙ Вы обновили изображение для предмета ${storage_up.id}-${storage_up.name}`)
            }
        }
    }
    return res
}

async function Storage_Next(context: any, data: any, user: User, actor: User) {
    const res = { cursor: data.cursor+5 }
    return res
}

async function Storage_Back(context: any, data: any, user: User, actor: User) {
    const res = { cursor: data.cursor-5 }
    return res
}

async function Storage_Create(context: any, data: any, user: User, actor: User) {
    const res = { cursor: data.cursor }
    let spec_check = false
    let name_loc: string | null = null
	while (spec_check == false) {
		const name = await context.question( `🧷 Введите название добавляемого предмета:`, timer_text)
		if (Question_Is_Cancel(name) || Question_Is_Back(name)) { return res }
		if (name.isTimeout) { return await context.send(`⏰ Время ожидания ввода имени добавляемого предмета истекло!`) }
		if (name.text.length <= 300) {
			spec_check = true
			name_loc = `${name.text}`
		} else { await context.send(`💡 Ввведите до 300 символов включительно!`) }
	}

    let image_check = false
    let image_loc: string | null = null
    while (image_check == false) {
        const image = await context.question(`🧷 Введите ссылку изображения предмета. Поддерживается photo-... и https://...`, timer_text)
        if (Question_Is_Cancel(image) || Question_Is_Back(image)) { return res }
        if (image.isTimeout) { return await context.send(`⏰ Время ожидания ввода ссылки изображения добавляемого предмета истекло!`) }
        const image_text = String(image.text ?? '').trim()
        if (Storage_Image_Is_Valid(image_text)) {
            image_check = true
            image_loc = image_text
        } else {
            await context.send(`💡 Введите корректную ссылку: photo-... или https://...`)
        }
    }

    if (name_loc && image_loc) {
        const loc_cr: any = await prisma.storage.create({ data: { name: name_loc, image: image_loc, id_user: user.id } as any })
        if (loc_cr) {
            await Logger(`In database, created item: ${loc_cr.id}-${loc_cr.name} by ${actor.idvk} for uid ${user.id}`)
            await context.send(`⚙ Вы добавили новый предмет ${loc_cr.id}-${loc_cr.name}`)
        }
    }
    return res
}
