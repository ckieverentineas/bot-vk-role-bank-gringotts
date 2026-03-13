import { HearManager } from "@vk-io/hear";
import { Keyboard, KeyboardBuilder } from "vk-io";
import { IQuestionMessageContext } from "vk-io-question";
import { answerTimeLimit, chat_id, root, timer_text, timer_text_oper, vk } from '../index';
import { Accessed, Keyboard_Index, Question_Is_Back, Question_Is_Cancel } from "./core/helper";
import { Image_Random} from "./core/imagecpu";
import prisma from "./events/module/prisma_client";
import { User_Info } from "./events/module/tool";
import { Item, User } from "@prisma/client";
import { Location_Printer } from "./events/module/quest";
import { Storage_Printer } from "./events/module/storage";

async function Input_Target_UID(context: IQuestionMessageContext, title: string): Promise<number | null> {
    while (true) {
        const uid: any = await context.question(
            title,
            {
                keyboard: Keyboard.builder()
                .textButton({ label: '🚫Отмена', payload: { command: 'cancel' }, color: 'secondary' })
                .oneTime().inline(),
                answerTimeLimit
            }
        )

        if (Question_Is_Cancel(uid)) { return null }
        if (uid.isTimeout) {
            await context.send(`⏰ Время ожидания ввода UID истекло!`)
            return null
        }

        const text = String(uid?.text ?? '').trim()
        if (/^\d+$/.test(text)) {
            const id = Number(text)
            const target = await prisma.user.findFirst({ where: { id } })
            if (!target) {
                await context.send(`💡 Нет такого банковского счета!`)
                continue
            }
            return id
        }

        await context.send(`💡 Необходимо ввести корректный UID!`)
    }
}

// МОДУЛЬ ОБРАБОТКИ ВВОДА ПОЛЬЗОВАТЕЛЕМ 
async function Ipnut_Gold(context: IQuestionMessageContext, operationName: string): Promise<number | null> {
    let golden: number = 0
    let money_check = false
    while (money_check == false) {
        const gold: any = await context.question(`🧷 Введите количество для операции ${operationName}: `, timer_text_oper)
        if (Question_Is_Cancel(gold)) { return null }
        if (Question_Is_Back(gold)) { return null }
        if (gold.isTimeout) { await context.send(`⏰ Время ожидания на задание количества ${operationName} истекло!`); return null }
        const parsed = Number(gold.text)
        if (!Number.isNaN(parsed)) {
            money_check = true
            golden = parsed
        } else {
            await context.send(`💡 Введите число для операции ${operationName}!`)
        }
    }
    return golden
}

async function Ipnut_Message(context: IQuestionMessageContext, operation_type: string): Promise<string | null> {
    let golden = ''
    let money_check = false
    while (money_check == false) {
        const gold = await context.question(`🧷 Введите уведомление пользователю для ${operation_type}:`, timer_text_oper)
        if (Question_Is_Cancel(gold)) { return null }
        if (Question_Is_Back(gold)) { return null }
        if (gold.isTimeout) { await context.send(`⏰ Время ожидания на задание уведомления пользователю ${operation_type} истекло!`); return null }
        if (gold.text) {
            money_check = true
            golden = gold.text
        } 
    }
    return golden
}

export function registerUserRoutes(hearManager: HearManager<IQuestionMessageContext>): void {
    hearManager.hear(/Косой переулок/, async (context) => {
        if (context.senderId == root) {
            console.log(`Admin ${context.senderId} enter in shopping`)
            const category:any = await prisma.category.findMany({})
            if (category.length == 0) {
                const ans: any = await context.question(
                    `✉ Магазинов еще нет`,
                    {   keyboard: Keyboard.builder()
                        .textButton({   label: 'Добавить магазин',
                                        payload: {  command: 'new_shop' },
                                        color: 'secondary'                  })
                        .oneTime().inline()                                     }
                )
                if (ans.payload.command == 'new_shop') {
                    const shop: any = await context.question(`🧷 Введите название магазина:`)
                    const shop_create = await prisma.category.create({  data: { name: shop.text }   })
                    console.log(`User ${context.senderId} open new shop`)
                    await vk.api.messages.send({
                        peer_id: chat_id,
                        random_id: 0,
                        message: `⚙ @id${context.senderId}(ROOT) пользователь открывает магазин ${shop_create.name}`
                    })
                    await context.send(`⚙ Вы открыли магазин ${shop_create.name}`)
                }
            } else {
                let keyboard = Keyboard.builder()
                category.forEach(async (element: any) => {
                    keyboard.textButton({   label: element.name,
                                            payload: { command: `${element.id}` }   })
                    .textButton({   label: "Удалить",
                                    payload: { command: `${element.id}` }   }).row()
                })
                const ans: any = await context.question(`✉ Куда пойдем?`,
                    {   keyboard: keyboard
                        .textButton({   label: 'Добавить магазин',
                                        payload: { command: 'new_shop' },
                                        color: 'secondary'                  })
                        .oneTime().inline()                                     })
                if (ans.text == "Удалить") {
                    const shop_delete = await prisma.category.delete({ where: { id: Number(ans.payload.command) } })
                    console.log(`User ${context.senderId} close shop`)
                    await vk.api.messages.send({
                        peer_id: chat_id,
                        random_id: 0,
                        message: `⚙ @id${context.senderId}(ROOT) пользователь закрывает магазин ${shop_delete.name}`
                    })
                    await context.send(`⚙ Удален магазин ${shop_delete.name}`)
                }
                if (ans.payload?.command == 'new_shop') {
                    const shop: any = await context.question( `🧷 Введите название магазина:` )
                    const shop_create: any = await prisma.category.create({ data: { name: shop.text } })
                    console.log(`User ${context.senderId} open new shop`)
                    await context.send(`⚙ Вы открыли магазин ${shop_create.name}`)
                    await vk.api.messages.send({
                        peer_id: chat_id,
                        random_id: 0,
                        message: `⚙ @id${context.senderId}(ROOT) пользователь открыл магазин ${shop_create.name}`
                    })
                }
                if (category.find((i: any) => i.name == ans.text)) {
                    await context.send(`⌛ Вы оказались в ${ans.text}`)
                    const item: any= await prisma.item.findMany({ where: { id_category: Number(ans.payload.command) } })
                    if (item.length == 0) {
                        await context.send(`✉ К сожалению, прилавки пока что пусты`)
                    } else {
                        item.forEach(async (element: any) => {
                            await context.send(`🛍 ${element.name} ${element.price}💰`,
                                {
                                    keyboard: Keyboard.builder()
                                    .textButton({ label: 'Купить', payload: { command: `${element.name}` }, color: 'secondary' })
                                    .textButton({ label: '✏Имя', payload: { command: `${element.name}` }, color: 'secondary' })
                                    .textButton({ label: '✏Тип', payload: { command: `${element.name}` }, color: 'secondary' })
                                    .oneTime().inline()                                             
                                }
                            )  
                        })
                    }
                    const ans_item: any = await context.question( `✉ Что будем делать?`,
                        {   
                            keyboard: Keyboard.builder()
                            .textButton({ label: 'Добавить товар', payload: { command: 'new_item' }, color: 'secondary' })
                            .textButton({ label: 'Перейти к покупкам', payload: { command: 'continue' }, color: 'secondary' })
                            .oneTime().inline()
                        }
                    )
                    if (ans_item.payload?.command == 'new_item') {
                        const item_name: any = await context.question( `🧷 Введите название предмета:` )
                        const item_price = await context.question( `🧷 Введите его ценность:` )
                        const item_type: any = await context.question( `🧷 Укажите тип товара: \n 🕐 — покупается пользователем однажды; \n ♾ — покупается пользователем бесконечное количество раз.`,
                            {   keyboard: Keyboard.builder()
                                .textButton({   label: '🕐',
                                                payload: { command: 'limited' },
                                                color: 'secondary'                  })
                                .textButton({   label: '♾',
                                                payload: { command: 'unlimited' },
                                                color: 'secondary'                  })
                                .oneTime().inline()                                     }
                        )
                        const item_create = await prisma.item.create({ data: {  name: item_name.text, price: Number(item_price.text), id_category: Number(ans.payload.command), type: item_type.payload.command } })
                        console.log(`User ${context.senderId} added new item ${item_create.id}`)
                        await context.send(`⚙ Для магазина ${ans.text} добавлен новый товар ${item_name.text} стоимостью ${item_price.text} галлеонов`)
                        await vk.api.messages.send({
                            peer_id: chat_id,
                            random_id: 0,
                            message: `⚙ @id${context.senderId}(ROOT) пользователь добавляет новый товар ${item_name.text} стоимостью ${item_price.text} галлеонов`
                        })
                    }
                    if (ans_item.payload.command == 'continue') { await context.send(`💡 Нажимайте кнопку "купить" у желаемого товара`) }
                }
            }
        }
        await Keyboard_Index(context, `💡 А может быть, в Косом переулке есть подполье?`)
    })
    hearManager.hear(/✏Тип/, async (context) => {
        if (context.messagePayload == null && context.senderId != root) {
            console.log((`stop`))
            return
        }
        const item_buy:any = await prisma.item.findFirst({ where: { name: context.messagePayload.command } })
        if (item_buy) {
            const item_type: any = await context.question( `🧷 Укажите тип товара для ${item_buy.name}: \n 🕐 — покупается пользователем однажды; \n ♾ — покупается пользователем бесконечное количество раз. \n Текущий тип: ${item_buy.type}`,
                {   
                    keyboard: Keyboard.builder()
                    .textButton({ label: '🕐', payload: { command: 'limited' }, color: 'secondary' })
                    .textButton({ label: '♾', payload: { command: 'unlimited' }, color: 'secondary' })
                    .oneTime().inline()
                }
            )
            const item_update = await prisma.item.update({ where: { id: item_buy.id }, data: { type: item_type.payload.command } })
            console.log(`Admin ${context.senderId} edit type item ${item_buy.id}`)
            await context.send(`⚙ Тип предмета ${item_buy.name} изменен с ${item_buy.type} на ${item_update.type}`)
            await vk.api.messages.send({
                peer_id: chat_id,
                random_id: 0,
                message: `⚙ @id${context.senderId}(ROOT) пользователь корректирует тип предмета ${item_buy.name} с ${item_buy.type} на ${item_update.type}`
            })
        } else {
            console.log(`Admin ${context.senderId} can't edit type item ${item_buy.id}`)
            await context.send(`✉ Тип предмета не удалось поменять`)
        }
        await Keyboard_Index(context, `💡 Вот бы всегда безлимит, и редактировать бы ничего не пришлось?`)
    })
    hearManager.hear(/✏Имя/, async (context) => {
        if (context.messagePayload == null && context.senderId != root) {
            console.log((`stop`))
            return
        }
        const item_buy:any = await prisma.item.findFirst({ where: { name: context.messagePayload.command } })
        if (item_buy) {
            const name: any = await context.question(`🧷 Предмет: ${item_buy.name}.\nВведите новое имя для товара:`)
            const item_update = await prisma.item.update({ where: { id: item_buy.id }, data: { name: name.text } })
            console.log(`Admin ${context.senderId} edit name item ${item_buy.id}`)
            await context.send(`⚙ Имя предмета ${item_buy.name} изменено на ${item_update.name}`)
            await vk.api.messages.send({
                peer_id: chat_id,
                random_id: 0,
                message: `⚙ @id${context.senderId}(ROOT) пользователь корректирует имя предмета с ${item_buy.name} на ${item_update.name}`
            })
        } else {
            console.log(`Admin ${context.senderId} can't edit name item ${item_buy.id}`)
            await context.send(`✉ Имя предмета не удалось поменять`)
        }
        await Keyboard_Index(context, `💡 Может еще что-нибудь отредактировать?`)
    })
    hearManager.hear(/!опмасс/, async (context) => {
        if (await Accessed(context) != 2) {
            return
        }
        let name_check = false
        let uids = null
        while (name_check == false) {
            const uid: any = await context.question( 
                `🧷 Введите список 💳UID банковских счетов получателей формата:\n"UID1 UID2 .. UIDN"\n\n` +
                `💡 Или введите 0, если хотите указать разные суммы для каждого пользователя`,
                {   
                    keyboard: Keyboard.builder()
                    .textButton({ label: '🚫Отмена', payload: { command: 'limited' }, color: 'secondary' })
                    .oneTime().inline(),
                    timer_text
                }
            )
            if (uid.isTimeout) { return await context.send('⏰ Время ожидания на ввод банковского счета получателя истекло!')}
            
            if (uid.text === "0") {
                // Пользователь хочет кастомные операции - сразу переходим к выбору типа
                uids = []
                name_check = true
                await context.send(`⚙ Переходим к операциям с разными суммами`)
                
                // Показываем только кастомные операции
                const ans: any = await context.question( `✉ Выберите тип операции с разными суммами:`,
                    {   
                        keyboard: Keyboard.builder()
                        .textButton({ label: '🔙', payload: { command: 'back' }, color: 'secondary' }).row()
                        .textButton({ label: '🎯💰', payload: { command: 'gold_custom_many' }, color: 'primary' })
                        .textButton({ label: '🎯🧙', payload: { command: 'xp_custom_many' }, color: 'primary' }).row()
                        .oneTime().inline(),
                        answerTimeLimit                                                                       
                    }
                )
                
                if (ans.isTimeout) { return await context.send(`⏰ Время ожидания выбора операции истекло!`) }
                if (ans.payload && ans.payload.command != 'back') {
                    if (ans.payload.command === 'gold_custom_many') {
                        await Gold_Custom_Many()
                    } else if (ans.payload.command === 'xp_custom_many') {
                        await Xp_Custom_Many()
                    }
                } else {
                    await context.send(`⚙ Операция отменена пользователем.`)
                }
                return // Завершаем обработчик
            }
            
            if (/(?:^|\s)(\d+)(?=\s|$)/g.test(uid.text)) {
                uids = uid.text.match(/(?:^|\s)(\d+)(?=\s|$)/g).map((u: string) => Number(u.trim()))
                await context.send(`⚙ Подготовка к массовым операциям, товарищ ДОК!`)
                name_check = true
            } else {
                if (uid.text == "🚫Отмена") { 
                    await context.send(`💡 Операции прерваны пользователем!`) 
                    return await Keyboard_Index(context, `💡 Как насчет еще одной операции? Может, позвать доктора?`)
                }
                await context.send(`💡 Необходимо ввести корректные UID или 0 для разных сумм!`)
            }
        }

        // Обычный процесс для стандартных операций
        const ans: any = await context.question( `✉ Доступны следующие операции с 💳UID: ${JSON.stringify(uids)}`,
            {   
                keyboard: Keyboard.builder()
                .textButton({ label: '🔙', payload: { command: 'back' }, color: 'secondary' }).row()
                .textButton({ label: '+💰', payload: { command: 'gold_up_many' }, color: 'secondary' })
                .textButton({ label: '—💰', payload: { command: 'gold_down_many' }, color: 'secondary' }).row()
                .textButton({ label: '+🧙', payload: { command: 'xp_up_many' }, color: 'secondary' })
                .textButton({ label: '—🧙', payload: { command: 'xp_down_many' }, color: 'secondary' }).row()
                .textButton({ label: '+💰🧙', payload: { command: 'multi_up_many' }, color: 'secondary' })
                .textButton({ label: '—💰🧙', payload: { command: 'multi_down_many' }, color: 'secondary' }).row()
                .textButton({ label: '🎯💰', payload: { command: 'gold_custom_many' }, color: 'primary' })
                .textButton({ label: '🎯🧙', payload: { command: 'xp_custom_many' }, color: 'primary' }).row()
                .textButton({ label: '☠💀', payload: { command: 'multi_user_delete_many' }, color: 'negative' }).row()
                .oneTime().inline(),
                answerTimeLimit                                                                       
            }
        )
        if (ans.isTimeout) { return await context.send(`⏰ Время ожидания на ввод операции с 💳UID: ${JSON.stringify(uids)} истекло!`) }
        if (ans.payload && ans.payload.command != 'back') {
            const config: any = {
                'gold_up_many': Gold_Up_Many,
                'gold_down_many': Gold_Down_Many,
                'xp_up_many': Xp_Up_Many,
                'xp_down_many': Xp_Down_Many,
                'back': Back,
                'multi_up_many': Multi_Up_Many,
                'multi_down_many': Multi_Down_Many,
                'multi_user_delete_many': Multi_User_Delete_Many,
                'gold_custom_many': Gold_Custom_Many,
                'xp_custom_many': Xp_Custom_Many
            }
            const answergot = await config[ans.payload.command](uids)
            if (answergot === false) {
                await Keyboard_Index(context, `💡 Как насчет еще одной операции? Может, позвать доктора?`)
                return
            }
            
        } else {
            await context.send(`⚙ Операция отменена пользователем.`)
            await Keyboard_Index(context, `💡 Как насчет еще одной операции? Может, позвать доктора?`)
            return
        }
        await context.send(`✅ Процедура массовых операций под названием операция "Ы" успешно завершена!`)
        await Keyboard_Index(context, `💡 Как насчет еще одной операции? Может, позвать доктора?`)

        // УНИВЕРСАЛЬНАЯ ФУНКЦИЯ ДЛЯ ГАЛЛЕОНОВ (без проверки на uids)
        async function Gold_Custom_Many(uids?: number[]) {
            const messa = await Ipnut_Message(context, 'массовых операций с галлеонами')
            if (messa === null) { return false }
            
            const users_target = await context.question(`📊 Введите список UID и операций в формате:\nUID1+СУММА1\nUID2-СУММА2\nUID3+СУММА3\n...\n\nПример:\n5+3402\n6-23\n7+53\n44-100`, 
                { answerTimeLimit }
            )
            
            if (Question_Is_Cancel(users_target)) { return false }
            if (users_target.isTimeout) {
                await context.send(`⏰ Время ожидания ввода данных истекло!`)
                return false
            }
            
            // Проверка на null
            if (!users_target.text) {
                await context.send(`❌ Не получен текст для обработки. Операция отменена.`);
                return false
            }

            const lines = users_target.text.split('\n').map((line: string) => line.trim());
            const uid_res: Array<{ id: number, amount: number, operation: string }> = []

            for (const line of lines) {
                if (!line.includes('+') && !line.includes('-')) {
                    await context.send(`⚠ Неверный формат: ${line} - нет операции (+ или -)`);
                    continue;
                }

                // Определяем операцию и разделяем строку
                let operation = '';
                let parts: string[] = [];
                
                if (line.includes('+')) {
                    operation = '+';
                    parts = line.split('+');
                } else if (line.includes('-')) {
                    operation = '-';
                    parts = line.split('-');
                }

                if (parts.length !== 2) {
                    await context.send(`⚠ Неверный формат: ${line}`);
                    continue;
                }

                const uidStr = parts[0].trim();
                const amountStr = parts[1].trim();
                const uid = parseInt(uidStr);
                const amount = parseFloat(amountStr);

                if (isNaN(uid) || isNaN(amount)) {
                    await context.send(`⚠ Неверный формат: ${line}`);
                    continue;
                }

                // УДАЛЕНА проверка на uids.includes(uid) - для кастомных операций не нужна

                const user = await prisma.user.findFirst({ where: { id: uid } });
                if (!user) {
                    await context.send(`❌ Пользователь с UID ${uid} не найден.`);
                    continue;
                }

                uid_res.push({ id: uid, amount: amount, operation: operation });
            }

            if (uid_res.length === 0) {
                return await context.send(`❌ Не удалось обработать ни одной записи. Операция отменена.`);
            }

            // Остальной код без изменений...
            for (const ui of uid_res) {
                const user_get: any = await prisma.user.findFirst({ where: { id: ui.id } })
                if (!user_get) { 
                    await context.send(`⛔ Банковская карточка с 💳UID ${ui.id} не найдена`); 
                    continue 
                }
                
                let new_balance = 0;
                let operation_text = '';
                
                if (ui.operation === '+') {
                    // НАЧИСЛЕНИЕ
                    new_balance = user_get.gold + ui.amount;
                    operation_text = `+${ui.amount}💰`;
                } else {
                    // СНЯТИЕ - проверяем баланс
                    if (user_get.gold - ui.amount >= 0) {
                        new_balance = user_get.gold - ui.amount;
                        operation_text = `-${ui.amount}💰`;
                    } else {
                        // Запрашиваем подтверждение для отрицательного баланса
                        const confirmq = await context.question(`⚠ Недостаточно средств! UID ${ui.id} (${user_get.name}): ${user_get.gold}💰 ${ui.operation}${ui.amount}💰 = ${user_get.gold - ui.amount}💰\nПродолжить снятие?`,
                            {
                                keyboard: Keyboard.builder()
                                .textButton({ label: 'Да', payload: { command: 'confirm' }, color: 'secondary' })
                                .textButton({ label: 'Нет', payload: { command: 'cancel' }, color: 'secondary' })
                                .oneTime().inline(),
                                answerTimeLimit
                            }
                        )
                        
                        if (confirmq.isTimeout) { 
                            await context.send(`⏰ Время ожидания подтверждения истекло! Пропускаем UID ${ui.id}`)
                            continue
                        }
                        
                        if (confirmq.payload?.command === 'confirm') {
                            new_balance = user_get.gold - ui.amount;
                            operation_text = `-${ui.amount}💰`;
                        } else {
                            await context.send(`❌ Операция для UID ${ui.id} отменена`)
                            continue
                        }
                    }
                }
                
                // Выполняем операцию
                const money_put = await prisma.user.update({ 
                    where: { id: user_get.id }, 
                    data: { gold: new_balance } 
                })
                
                try {
                    const operation_message = ui.operation === '+' 
                        ? `⚙ Вам начислено ${ui.amount}💰. \nВаш счёт: ${money_put.gold}💰 \nУведомление: ${messa}`
                        : `⚙ С вас снято ${ui.amount}💰. \nВаш счёт: ${money_put.gold}💰 \nУведомление: ${messa}`;
                        
                    await vk.api.messages.send({
                        user_id: user_get.idvk,
                        random_id: 0,
                        message: operation_message
                    })
                    await context.send(`✅ Успешная операция для UID ${ui.id}: ${operation_text}`)
                } catch (error) {
                    console.log(`User ${user_get.idvk} blocked chating with bank`)
                    await context.send(`⚙ Операция с 💳UID ${ui.id} завершена, но уведомление не доставлено пользователю!`)
                }
                
                const log_message = ui.operation === '+'
                    ? `🎯 @id${context.senderId}(Admin) > "+💰" > ${user_get.gold}💰+${ui.amount}💰=${money_put.gold}💰 для @id${user_get.idvk}(${user_get.name}) 🧷: ${messa}`
                    : `🎯 @id${context.senderId}(Admin) > "-💰" > ${user_get.gold}💰-${ui.amount}💰=${money_put.gold}💰 для @id${user_get.idvk}(${user_get.name}) 🧷: ${messa}`;
                    
                await vk.api.messages.send({
                    peer_id: chat_id,
                    random_id: 0,
                    message: log_message
                })
                
                console.log(`User ${user_get.idvk} ${ui.operation === '+' ? 'got' : 'lost'} ${ui.amount} gold. Him/Her bank now ${money_put.gold}`)
            }
            return true
        }

        // УНИВЕРСАЛЬНАЯ ФУНКЦИЯ ДЛЯ МАГИЧЕСКОГО ОПЫТА (без проверки на uids)
        async function Xp_Custom_Many(uids?: number[]) {
            const messa = await Ipnut_Message(context, 'массовых операций с магическим опытом')
            if (messa === null) { return false }
            
            const users_target = await context.question(`📊 Введите список UID и операций в формате:\nUID1+СУММА1\nUID2-СУММА2\nUID3+СУММА3\n...\n\nПример:\n5+340\n6-23\n7+53\n44-100`, 
                { answerTimeLimit }
            )
            
            if (Question_Is_Cancel(users_target)) { return false }
            if (users_target.isTimeout) {
                await context.send(`⏰ Время ожидания ввода данных истекло!`)
                return false
            }
            
            // Проверка на null
            if (!users_target.text) {
                await context.send(`❌ Не получен текст для обработки. Операция отменена.`);
                return false
            }

            const lines = users_target.text.split('\n').map((line: string) => line.trim());
            const uid_res: Array<{ id: number, amount: number, operation: string }> = []

            for (const line of lines) {
                if (!line.includes('+') && !line.includes('-')) {
                    await context.send(`⚠ Неверный формат: ${line} — нет операции (+ или -)`);
                    continue;
                }

                // Определяем операцию и разделяем строку
                let operation = '';
                let parts: string[] = [];
                
                if (line.includes('+')) {
                    operation = '+';
                    parts = line.split('+');
                } else if (line.includes('-')) {
                    operation = '-';
                    parts = line.split('-');
                }

                if (parts.length !== 2) {
                    await context.send(`⚠ Неверный формат: ${line}`);
                    continue;
                }

                const uidStr = parts[0].trim();
                const amountStr = parts[1].trim();
                const uid = parseInt(uidStr);
                const amount = parseFloat(amountStr);

                if (isNaN(uid) || isNaN(amount)) {
                    await context.send(`⚠ Неверный формат: ${line}`);
                    continue;
                }

                // УДАЛЕНА проверка на uids.includes(uid) - для кастомных операций не нужна

                const user = await prisma.user.findFirst({ where: { id: uid } });
                if (!user) {
                    await context.send(`❌ Пользователь с UID ${uid} не найден.`);
                    continue;
                }

                uid_res.push({ id: uid, amount: amount, operation: operation });
            }

            if (uid_res.length === 0) {
                return await context.send(`❌ Не удалось обработать ни одной записи. Операция отменена.`);
            }

            // Остальной код без изменений...
            for (const ui of uid_res) {
                const user_get: any = await prisma.user.findFirst({ where: { id: ui.id } })
                if (!user_get) { 
                    await context.send(`⛔ Банковская карточка с 💳UID ${ui.id} не найдена`); 
                    continue 
                }
                
                let new_balance = 0;
                let operation_text = '';
                
                if (ui.operation === '+') {
                    new_balance = user_get.xp + ui.amount;
                    operation_text = `+${ui.amount}🧙`;
                } else {
                    new_balance = user_get.xp - ui.amount;
                    operation_text = `-${ui.amount}🧙`;
                }
                
                // Выполняем операцию
                const money_put = await prisma.user.update({ 
                    where: { id: user_get.id }, 
                    data: { xp: new_balance } 
                })
                
                try {
                    const operation_message = ui.operation === '+' 
                        ? `⚙ Вам начислено ${ui.amount}🧙. \nВаш МО: ${money_put.xp}🧙 \nУведомление: ${messa}`
                        : `⚙ С вас снято ${ui.amount}🧙. \nВаш МО: ${money_put.xp}🧙 \nУведомление: ${messa}`;
                        
                    await vk.api.messages.send({
                        user_id: user_get.idvk,
                        random_id: 0,
                        message: operation_message
                    })
                    await context.send(`✅ Успешная операция для UID ${ui.id}: ${operation_text}`)
                } catch (error) {
                    console.log(`User ${user_get.idvk} blocked chating with bank`)
                    await context.send(`⚙ Операция с 💳UID ${ui.id} завершена, но уведомление не доставлено пользователю!`)
                }
                
                const log_message = ui.operation === '+'
                    ? `🎯 @id${context.senderId}(Admin) > "+🧙" > ${user_get.xp}🧙+${ui.amount}🧙=${money_put.xp}🧙 для @id${user_get.idvk}(${user_get.name}) 🧷: ${messa}`
                    : `🎯 @id${context.senderId}(Admin) > "-🧙" > ${user_get.xp}🧙-${ui.amount}🧙=${money_put.xp}🧙 для @id${user_get.idvk}(${user_get.name}) 🧷: ${messa}`;
                    
                await vk.api.messages.send({
                    peer_id: chat_id,
                    random_id: 0,
                    message: log_message
                })
                
                console.log(`User ${user_get.idvk} ${ui.operation === '+' ? 'got' : 'lost'} ${ui.amount} MO. Him/Her XP now ${money_put.xp}`)
            }
            return true
        }

        //Модуль мульти уничтожения персонажа
        async function Multi_User_Delete_Many(uids: number[]) {
            for (const ids of uids) {
                const id = Number(ids)
                const user_get: any = await prisma.user.findFirst({ where: { id: id } })
                if (!user_get) { await context.send(`⛔ Банковская карточка с 💳UID ${id} не найдена`); continue }
                const confirmq = await context.question(`⁉ Вы уверены, что хотите удалить клиента ${user_get.name}`,
                    {
                        keyboard: Keyboard.builder()
                        .textButton({ label: 'Да', payload: { command: 'confirm' }, color: 'secondary' })
                        .textButton({ label: 'Нет', payload: { command: 'gold_down' }, color: 'secondary' })
                        .oneTime().inline(),
                        answerTimeLimit
                    }
                )
                if (confirmq.isTimeout) { return await context.send(`⏰ Время ожидания на подтверждение удаления ${user_get.name} истекло!`) }
                if (confirmq.payload.command === 'confirm' && user_get) {
                    if (user_get) {
                        const user_del = await prisma.user.delete({ where: { id: id } })
                        await context.send(`❗ Удален пользователь ${user_del.name}`)
                        if (user_del) {
                            const check_bbox = await prisma.blackBox.findFirst({ where: { idvk: user_del.idvk } })
                            if (!check_bbox) {
                                const add_bbox = await prisma.blackBox.create({ data: { idvk: user_del.idvk } })
                                add_bbox ? await context.send(`⚙ @id${user_del.idvk}(${user_del.name}) теперь является нелегалом.`) : await context.send(`⚙ @id${user_del.idvk}(${user_del.name}) не смог стать нелегалом.`)
                            } else {
                                await context.send(`⚙ @id${user_del.idvk}(${user_del.name}) депортируется НА РОДИНУ уже не в первый раз.`)
                            }
                            try {
                                await vk.api.messages.send({
                                    user_id: user_del.idvk,
                                    random_id: 0,
                                    message: `❗ Ваша карточка 💳UID: ${user_del.id} больше не действительна. Спасибо, что пользовались банком Гринготтс 🏦, ${user_del.name}. Возвращайтесь к нам снова!`
                                })
                                await context.send(`⚙ Операция удаления пользователя завершена успешно.`)
                            } catch (error) {
                                console.log(`User ${user_del.idvk} blocked chating with bank`)
                            }
                            await vk.api.messages.send({
                                peer_id: chat_id,
                                random_id: 0,
                                message: `⚙ @id${context.senderId}(Admin) > "🚫👤" > удаляется из банковской системы карточка @id${user_del.idvk}(${user_del.name})`
                            })
                        }
                        console.log(`Admin ${context.senderId} deleted user: ${user_del.idvk}`)
                    } 
                } else {
                    await context.send(`⚙ Удаление ${user_get.name} отменено.`)
                }
            }
        }
        //Модуль мульти начислений
        async function Multi_Up_Many(uids: number[]) {
            await context.send(`⚠ Приступаем к начислению галлеонов`)
            const gold = await Ipnut_Gold(context, ans.text)
            if (gold === null) { return false }
            await context.send(`⚠ Приступаем к начислению магического опыта`)
            const xp = await Ipnut_Gold(context, ans.text)
            if (xp === null) { return false }
            const messa = await Ipnut_Message(context, ans.text)
            if (messa === null) { return false }
            for (const ids of uids) {
                const id = Number(ids)
                const user_get: User | null = await prisma.user.findFirst({ where: { id } })
                if (!user_get) { await context.send(`⛔ Банковская карточка с 💳UID ${id} не найдена`); continue }
                const money_put = await prisma.user.update({ where: { id: user_get?.id }, data: { gold: { increment: gold }, xp: { increment: xp } } })
                try {
                    await vk.api.messages.send({
                        user_id: user_get?.idvk,
                        random_id: 0,
                        message: `⚙ Вам начислено ${gold}💰 ${xp}🧙. \n\nВаш счёт:\n${money_put.gold}💰\n${money_put.xp}🧙\n\nУведомление: ${messa}`
                    })
                    await context.send(`⚙ Операция с 💳UID ${id} завершена успешно`)
                } catch (error) {
                    console.log(`User ${user_get?.idvk} blocked chating with bank`)
                    await context.send(`⚙ Операция с 💳UID ${id} завершена, но уведомление не доставлено пользователю!`)
                }
                await vk.api.messages.send({
                    peer_id: chat_id,
                    random_id: 0,
                    message: `🗿 @id${context.senderId}(Admin) > "+💰🧙" >\n${user_get?.gold}+${gold}=${money_put.gold}💰\n${user_get?.xp}+${xp}=${money_put.xp}🧙\n для @id${user_get?.idvk}(${user_get?.name}) 🧷: ${messa}`
                })
                console.log(`User ${user_get?.idvk} got ${gold} gold and ${xp} xp. Him/Her bank now ${money_put.gold}`)
            }
            return true
        }
        async function Multi_Down_Many(uids: number[]) {
            await context.send(`⚠ Приступаем к снятию галлеонов`)
            const gold = await Ipnut_Gold(context, ans.text)
            if (gold === null) { return false }
            await context.send(`⚠ Приступаем к снятию магического опыта`)
            const xp = await Ipnut_Gold(context, ans.text)
            if (xp === null) { return false }
            const messa = await Ipnut_Message(context, ans.text)
            if (messa === null) { return false }
            for (const ids of uids) {
                const id = Number(ids)
                const user_get: User | null = await prisma.user.findFirst({ where: { id } })
                if (!user_get) { await context.send(`⛔ Банковская карточка с 💳UID ${id} не найдена`); continue }
                const money_put = await prisma.user.update({ where: { id: user_get?.id }, data: { gold: { decrement: gold }, xp: { decrement: xp } } })
                try {
                    await vk.api.messages.send({
                        user_id: user_get?.idvk,
                        random_id: 0,
                        message: `⚙ С вас снято ${gold}💰 ${xp}🧙. \n\nВаш счёт:\n${money_put.gold}💰\n${money_put.xp}🧙\n\nУведомление: ${messa}`
                    })
                    await context.send(`⚙ Операция с 💳UID ${id} завершена успешно`)
                } catch (error) {
                    console.log(`User ${user_get?.idvk} blocked chating with bank`)
                    await context.send(`⚙ Операция с 💳UID ${id} завершена, но уведомление не доставлено пользователю!`)
                }
                await vk.api.messages.send({
                    peer_id: chat_id,
                    random_id: 0,
                    message: `🗿 @id${context.senderId}(Admin) > "-💰🧙" >\n${user_get?.gold}-${gold}=${money_put.gold}💰\n${user_get?.xp}-${xp}=${money_put.xp}🧙\n для @id${user_get?.idvk}(${user_get?.name}) 🧷: ${messa}`
                })
                console.log(`User ${user_get?.idvk} left ${gold} gold and ${xp} xp. Him/Her bank now ${money_put.gold}`)
            }
            return true
        }
        //Модуль начислений
        async function Gold_Up_Many(uids: number[]) {
            const count = await Ipnut_Gold(context, ans.text)
            if (count === null) { return false }
            const messa = await Ipnut_Message(context, ans.text)
            if (messa === null) { return false }
            for (const ids of uids) {
                const id = Number(ids)
                const user_get: any = await prisma.user.findFirst({ where: { id } })
                if (!user_get) { await context.send(`⛔ Банковская карточка с 💳UID ${id} не найдена`); continue }
                const money_put = await prisma.user.update({ where: { id: user_get.id }, data: { gold: user_get.gold + count } })
                try {
                    await vk.api.messages.send({
                        user_id: user_get.idvk,
                        random_id: 0,
                        message: `⚙ Вам начислено ${count}💰. \nВаш счёт: ${money_put.gold}💰 \nУведомление: ${messa}`
                    })
                    await context.send(`⚙ Операция с 💳UID ${id} завершена успешно`)
                } catch (error) {
                    console.log(`User ${user_get.idvk} blocked chating with bank`)
                    await context.send(`⚙ Операция с 💳UID ${id} завершена, но уведомление не доставлено пользователю!`)
                }
                await vk.api.messages.send({
                    peer_id: chat_id,
                    random_id: 0,
                    message: `🗿 @id${context.senderId}(Admin) > "+💰" > ${money_put.gold-count}💰+${count}💰=${money_put.gold}💰 для @id${user_get.idvk}(${user_get.name}) 🧷: ${messa}`
                })
                console.log(`User ${user_get.idvk} got ${count} gold. Him/Her bank now ${money_put.gold}`)
            }
            return true
        }
        async function Gold_Down_Many(uids: number[]) {
            const count = await Ipnut_Gold(context, ans.text)
            if (count === null) { return false }
            const messa = await Ipnut_Message(context, ans.text)
            if (messa === null) { return false }
            for (const ids of uids) {
                const id = Number(ids)
                const user_get: any = await prisma.user.findFirst({ where: { id } })
                if (!user_get) { await context.send(`⛔ Банковская карточка с 💳UID ${id} не найдена`); continue }
                if (user_get.gold-count >= 0) {
                    const money_put = await prisma.user.update({ where: { id: user_get.id }, data: { gold: user_get.gold - count } })
                    try {
                        await vk.api.messages.send({
                            user_id: user_get.idvk,
                            random_id: 0,
                            message: `⚙ С вас снято ${count}💰. \nВаш счёт: ${money_put.gold}💰 \nУведомление: ${messa}`
                        })
                        await context.send(`⚙ Операция с 💳UID ${id} завершена успешно`)
                    } catch (error) {
                        console.log(`User ${user_get.idvk} blocked chating with bank`)
                        await context.send(`⚙ Операция с 💳UID ${id} завершена, но уведомление не доставлено пользователю!`)
                    }
                    await vk.api.messages.send({
                        peer_id: chat_id,
                        random_id: 0,
                        message: `🗿 @id${context.senderId}(Admin) > "-💰" > ${money_put.gold+count}💰-${count}💰=${money_put.gold}💰 для @id${user_get.idvk}(${user_get.name}) 🧷: ${messa}`
                    })
                    console.log(`User ${user_get.idvk} lost ${count} gold. Him/Her bank now ${money_put.gold}`)
                } else {
                    const confirmq = await context.question(`⌛ Вы хотите снять ${count} 💰галлеонов c счета ${user_get.name}, но счет этого ${user_get.spec} ${user_get.gold}. Уверены, что хотите сделать баланс: ${user_get.gold-count}`,
                        {
                            keyboard: Keyboard.builder()
                            .textButton({ label: 'Да', payload: { command: 'confirm' }, color: 'secondary' })
                            .textButton({ label: 'Нет', payload: { command: 'gold_down' }, color: 'secondary' })
                            .oneTime().inline(),
                            answerTimeLimit
                        }
                    )
                    if (confirmq.isTimeout) {
                        await context.send(`⏰ Время ожидания на снятие галлеонов с ${user_get.name} истекло!`)
                        return false
                    }
                    if (confirmq.payload.command === 'confirm') {
                        const money_put = await prisma.user.update({ where: { id: user_get.id }, data: { gold: user_get.gold - count } })
                        try {
                            await vk.api.messages.send({
                                user_id: user_get.idvk, random_id: 0,
                                message: `⚙ С вас снято ${count}💰. \nВаш счёт: ${money_put.gold}💰 \nУведомление: ${messa}`
                            })
                            await context.send(`⚙ Операция завершена успешно`)
                        } catch (error) {
                            console.log(`User ${user_get.idvk} blocked chating with bank`)
                            await context.send(`⚙ Операция с 💳UID ${id} завершена, но уведомление не доставлено пользователю!`)
                        }
                        await vk.api.messages.send({
                            peer_id: chat_id,
                            random_id: 0,
                            message: `🗿 @id${context.senderId}(Admin) > "-💰" > ${money_put.gold+count}💰-${count}💰=${money_put.gold}💰 для @id${user_get.idvk}(${user_get.name}) 🧷: ${messa}`
                        })
                        console.log(`User ${user_get.idvk} lost ${count} gold. Him/Her bank now ${money_put.gold}`)
                    } else {
                        await context.send(`💡 Нужно быть жестче! Греби бабло`)
                    }
                }
            }
            return true
        }
        async function Xp_Up_Many(uids: number[]) {
            const count = await Ipnut_Gold(context, ans.text)
            if (count === null) { return false }
            const messa = await Ipnut_Message(context, ans.text)
            if (messa === null) { return false }
            for (const ids of uids) {
                const id = Number(ids)
                const user_get: any = await prisma.user.findFirst({ where: { id } })
                if (!user_get) { await context.send(`⛔ Банковская карточка с 💳UID ${id} не найдена`); continue }
                const money_put = await prisma.user.update({ where: { id: user_get.id }, data: { xp: user_get.xp + count } })
                try {
                    await vk.api.messages.send({
                        user_id: user_get.idvk,
                        random_id: 0,
                        message: `⚙ Вам начислено ${count}🧙. \nВаш МО: ${money_put.xp}🧙 \nУведомление: ${messa}`
                    })
                    await context.send(`⚙ Операция с 💳UID ${id} завершена успешно`)
                } catch (error) {
                    console.log(`User ${user_get.idvk} blocked chating with bank`)
                    await context.send(`⚙ Операция с 💳UID ${id} завершена, но уведомление не доставлено пользователю!`)
                }
                await vk.api.messages.send({
                    peer_id: chat_id,
                    random_id: 0,
                    message: `🗿 @id${context.senderId}(Admin) > "+🧙" > ${money_put.xp-count}🧙+${count}🧙=${money_put.xp}🧙 для @id${user_get.idvk}(${user_get.name}) 🧷: ${messa}`
                })
                console.log(`User ${user_get.idvk} got ${count} MO. Him/Her XP now ${money_put.xp}`)
            }
            return true
        }
        async function Xp_Down_Many(uids: number[]) {
            const count = await Ipnut_Gold(context, ans.text)
            if (count === null) { return false }
            if (count === 0) { return false }
            const messa = await Ipnut_Message(context, ans.text)
            if (messa === null) { return false }
            for (const ids of uids) {
                const id = Number(ids)
                const user_get: any = await prisma.user.findFirst({ where: { id } })
                if (!user_get) { await context.send(`⛔ Банковская карточка с 💳UID ${id} не найдена`); continue }
                if (user_get.xp-count >= 0) {
                    const money_put = await prisma.user.update({ where: { id: user_get.id }, data: { xp: user_get.xp - count } })
                    try {
                        await vk.api.messages.send({
                            user_id: user_get.idvk,
                            random_id: 0,
                            message: `⚙ С вас снято ${count}🧙. \nВаш МО: ${money_put.xp}🧙  \nУведомление: ${messa}`
                        })
                        await context.send(`⚙ Операция с 💳UID ${id} завершена успешно`)
                    } catch (error) {
                        console.log(`User ${user_get.idvk} blocked chating with bank`)
                        await context.send(`⚙ Операция с 💳UID ${id} завершена, но уведомление не доставлено пользователю!`)
                    }
                    await vk.api.messages.send({
                        peer_id: chat_id,
                        random_id: 0,
                        message: `🗿 @id${context.senderId}(Admin) > "-🧙" > ${money_put.xp+count}🧙-${count}🧙=${money_put.xp}🧙 для @id${user_get.idvk}(${user_get.name}) 🧷: ${messa}`
                    })
                    console.log(`User ${user_get.idvk} lost ${count} MO. Him/Her XP now ${money_put.xp}`)
                } else {
                    await context.send(`⌛ Вы хотите снять ${count} 🧙магического опыта c счета ${user_get.name}, но счет этого ${user_get.spec} ${user_get.xp}. Уверены, что хотите сделать баланс: ${user_get.xp-count}? (Автоподтверждение)`)
                    const money_put = await prisma.user.update({ where: { id: user_get.id }, data: { xp: user_get.xp - count } })
                    try {
                        await vk.api.messages.send({
                            user_id: user_get.idvk,
                            random_id: 0,
                            message: `⚙ С вас снято ${count}🧙. \nВаш МО: ${money_put.xp}🧙  \nУведомление: ${messa}`
                        })
                        await context.send(`⚙ Операция завершена успешно`)
                    } catch (error) {
                        console.log(`User ${user_get.idvk} blocked chating with bank`)
                        await context.send(`⚙ Операция с 💳UID ${id} завершена, но уведомление не доставлено пользователю!`)
                    }
                    await vk.api.messages.send({
                        peer_id: chat_id,
                        random_id: 0,
                        message: `🗿 @id${context.senderId}(Admin) > "-🧙" > ${money_put.xp+count}🧙-${count}🧙=${money_put.xp}🧙 для @id${user_get.idvk}(${user_get.name}) 🧷: ${messa}`
                    })
                    console.log(`User ${user_get.idvk} lost ${count} MO. Him/Her XP now ${money_put.xp}`)
                }
            }
            return true
        }
        //Модуль вовзврата
        async function Back(id: number, count: number) {
            console.log(`Admin ${context.senderId} canceled operation for user UID: ${id}`)
            await context.send(`⚙ Операция отменена пользователем.`)
        }
    })

    hearManager.hear(/!опсоло/, async (context) => {
        if (await Accessed(context) != 2) {
            return
        }
        let name_check = false
		let datas: any = []
		while (name_check == false) {
			const uid: any = await context.question( `🧷 Введите 💳UID банковского счета получателя:`,
                {   
                    keyboard: Keyboard.builder()
                    .textButton({ label: '🚫Отмена', payload: { command: 'limited' }, color: 'secondary' })
                    .oneTime().inline(),
                    timer_text
                }
            )
            if (uid.isTimeout) { return await context.send('⏰ Время ожидания на ввод банковского счета получателя истекло!')}
			if (/^(0|-?[1-9]\d{0,5})$/.test(uid.text)) {
                const get_user = await prisma.user.findFirst({ where: { id: Number(uid.text) } })
                if (get_user) {
                    console.log(`Admin ${context.senderId} opened ${get_user.idvk} card UID: ${get_user.id}`)
                    name_check = true
				    datas.push({id: `${uid.text}`})
                    const artefact_counter = await prisma.artefact.count({
                        where: {
                            id_user: Number(uid.text)
                        }
                    })
                    await context.send(`🏦 Открыта следующая карточка: ${get_user.class} ${get_user.name}, ${get_user.spec}: \nhttps://vk.com/id${get_user.idvk} \n💳 UID: ${get_user.id} \n💰 Галлеоны: ${get_user.gold} \n🧙 Магический опыт: ${get_user.xp} \n📈 Уровень: ${get_user.lvl} \n🔮 Количество артефактов: ${artefact_counter}` )
                    const inventory = await prisma.inventory.findMany({ where: { id_user: get_user?.id } })
                    let cart = ''
                    const underwear = await prisma.trigger.count({ where: {    id_user: get_user.id, name:   'underwear', value:  false } })
                    if (underwear) { cart = '👜 Трусы Домашние;' }
                    if (inventory.length == 0) {
                        await context.send(`✉ Покупки пока не совершались`)
                    } else {
                        for (let i = 0; i < inventory.length; i++) {
                            const element = inventory[i].id_item;
                            const item = await prisma.item.findFirst({ where: { id: element } })
                            cart += `👜 ${item?.name};`
                        }
                        const destructor = cart.split(';').filter(i => i)
                        let compile = []
                        for (let i = 0; i < destructor.length; i++) {
                            let counter = 0
                            for (let j = 0; j < destructor.length; j++) {
                                if (destructor[i] != null) {
                                    if (destructor[i] == destructor[j]) {
                                        counter++
                                    }
                                }
                            }
                            compile.push(`${destructor[i]} x ${counter}\n`)
                            counter = 0
                        }
                        let final: any = Array.from(new Set(compile));
                        await context.send(`✉ Были совершены следующие покупки: \n${final.toString().replace(/,/g, '')}`)
                    }
                } else { await context.send(`💡 Нет такого банковского счета!`) }
			} else {
                if (uid.text == "🚫Отмена") { 
                    await context.send(`💡 Операции прерваны пользователем!`) 
                    return await Keyboard_Index(context, `💡 Как насчет еще одной операции? Может, позвать доктора?`)
                }
				await context.send(`💡 Необходимо ввести корректный UID!`)
			}
		}

        const ans: any = await context.question( `✉ Доступны следующие операции с 💳UID: ${datas[0].id}`,
            {   
                keyboard: Keyboard.builder()
                .textButton({ label: '+💰', payload: { command: 'gold_up' }, color: 'secondary' })
                .textButton({ label: '—💰', payload: { command: 'gold_down' }, color: 'secondary' }).row()
                .textButton({ label: '+🧙', payload: { command: 'xp_up' }, color: 'secondary' })
                .textButton({ label: '—🧙', payload: { command: 'xp_down' }, color: 'secondary' }).row()
                .textButton({ label: '+💰🧙', payload: { command: 'multi_up' }, color: 'secondary' })
                .textButton({ label: '—💰🧙', payload: { command: 'multi_down' }, color: 'secondary' }).row()
                .textButton({ label: '⚙', payload: { command: 'sub_menu' }, color: 'secondary' })
                .textButton({ label: '🔙', payload: { command: 'back' }, color: 'secondary' }).row()
                .oneTime().inline(),
                answerTimeLimit                                                                       
            }
        )
        console.log(`[diag !опсоло] operation_select text=${ans?.text} payload=${JSON.stringify(ans?.payload)} timeout=${ans?.isTimeout}`)
        if (ans.isTimeout) { return await context.send(`⏰ Время ожидания на ввод операции с 💳UID: ${datas[0].id} истекло!`) }
        if (ans.payload && ans.payload.command != 'back') {
            const config: any = {
                'gold_up': Gold_Up,
                'gold_down': Gold_Down,
                'xp_up': Xp_Up,
                'xp_down': Xp_Down,
                'back': Back,
                'sub_menu': Sub_Menu,
                'multi_up': Multi_Up,
                'multi_down': Multi_Down
            }
            const answergot = await config[ans.payload.command](Number(datas[0].id))
        } else {
            await context.send(`⚙ Операция отменена пользователем.`)
        }
        await Keyboard_Index(context, `💡 Как насчет еще одной операции? Может, позвать доктора?`)

        async function Editor(id: number) {
            const user: any = await prisma.user.findFirst({ where: { id: id } })
            
            let answer_check = false
            while (answer_check == false) {
                const answer1: any = await context.question(
                    `⌛ Переходим в режим редактирования данных для ${user.name}, выберите сие злодейство:`,
                    {
                        keyboard: Keyboard.builder()
                        .textButton({ label: '✏ Положение', payload: { command: 'edit_class' }, color: 'secondary' }).row()
                        .textButton({ label: '✏ Специализация', payload: { command: 'edit_spec' }, color: 'secondary' }).row()
                        .textButton({ label: '✏ ФИО', payload: { command: 'edit_name' }, color: 'secondary' }).row()
                        .textButton({ label: '🔙', payload: { command: 'back' }, color: 'secondary' })
                        .oneTime().inline(),
                        answerTimeLimit
                    }
                )
                
                if (answer1.isTimeout) { 
                    return await context.send(`⏰ Время ожидания на корректировку данных юзера истекло!`) 
                }
                
                // Проверка на отмену (возврат в предыдущее меню)
                if (answer1.text === '🔙' || answer1.payload?.command === 'back') {
                    return
                }
                
                if (!answer1.payload) {
                    await context.send(`💡 Пожалуйста, выберите действие с помощью кнопок!`)
                } else {
                    if (answer1.payload && answer1.payload.command != 'back') {
                        answer_check = true
                        const config: any = {
                            'edit_class': Edit_Class,
                            'edit_spec': Edit_Spec,
                            'edit_name': Edit_Name
                        }
                        await config[answer1.payload.command](id)
                        // После выполнения редактирования возвращаемся в меню редактора
                        answer_check = false // сбрасываем, чтобы показать меню снова
                    }
                }
            }
        }
        async function Edit_Name(id: number){
            const user: any = await prisma.user.findFirst({
                where: {
                    id: id
                }
            })
            
            const name: any = await context.question(
                `🧷 Укажите имя в Хогвартс Онлайн. Для ${user.name}. Введите новое имя до 64 символов:`,
                {
                    keyboard: Keyboard.builder()
                    .textButton({ label: '🔙', payload: { command: 'back' }, color: 'secondary' })
                    .oneTime().inline(),
                    timer_text
                }
            )
            
            if (name.isTimeout) { 
                return await context.send(`⏰ Время ожидания на изменение имени для ${user.name} истекло!`) 
            }
            
            // Проверка на отмену
            if (name.text === '🔙' || name.payload?.command === 'back') {
                await context.send(`⚙ Отмена изменения имени`)
                return
            }
            
            // Проверка длины имени
            if (name.text.length <= 64) {
                const update_name = await prisma.user.update({ 
                    where: { id: user.id }, 
                    data: { name: name.text } 
                })
                
                if (update_name) {
                    await context.send(`⚙ Для пользователя 💳UID которого ${user.id}, произведена смена имени с ${user.name} на ${update_name.name}.`)
                    try {
                        await vk.api.messages.send({
                            user_id: user.idvk,
                            random_id: 0,
                            message: `⚙ Ваше имя в Хогвартс Онлайн изменилось с ${user.name} на ${update_name.name}.`
                        })
                        await context.send(`⚙ Операция смены имени пользователя завершена успешно.`)
                    } catch (error) {
                        console.log(`User ${user.idvk} blocked chating with bank`)
                    }
                    await vk.api.messages.send({
                        peer_id: chat_id,
                        random_id: 0,
                        message: `⚙ @id${context.senderId}(Admin) > "✏👤ФИО" > имя изменилось с ${user.name} на ${update_name.name} для @id${user.idvk}(${user.name})`
                    })
                }
                
                if (name.text.length > 32) {
                    await context.send(`⚠ Новые инициалы не влезают на стандартный бланк (32 символа)! Придется использовать бланк повышенной ширины, с доплатой 1G за каждый не поместившийся символ.`)
                }
            } else {
                await context.send(`⛔ Новое ФИО не влезают на бланк повышенной ширины (64 символа), и вообще, запрещены магическим законодательством! Заставим его/ее выплатить штраф в 30G или с помощию ОМОНА переехать в Азкабан.`)
            }
        }
        async function Edit_Class(id: number){
            const user: any = await prisma.user.findFirst({ where: { id: id } })
            
            const answer1: any = await context.question(
                `🧷 Укажите положение в Хогвартс Онлайн для ${user.name}, имеющего текущий статус: ${user.class}.`,
                {
                    keyboard: Keyboard.builder()
                    .textButton({ label: 'Ученик', payload: { command: 'student' }, color: 'secondary' })
                    .textButton({ label: 'Профессор', payload: { command: 'professor' }, color: 'secondary' })
                    .textButton({ label: 'Житель', payload: { command: 'citizen' }, color: 'secondary' }).row()
                    .textButton({ label: '🔙', payload: { command: 'back' }, color: 'secondary' })
                    .oneTime().inline(),
                    answerTimeLimit
                }
            )
            
            if (answer1.isTimeout) { 
                return await context.send(`⏰ Время ожидания на изменение положения для ${user.name} истекло!`) 
            }
            
            // Проверка на отмену
            if (answer1.text === '🔙' || answer1.payload?.command === 'back') {
                await context.send(`⚙ Отмена изменения положения`)
                return
            }
            
            // Проверка, что нажали кнопку
            if (!answer1.payload) {
                await context.send(`💡 Пожалуйста, выберите положение с помощью кнопок!`)
                return
            }
            
            const update_class = await prisma.user.update({ 
                where: { id: user.id }, 
                data: { class: answer1.text } 
            })
            
            if (update_class) {
                await context.send(`⚙ Для пользователя 💳UID которого ${user.id}, произведена смена положения с ${user.class} на ${update_class.class}.`)
                try {
                    await vk.api.messages.send({
                        user_id: user.idvk,
                        random_id: 0,
                        message: `⚙ Ваше положение в Хогвартс Онлайн изменилось с ${user.class} на ${update_class.class}.`
                    })
                    await context.send(`⚙ Операция смены положения пользователя завершена успешно.`)
                } catch (error) {
                    console.log(`User ${user.idvk} blocked chating with bank`)
                }
                await vk.api.messages.send({
                    peer_id: chat_id,
                    random_id: 0,
                    message: `⚙ @id${context.senderId}(Admin) > "✏👤Положение" > положение изменилось с ${user.class} на ${update_class.class} для @id${user.idvk}(${user.name})`
                })
            }
        }
        async function Edit_Spec(id: number){
            const user: any = await prisma.user.findFirst({ where: { id: id } })
            
            // Проверяем, является ли пользователь студентом
            if (user.class === 'Ученик') {
                // Для студентов показываем кнопки с факультетами
                const spec: any = await context.question(
                    `🧷 Укажите специализацию в Хогвартс Онлайн. Для ${user.name}.\nТекущая специализация: ${user.spec}\nВыберите новый факультет:`,
                    {
                        keyboard: Keyboard.builder()
                        .textButton({ label: 'Гриффиндор', payload: { command: 'gryffindor' }, color: 'secondary' })
                        .textButton({ label: 'Когтевран', payload: { command: 'ravenclaw' }, color: 'secondary' }).row()
                        .textButton({ label: 'Пуффендуй', payload: { command: 'hufflepuff' }, color: 'secondary' })
                        .textButton({ label: 'Слизерин', payload: { command: 'slytherin' }, color: 'secondary' }).row()
                        .textButton({ label: '🔙', payload: { command: 'back' }, color: 'secondary' }).row()
                        .oneTime().inline(),
                        timer_text
                    }
                )
                
                if (spec.isTimeout) { 
                    return await context.send(`⏰ Время ожидания на изменение специализации для ${user.name} истекло!`) 
                }
                
                // Проверка на отмену
                if (spec.text === '🔙' || spec.payload?.command === 'back') {
                    await context.send(`⚙ Отмена изменения специализации`)
                    return
                }
                
                if (spec.payload) {
                    // Преобразуем command в читаемое название
                    const facultyNames: any = {
                        'gryffindor': 'Гриффиндор',
                        'ravenclaw': 'Когтевран',
                        'hufflepuff': 'Пуффендуй',
                        'slytherin': 'Слизерин'
                    }
                    
                    const newSpec = facultyNames[spec.payload.command] || spec.text
                    
                    const update_spec = await prisma.user.update({ 
                        where: { id: user.id }, 
                        data: { spec: newSpec } 
                    })
                    
                    if (update_spec) {
                        await context.send(`⚙ Для пользователя 💳UID которого ${user.id}, произведена смена специализации с ${user.spec} на ${update_spec.spec}.`)
                        try {
                            await vk.api.messages.send({
                                user_id: user.idvk,
                                random_id: 0,
                                message: `⚙ Ваша специализация в Хогвартс Онлайн изменилась с ${user.spec} на ${update_spec.spec}.`
                            })
                            await context.send(`⚙ Операция смены специализации пользователя завершена успешно.`)
                        } catch (error) {
                            console.log(`User ${user.idvk} blocked chating with bank`)
                        }
                        await vk.api.messages.send({
                            peer_id: chat_id,
                            random_id: 0,
                            message: `⚙ @id${context.senderId}(Admin) > "✏👤Специализация" > специализация изменилась с ${user.spec} на ${update_spec.spec} для @id${user.idvk}(${user.name})`
                        })
                    }
                } else {
                    await context.send(`💡 Пожалуйста, выберите факультет с помощью кнопок!`)
                }
            } else {
                const spec: any = await context.question(
                    `🧷 Укажите специализацию в Хогвартс Онлайн. Для ${user.name}.\nТекущая специализация: ${user.spec}\nВведите новую должность:`,
                    {
                        keyboard: Keyboard.builder()
                        .textButton({ label: '🔙', payload: { command: 'back' }, color: 'secondary' })
                        .oneTime().inline(),
                        timer_text
                    }
                )
                
                if (spec.isTimeout) { 
                    return await context.send(`⏰ Время ожидания на изменение специализации для ${user.name} истекло!`) 
                }
                
                // Проверка на отмену
                if (spec.text === '🔙' || spec.payload?.command === 'back') {
                    await context.send(`⚙ Отмена изменения специализации`)
                    return
                }
                
                if (spec.text && spec.text.length <= 32) {
                    const update_spec = await prisma.user.update({ 
                        where: { id: user.id }, 
                        data: { spec: spec.text } 
                    })
                    
                    if (update_spec) {
                        await context.send(`⚙ Для пользователя 💳UID которого ${user.id}, произведена смена специализации с ${user.spec} на ${update_spec.spec}.`)
                        try {
                            await vk.api.messages.send({
                                user_id: user.idvk,
                                random_id: 0,
                                message: `⚙ Ваша специализация в Хогвартс Онлайн изменилась с ${user.spec} на ${update_spec.spec}.`
                            })
                            await context.send(`⚙ Операция смены специализации пользователя завершена успешно.`)
                        } catch (error) {
                            console.log(`User ${user.idvk} blocked chating with bank`)
                        }
                        await vk.api.messages.send({
                            peer_id: chat_id,
                            random_id: 0,
                            message: `⚙ @id${context.senderId}(Admin) > "✏👤Специализация" > специализация изменилась с ${user.spec} на ${update_spec.spec} для @id${user.idvk}(${user.name})`
                        })
                    }
                } else {
                    await context.send(`💡 Введите до 32 символов включительно!`)
                }
            }
        }
        //Модуль уничтожения персонажа
        async function User_delete(id: number) {
            const user_get: any = await prisma.user.findFirst({ where: { id: id } })
            const confirmq = await context.question(`⁉ Вы уверены, что хотите удалить клиента ${user_get.name}`,
                {
                    keyboard: Keyboard.builder()
                    .textButton({ label: 'Да', payload: { command: 'confirm' }, color: 'secondary' })
                    .textButton({ label: 'Нет', payload: { command: 'gold_down' }, color: 'secondary' })
                    .oneTime().inline(),
                    answerTimeLimit
                }
            )
            if (confirmq.isTimeout) { return await context.send(`⏰ Время ожидания на подтверждение удаления ${user_get.name} истекло!`) }
            if (confirmq.payload.command === 'confirm' && user_get) {
                if (user_get) {
                    const user_del = await prisma.user.delete({ where: { id: id } })
                    await context.send(`❗ Удален пользователь ${user_del.name}`)
                    if (user_del) {
                        const check_bbox = await prisma.blackBox.findFirst({ where: { idvk: user_del.idvk } })
                        if (!check_bbox) {
                            const add_bbox = await prisma.blackBox.create({ data: { idvk: user_del.idvk } })
                            add_bbox ? await context.send(`⚙ @id${user_del.idvk}(${user_del.name}) теперь является нелегалом.`) : await context.send(`⚙ @id${user_del.idvk}(${user_del.name}) не смог стать нелегалом.`)
                        } else {
                            await context.send(`⚙ @id${user_del.idvk}(${user_del.name}) депортируется НА РОДИНУ уже не в первый раз.`)
                        }
                        try {
                            await vk.api.messages.send({
                                user_id: user_del.idvk,
                                random_id: 0,
                                message: `❗ Ваша карточка 💳UID: ${user_del.id} больше не действительна. Спасибо, что пользовались банком Гринготтс 🏦, ${user_del.name}. Возвращайтесь к нам снова!`
                            })
                            await context.send(`⚙ Операция удаления пользователя завершена успешно.`)
                        } catch (error) {
                            console.log(`User ${user_del.idvk} blocked chating with bank`)
                        }
                        await vk.api.messages.send({
                            peer_id: chat_id,
                            random_id: 0,
                            message: `⚙ @id${context.senderId}(Admin) > "🚫👤" > удаляется из банковской системы карточка @id${user_del.idvk}(${user_del.name})`
                        })
                    }
                    console.log(`Admin ${context.senderId} deleted user: ${user_del.idvk}`)
                } 
            } else {
                await context.send(`⚙ Удаление ${user_get.name} отменено.`)
            }
        }
        //Модуль артефактов
        function Is_Stop_Command(answer: any): boolean {
            const text = String(answer?.text ?? '').trim().toLowerCase()
            return answer?.payload?.command === 'stop' || text === 'стоп' || text === '⏹ стоп'
        }

        function Artefact_Link_Is_Valid(value: string): boolean {
            const text = String(value ?? '').trim()
            if (!text || text.length > 1000) {
                return false
            }
            return /^https?:\/\/\S+/i.test(text) || /^photo-?\d+_\d+$/i.test(text)
        }

        function Chunk_By_Length(lines: string[], maxLength: number = 3200): string[] {
            const chunks: string[] = []
            let current = ''

            for (const line of lines) {
                const candidate = current ? `${current}\n${line}` : line
                if (candidate.length > maxLength) {
                    if (current) {
                        chunks.push(current)
                    }
                    current = line
                } else {
                    current = candidate
                }
            }

            if (current) {
                chunks.push(current)
            }

            return chunks
        }

        async function Artefact_Add(id: number) {
            const target: any = await prisma.user.findFirst({ where: { id } })
            if (!target) {
                await context.send(`⛔ Банковская карточка с 💳UID ${id} не найдена`)
                return
            }

            let created = 0
            while (true) {
                const name: any = await context.question(
                    `⌛ Массовая выдача артефактов для 💳UID ${id}.\n🧷 Укажите название нового 🔮артефакта:`,
                    {
                        keyboard: Keyboard.builder()
                        .textButton({ label: '⏹ Стоп', payload: { command: 'stop' }, color: 'secondary' })
                        .textButton({ label: '🔙', payload: { command: 'back' }, color: 'secondary' })
                        .textButton({ label: '🚫', payload: { command: 'cancel' }, color: 'negative' })
                        .oneTime().inline(),
                        answerTimeLimit
                    }
                )

                if (Question_Is_Cancel(name)) { return }
                if (name.isTimeout) {
                    return await context.send(`⏰ Время ожидания на задание имени артефакта истекло!`)
                }
                if (Question_Is_Back(name) || Is_Stop_Command(name)) {
                    return await context.send(`⚙ Массовая выдача артефактов завершена. Добавлено: ${created}`)
                }

                const artefactName = String(name.text ?? '').trim()
                if (!artefactName || artefactName.length > 1000) {
                    await context.send(`💡 Введите название артефакта до 1000 символов.`)
                    continue
                }

                const description: any = await context.question(
                    `🧷 Укажите ссылку на картинку артефакта. Допустимы форматы: https://... или photo-...`,
                    {
                        keyboard: Keyboard.builder()
                        .textButton({ label: '⏹ Стоп', payload: { command: 'stop' }, color: 'secondary' })
                        .textButton({ label: '🔙', payload: { command: 'back' }, color: 'secondary' })
                        .textButton({ label: '🚫', payload: { command: 'cancel' }, color: 'negative' })
                        .oneTime().inline(),
                        answerTimeLimit
                    }
                )

                if (Question_Is_Cancel(description)) { return }
                if (description.isTimeout) {
                    return await context.send(`⏰ Время ожидания на задание ссылки артефакта истекло!`)
                }
                if (Question_Is_Back(description)) {
                    await context.send(`↩ Возврат к вводу названия артефакта.`)
                    continue
                }
                if (Is_Stop_Command(description)) {
                    return await context.send(`⚙ Массовая выдача артефактов завершена. Добавлено: ${created}`)
                }

                const artefactLink = String(description.text ?? '').trim()
                if (!Artefact_Link_Is_Valid(artefactLink)) {
                    await context.send(`💡 Введите корректную ссылку вида https://... или photo-...`)
                    continue
                }

                const artefact_create = await prisma.artefact.create({
                    data: {
                        id_user: id,
                        name: artefactName,
                        label: '♾',
                        type: 'Многоразовый',
                        description: artefactLink
                    }
                })
                created++

                try {
                    await vk.api.messages.send({
                        user_id: target.idvk,
                        random_id: 0,
                        message: `⚙ Поздравляем! Вы получили новый 🔮: ${artefact_create.name}\n${artefact_create.label}: ${artefact_create.type}`
                    })
                    await context.send(`⚙ Артефакт ${artefact_create.name} добавлен`)
                } catch (error) {
                    console.log(`User ${target.idvk} blocked chating with bank`)
                }

                await vk.api.messages.send({
                    peer_id: chat_id,
                    random_id: 0,
                    message: `⚙ @id${context.senderId}(Admin) > "➕🔮" > артефакт ${artefact_create.name} получает @id${target.idvk}(${target.name}) [авто тип: Многоразовый ♾]`
                })

                const nextStep: any = await context.question(
                    `➕ Добавить еще один артефакт пользователю @id${target.idvk}(${target.name})?`,
                    {
                        keyboard: Keyboard.builder()
                        .textButton({ label: 'Да', payload: { command: 'continue' }, color: 'positive' })
                        .textButton({ label: '⏹ Стоп', payload: { command: 'stop' }, color: 'secondary' })
                        .textButton({ label: '🔙', payload: { command: 'back' }, color: 'secondary' })
                        .textButton({ label: '🚫', payload: { command: 'cancel' }, color: 'negative' })
                        .oneTime().inline(),
                        answerTimeLimit
                    }
                )

                if (Question_Is_Cancel(nextStep)) { return }
                if (nextStep.isTimeout) {
                    return await context.send(`⏰ Время ожидания подтверждения истекло. Добавлено: ${created}`)
                }
                if (Question_Is_Back(nextStep) || Is_Stop_Command(nextStep)) {
                    return await context.send(`⚙ Массовая выдача артефактов завершена. Добавлено: ${created}`)
                }
                if (nextStep?.payload?.command !== 'continue') {
                    return await context.send(`⚙ Массовая выдача артефактов завершена. Добавлено: ${created}`)
                }
            }
        }

        //Модуль вовзврата
        async function Back(id: number, count: number) {
            console.log(`Admin ${context.senderId} canceled operation for user UID: ${id}`)
            await context.send(`⚙ Операция отменена пользователем.`)
        }

        //Модуль обработки ввода пользователем 
        async function Ipnut_Gold() {
            let golden: number = 0
            let money_check = false
            while (money_check == false) {
                const gold: any = await context.question(`🧷 Введите количество для операции ${ans.text}: `, timer_text_oper)
                console.log(`[diag !опсоло] input_gold text=${gold?.text} payload=${JSON.stringify(gold?.payload)} timeout=${gold?.isTimeout} cancel=${Question_Is_Cancel(gold)} parsed=${Number(gold?.text)} parsed_is_nan=${Number.isNaN(Number(gold?.text))}`)
                if (Question_Is_Cancel(gold)) { return null }
                if (Question_Is_Back(gold)) { return null }
                if (gold.isTimeout) { await context.send(`⏰ Время ожидания на задание количества ${ans.text} истекло!`); return null }
                const parsed = Number(gold.text)
                if (!Number.isNaN(parsed)) {
                    money_check = true
                    golden = parsed
                } else {
                    await context.send(`💡 Введите число для операции ${ans.text}!`)
                }
            }
            return golden
        }
        async function Ipnut_Message() {
            let golden = ''
            let money_check = false
            while (money_check == false) {
                const gold = await context.question(`🧷 Введите уведомление пользователю ${ans.text}:`, timer_text_oper)
                console.log(`[diag !опсоло] input_message text=${gold?.text} payload=${JSON.stringify(gold?.payload)} timeout=${gold?.isTimeout} cancel=${Question_Is_Cancel(gold)}`)
                if (Question_Is_Cancel(gold)) { return null }
                if (Question_Is_Back(gold)) { return null }
                if (gold.isTimeout) { await context.send(`⏰ Время ожидания на задание уведомления пользователю ${ans.text} истекло!`); return null }
                if (gold.text) {
                    money_check = true
                    golden = gold.text
                } 
            }
            return golden
        }

        // Модуль отображения инвентаря и артефактов
        async function Artefact_Show(id: number) {
            const target: any = await prisma.user.findFirst({ where: { id } })
            if (!target) {
                await context.send(`⛔ Банковская карточка с 💳UID ${id} не найдена`)
                return
            }

            while (true) {
                const artefacts: any[] = await prisma.artefact.findMany({
                    where: { id_user: id },
                    orderBy: { id: 'asc' }
                })

                if (artefacts.length === 0) {
                    await context.send(`✉ У пользователя @id${target.idvk}(${target.name}) нет артефактов`)
                    return
                }

                const lines = artefacts.map((element: any, index: number) =>
                    `${index + 1}) 🔮ID ${element.id} | 🧷 ${element.name} | ${element.type}${element.label}\n🔗 ${element.description}`
                )
                const chunks = Chunk_By_Length(lines, 3200)
                await context.send(`📚 Артефакты пользователя @id${target.idvk}(${target.name}), 💳UID ${id}. Всего: ${artefacts.length}`)
                for (const chunk of chunks) {
                    await context.send(chunk)
                }

                const action: any = await context.question(
                    `⚙ Выберите действие для артефактов пользователя ${target.name}:`,
                    {
                        keyboard: Keyboard.builder()
                        .textButton({ label: '➕ Добавить', payload: { command: 'artefact_add' }, color: 'secondary' })
                        .textButton({ label: '✏ Редактировать', payload: { command: 'artefact_edit' }, color: 'secondary' }).row()
                        .textButton({ label: '🗑 Удалить', payload: { command: 'artefact_delete' }, color: 'negative' })
                        .textButton({ label: '🔄 Обновить', payload: { command: 'artefact_refresh' }, color: 'primary' }).row()
                        .textButton({ label: '🔙', payload: { command: 'back' }, color: 'secondary' })
                        .textButton({ label: '🚫', payload: { command: 'cancel' }, color: 'negative' })
                        .oneTime().inline(),
                        answerTimeLimit
                    }
                )

                if (Question_Is_Cancel(action)) { return }
                if (action.isTimeout) { return await context.send(`⏰ Время ожидания действия по артефактам истекло!`) }
                if (Question_Is_Back(action) || Is_Stop_Command(action)) { return }

                const command = action?.payload?.command
                if (command === 'artefact_add') {
                    await Artefact_Add(id)
                    continue
                }
                if (command === 'artefact_edit') {
                    await Artefact_Edit(id)
                    continue
                }
                if (command === 'artefact_delete') {
                    const deleteTarget: any = await context.question(
                        `🧷 Введите ID артефакта для удаления у ${target.name}:`,
                        {
                            keyboard: Keyboard.builder()
                            .textButton({ label: '🔙', payload: { command: 'back' }, color: 'secondary' })
                            .textButton({ label: '🚫', payload: { command: 'cancel' }, color: 'negative' })
                            .oneTime().inline(),
                            answerTimeLimit
                        }
                    )

                    if (Question_Is_Cancel(deleteTarget)) { return }
                    if (deleteTarget.isTimeout) { return await context.send(`⏰ Время ожидания выбора артефакта для удаления истекло!`) }
                    if (Question_Is_Back(deleteTarget) || Is_Stop_Command(deleteTarget)) { continue }

                    const artefactId = Number(String(deleteTarget.text ?? '').trim())
                    if (Number.isNaN(artefactId) || artefactId <= 0) {
                        await context.send(`💡 Введите корректный ID артефакта.`)
                        continue
                    }

                    const artefactToDelete: any = await prisma.artefact.findFirst({ where: { id: artefactId, id_user: id } })
                    if (!artefactToDelete) {
                        await context.send(`💡 У пользователя ${target.name} нет артефакта с ID ${artefactId}.`)
                        continue
                    }

                    const deleted = await prisma.artefact.delete({ where: { id: artefactId } })
                    await context.send(`⚙ Удален артефакт ${deleted.name} ID ${deleted.id}`)

                    try {
                        await vk.api.messages.send({
                            user_id: target.idvk,
                            random_id: 0,
                            message: `⚙ Ваш артефакт ${deleted.name} изъял ОМОН!`
                        })
                    } catch (error) {
                        console.log(`User ${target.idvk} blocked chating with bank`)
                    }

                    await vk.api.messages.send({
                        peer_id: chat_id,
                        random_id: 0,
                        message: `⚙ @id${context.senderId}(Admin) > "🚫🔮" > артефакт ${deleted.name} удален у @id${target.idvk}(${target.name})`
                    })
                    continue
                }
                if (command === 'artefact_refresh') {
                    continue
                }

                await context.send(`💡 Выберите действие кнопками.`)
            }
        }
        async function Artefact_Show_All(id: number) {
            const artefacts: any[] = await prisma.artefact.findMany({
                include: { user: true },
                orderBy: { id: 'asc' }
            })

            if (artefacts.length === 0) {
                await context.send(`✉ Общий список артефактов пуст`)
                return
            }

            const lines = artefacts.map((element: any, index: number) => {
                return `${index + 1}) 🔮ID ${element.id} | 💳UID ${element.id_user} | 👤 ${element?.user?.name ?? 'неизвестно'}\n🧷 ${element.name} | ${element.type}${element.label}\n🔗 ${element.description}`
            })

            const chunks = Chunk_By_Length(lines, 3200)
            await context.send(`📚 Общий список артефактов. Всего: ${artefacts.length}`)
            for (const chunk of chunks) {
                await context.send(chunk)
            }

            await vk.api.messages.send({
                peer_id: chat_id,
                random_id: 0,
                message: `⚙ @id${context.senderId}(Admin) запросил общий список артефактов. Всего: ${artefacts.length}`
            })
        }

        async function Artefact_Edit(id: number) {
            while (true) {
                const artefactTarget: any = await context.question(
                    `🧷 Введите 🔮ID артефакта для редактирования:`,
                    {
                        keyboard: Keyboard.builder()
                        .textButton({ label: '⏹ Стоп', payload: { command: 'stop' }, color: 'secondary' })
                        .textButton({ label: '🔙', payload: { command: 'back' }, color: 'secondary' })
                        .textButton({ label: '🚫', payload: { command: 'cancel' }, color: 'negative' })
                        .oneTime().inline(),
                        answerTimeLimit
                    }
                )

                if (Question_Is_Cancel(artefactTarget)) { return }
                if (artefactTarget.isTimeout) { return await context.send(`⏰ Время ожидания выбора артефакта истекло!`) }
                if (Question_Is_Back(artefactTarget) || Is_Stop_Command(artefactTarget)) {
                    return await context.send(`⚙ Редактирование артефактов завершено`)
                }

                const artefactId = Number(String(artefactTarget.text ?? '').trim())
                if (Number.isNaN(artefactId) || artefactId <= 0) {
                    await context.send(`💡 Введите корректный ID артефакта.`)
                    continue
                }

                let artefact: any = await prisma.artefact.findFirst({ where: { id: artefactId }, include: { user: true } })
                if (!artefact) {
                    await context.send(`💡 Артефакт с ID ${artefactId} не найден.`)
                    continue
                }

                while (true) {
                    const action: any = await context.question(
                        `✏ Редактирование артефакта ${artefact.id}\n👤 Владелец: ${artefact?.user?.name ?? 'неизвестно'} | 💳UID ${artefact.id_user}\n🧷 ${artefact.name}\n🔧 ${artefact.type}${artefact.label}\n🔗 ${artefact.description}`,
                        {
                            keyboard: Keyboard.builder()
                            .textButton({ label: '✏ Имя', payload: { command: 'edit_name' }, color: 'secondary' })
                            .textButton({ label: '✏ Тип', payload: { command: 'edit_type' }, color: 'secondary' }).row()
                            .textButton({ label: '✏ Метка', payload: { command: 'edit_label' }, color: 'secondary' })
                            .textButton({ label: '✏ Ссылка', payload: { command: 'edit_description' }, color: 'secondary' }).row()
                            .textButton({ label: '✅ Готово', payload: { command: 'finish' }, color: 'positive' })
                            .textButton({ label: '🔙', payload: { command: 'back' }, color: 'secondary' })
                            .textButton({ label: '🚫', payload: { command: 'cancel' }, color: 'negative' })
                            .oneTime().inline(),
                            answerTimeLimit
                        }
                    )

                    if (Question_Is_Cancel(action)) { return }
                    if (action.isTimeout) { return await context.send(`⏰ Время ожидания выбора действия редактирования истекло!`) }
                    if (Question_Is_Back(action) || Is_Stop_Command(action) || action?.payload?.command === 'finish') {
                        await context.send(`⚙ Редактирование артефакта ${artefact.id} завершено`)
                        break
                    }

                    if (!action.payload) {
                        await context.send(`💡 Выберите действие кнопками.`)
                        continue
                    }

                    if (action.payload.command === 'edit_name') {
                        const answerName: any = await context.question(
                            `🧷 Введите новое название артефакта:`,
                            {
                                keyboard: Keyboard.builder()
                                .textButton({ label: '🔙', payload: { command: 'back' }, color: 'secondary' })
                                .textButton({ label: '🚫', payload: { command: 'cancel' }, color: 'negative' })
                                .oneTime().inline(),
                                answerTimeLimit
                            }
                        )

                        if (Question_Is_Cancel(answerName)) { return }
                        if (answerName.isTimeout) { return await context.send(`⏰ Время ожидания ввода имени артефакта истекло!`) }
                        if (Question_Is_Back(answerName)) { continue }
                        if (Is_Stop_Command(answerName)) { return await context.send(`⚙ Редактирование артефактов завершено`) }

                        const value = String(answerName.text ?? '').trim()
                        if (!value || value.length > 1000) {
                            await context.send(`💡 Введите название до 1000 символов.`)
                            continue
                        }

                        artefact = await prisma.artefact.update({ where: { id: artefact.id }, data: { name: value }, include: { user: true } })
                        await context.send(`⚙ Поле имени обновлено: ${artefact.name}`)
                        await vk.api.messages.send({
                            peer_id: chat_id,
                            random_id: 0,
                            message: `⚙ @id${context.senderId}(Admin) изменил имя артефакта ${artefact.id} для @id${artefact?.user?.idvk}(${artefact?.user?.name})`
                        })
                        continue
                    }

                    if (action.payload.command === 'edit_type') {
                        const answerType: any = await context.question(
                            `🧷 Введите новый тип артефакта или выберите кнопку:`,
                            {
                                keyboard: Keyboard.builder()
                                .textButton({ label: 'Многоразовый', payload: { command: 'type_multi' }, color: 'secondary' })
                                .textButton({ label: 'Одноразовый', payload: { command: 'type_single' }, color: 'secondary' }).row()
                                .textButton({ label: '🔙', payload: { command: 'back' }, color: 'secondary' })
                                .textButton({ label: '🚫', payload: { command: 'cancel' }, color: 'negative' })
                                .oneTime().inline(),
                                answerTimeLimit
                            }
                        )

                        if (Question_Is_Cancel(answerType)) { return }
                        if (answerType.isTimeout) { return await context.send(`⏰ Время ожидания ввода типа артефакта истекло!`) }
                        if (Question_Is_Back(answerType)) { continue }
                        if (Is_Stop_Command(answerType)) { return await context.send(`⚙ Редактирование артефактов завершено`) }

                        let value = String(answerType.text ?? '').trim()
                        if (answerType?.payload?.command === 'type_multi') {
                            value = 'Многоразовый'
                        }
                        if (answerType?.payload?.command === 'type_single') {
                            value = 'Одноразовый'
                        }

                        if (!value || value.length > 100) {
                            await context.send(`💡 Введите тип до 100 символов.`)
                            continue
                        }

                        artefact = await prisma.artefact.update({ where: { id: artefact.id }, data: { type: value }, include: { user: true } })
                        await context.send(`⚙ Поле типа обновлено: ${artefact.type}`)
                        await vk.api.messages.send({
                            peer_id: chat_id,
                            random_id: 0,
                            message: `⚙ @id${context.senderId}(Admin) изменил тип артефакта ${artefact.id} для @id${artefact?.user?.idvk}(${artefact?.user?.name})`
                        })
                        continue
                    }

                    if (action.payload.command === 'edit_label') {
                        const answerLabel: any = await context.question(
                            `🧷 Введите новую метку артефакта или выберите кнопку:`,
                            {
                                keyboard: Keyboard.builder()
                                .textButton({ label: '♾', payload: { command: 'label_multi' }, color: 'secondary' })
                                .textButton({ label: '🕐', payload: { command: 'label_single' }, color: 'secondary' }).row()
                                .textButton({ label: '🔙', payload: { command: 'back' }, color: 'secondary' })
                                .textButton({ label: '🚫', payload: { command: 'cancel' }, color: 'negative' })
                                .oneTime().inline(),
                                answerTimeLimit
                            }
                        )

                        if (Question_Is_Cancel(answerLabel)) { return }
                        if (answerLabel.isTimeout) { return await context.send(`⏰ Время ожидания ввода метки артефакта истекло!`) }
                        if (Question_Is_Back(answerLabel)) { continue }
                        if (Is_Stop_Command(answerLabel)) { return await context.send(`⚙ Редактирование артефактов завершено`) }

                        let value = String(answerLabel.text ?? '').trim()
                        if (answerLabel?.payload?.command === 'label_multi') {
                            value = '♾'
                        }
                        if (answerLabel?.payload?.command === 'label_single') {
                            value = '🕐'
                        }

                        if (!value || value.length > 32) {
                            await context.send(`💡 Введите метку до 32 символов.`)
                            continue
                        }

                        artefact = await prisma.artefact.update({ where: { id: artefact.id }, data: { label: value }, include: { user: true } })
                        await context.send(`⚙ Поле метки обновлено: ${artefact.label}`)
                        await vk.api.messages.send({
                            peer_id: chat_id,
                            random_id: 0,
                            message: `⚙ @id${context.senderId}(Admin) изменил метку артефакта ${artefact.id} для @id${artefact?.user?.idvk}(${artefact?.user?.name})`
                        })
                        continue
                    }

                    if (action.payload.command === 'edit_description') {
                        const answerDescription: any = await context.question(
                            `🧷 Введите новую ссылку артефакта:`,
                            {
                                keyboard: Keyboard.builder()
                                .textButton({ label: '🔙', payload: { command: 'back' }, color: 'secondary' })
                                .textButton({ label: '🚫', payload: { command: 'cancel' }, color: 'negative' })
                                .oneTime().inline(),
                                answerTimeLimit
                            }
                        )

                        if (Question_Is_Cancel(answerDescription)) { return }
                        if (answerDescription.isTimeout) { return await context.send(`⏰ Время ожидания ввода ссылки артефакта истекло!`) }
                        if (Question_Is_Back(answerDescription)) { continue }
                        if (Is_Stop_Command(answerDescription)) { return await context.send(`⚙ Редактирование артефактов завершено`) }

                        const value = String(answerDescription.text ?? '').trim()
                        if (!Artefact_Link_Is_Valid(value)) {
                            await context.send(`💡 Введите корректную ссылку вида https://... или photo-...`)
                            continue
                        }

                        artefact = await prisma.artefact.update({ where: { id: artefact.id }, data: { description: value }, include: { user: true } })
                        await context.send(`⚙ Ссылка артефакта обновлена`)
                        await vk.api.messages.send({
                            peer_id: chat_id,
                            random_id: 0,
                            message: `⚙ @id${context.senderId}(Admin) изменил ссылку артефакта ${artefact.id} для @id${artefact?.user?.idvk}(${artefact?.user?.name})`
                        })
                        continue
                    }
                }

                return
            }
        }
        async function Inventory_Show(id: number) { 
            const artefact = await prisma.inventory.findMany({ where: { id_user: id } })
            if (artefact.length > 0) {
                for(const element of artefact) {
                    const item: any = await prisma.item.findFirst({ where: { id: element.id_item }, include: { category: true } })
                    await context.send(`💬: ${item.name}-${element.id} \n🔧: ${item.category.name}-${item.price}💰`,
                        {
                            keyboard: Keyboard.builder()
                            .textButton({ label: 'Удалить👜', payload: { command: `${element.id}` }, color: 'secondary' })
                            .oneTime().inline()
                        }
                    )
                }
            } else {
                await context.send(`✉ Товары отсутствуют =(`)
            }
            console.log(`Admin ${context.senderId} see artefacts from user UID: ${id}`)
        }

        //Модуль мульти начислений
        async function Multi_Up(id: number) {
            await context.send(`⚠ Приступаем к начислению галлеонов`)
            const gold = await Ipnut_Gold() 
            if (gold === null || Number.isNaN(gold)) { return await context.send(`⚙ Операция начисления отменена`) }
            await context.send(`⚠ Приступаем к начислению магического опыта`)
            const xp = await Ipnut_Gold()
            if (xp === null || Number.isNaN(xp)) { return await context.send(`⚙ Операция начисления отменена`) }
            const messa = await Ipnut_Message()
            if (messa === null) { return await context.send(`⚙ Операция начисления отменена`) }
            const user_get: User | null = await prisma.user.findFirst({ where: { id } })
            const money_put = await prisma.user.update({ where: { id: user_get?.id }, data: { gold: { increment: gold }, xp: { increment: xp } } })
            try {
                await vk.api.messages.send({
                    user_id: user_get?.idvk,
                    random_id: 0,
                    message: `⚙ Вам начислено ${gold}💰 ${xp}🧙. \n\nВаш счёт:\n${money_put.gold}💰\n${money_put.xp}🧙\n\nУведомление: ${messa}`
                })
                await context.send(`⚙ Операция завершена успешно`)
            } catch (error) {
                console.log(`User ${user_get?.idvk} blocked chating with bank`)
            }
            await vk.api.messages.send({
                peer_id: chat_id,
                random_id: 0,
                message: `⚙ @id${context.senderId}(Admin) > "+💰🧙" >\n${user_get?.gold}+${gold}=${money_put.gold}💰\n${user_get?.xp}+${xp}=${money_put.xp}🧙\n для @id${user_get?.idvk}(${user_get?.name}) 🧷: ${messa}`
            })
            console.log(`User ${user_get?.idvk} got ${gold} gold and ${xp} xp. Him/Her bank now ${money_put.gold}`)
        }
        async function Multi_Down(id: number) {
            await context.send(`⚠ Приступаем к снятию галлеонов`)
            const gold = await Ipnut_Gold() 
            if (gold === null || Number.isNaN(gold)) { return await context.send(`⚙ Операция списания отменена`) }
            await context.send(`⚠ Приступаем к снятию магического опыта`)
            const xp = await Ipnut_Gold()
            if (xp === null || Number.isNaN(xp)) { return await context.send(`⚙ Операция списания отменена`) }
            const messa = await Ipnut_Message()
            if (messa === null) { return await context.send(`⚙ Операция списания отменена`) }
            const user_get: User | null = await prisma.user.findFirst({ where: { id } })
            const money_put = await prisma.user.update({ where: { id: user_get?.id }, data: { gold: { decrement: gold }, xp: { decrement: xp } } })
            try {
                await vk.api.messages.send({
                    user_id: user_get?.idvk,
                    random_id: 0,
                    message: `⚙ С вас снято ${gold}💰 ${xp}🧙. \n\nВаш счёт:\n${money_put.gold}💰\n${money_put.xp}🧙\n\nУведомление: ${messa}`
                })
                await context.send(`⚙ Операция завершена успешно`)
            } catch (error) {
                console.log(`User ${user_get?.idvk} blocked chating with bank`)
            }
            await vk.api.messages.send({
                peer_id: chat_id,
                random_id: 0,
                message: `⚙ @id${context.senderId}(Admin) > "-💰🧙" >\n${user_get?.gold}-${gold}=${money_put.gold}💰\n${user_get?.xp}-${xp}=${money_put.xp}🧙\n для @id${user_get?.idvk}(${user_get?.name}) 🧷: ${messa}`
            })
            console.log(`User ${user_get?.idvk} left ${gold} gold and ${xp} xp. Him/Her bank now ${money_put.gold}`)
        }
        //Модуль начислений
        async function Gold_Up(id: number) {
            const count = await Ipnut_Gold() 
            const messa = await Ipnut_Message()
            if (count === null || Number.isNaN(count) || messa === null) {
                console.log(`[diag !опсоло] gold_up_abort uid=${id} count=${count} messa=${messa}`)
                return await context.send(`⚙ Операция начисления отменена`)
            }
            const user_get: any = await prisma.user.findFirst({ where: { id } })
            console.log(`[diag !опсоло] gold_up_before_update uid=${id} count=${count} count_is_nan=${Number.isNaN(count)} messa=${messa}`)
            const money_put = await prisma.user.update({ where: { id: user_get.id }, data: { gold: user_get.gold + count } })
            try {
                await vk.api.messages.send({
                    user_id: user_get.idvk,
                    random_id: 0,
                    message: `⚙ Вам начислено ${count}💰. \nВаш счёт: ${money_put.gold}💰 \nУведомление: ${messa}`
                })
                await context.send(`⚙ Операция завершена успешно`)
            } catch (error) {
                console.log(`User ${user_get.idvk} blocked chating with bank`)
            }
            await vk.api.messages.send({
                peer_id: chat_id,
                random_id: 0,
                message: `⚙ @id${context.senderId}(Admin) > "+💰" > ${money_put.gold-count}💰+${count}💰=${money_put.gold}💰 для @id${user_get.idvk}(${user_get.name}) 🧷: ${messa}`
            })
            console.log(`User ${user_get.idvk} got ${count} gold. Him/Her bank now ${money_put.gold}`)
        }
        async function Gold_Down(id: number) {
            const count = await Ipnut_Gold() 
            const messa = await Ipnut_Message()
            if (count === null || Number.isNaN(count) || messa === null) {
                return await context.send(`⚙ Операция списания отменена`)
            }
            const user_get: any = await prisma.user.findFirst({ where: { id } })
            if (user_get.gold-count >= 0) {
                const money_put = await prisma.user.update({ where: { id: user_get.id }, data: { gold: user_get.gold - count } })
                try {
                    await vk.api.messages.send({
                        user_id: user_get.idvk,
                        random_id: 0,
                        message: `⚙ С вас снято ${count}💰. \nВаш счёт: ${money_put.gold}💰 \nУведомление: ${messa}`
                    })
                    await context.send(`⚙ Операция завершена успешно`)
                } catch (error) {
                    console.log(`User ${user_get.idvk} blocked chating with bank`)
                }
                await vk.api.messages.send({
                    peer_id: chat_id,
                    random_id: 0,
                    message: `⚙ @id${context.senderId}(Admin) > "-💰" > ${money_put.gold+count}💰-${count}💰=${money_put.gold}💰 для @id${user_get.idvk}(${user_get.name}) 🧷: ${messa}`
                })
                console.log(`User ${user_get.idvk} lost ${count} gold. Him/Her bank now ${money_put.gold}`)
            } else {
                const confirmq = await context.question(`⌛ Вы хотите снять ${count} 💰галлеонов c счета ${user_get.name}, но счет этого ${user_get.spec} ${user_get.gold}. Уверены, что хотите сделать баланс: ${user_get.gold-count}`,
                    {
                        keyboard: Keyboard.builder()
                        .textButton({ label: 'Да', payload: { command: 'confirm' }, color: 'secondary' })
                        .textButton({ label: 'Нет', payload: { command: 'gold_down' }, color: 'secondary' })
                        .oneTime().inline(),
                        answerTimeLimit
                    }
                )
                if (confirmq.isTimeout) { return await context.send(`⏰ Время ожидания на снятие галлеонов с ${user_get.name} истекло!`) }
                if (confirmq.payload.command === 'confirm') {
                    const money_put = await prisma.user.update({ where: { id: user_get.id }, data: { gold: user_get.gold - count } })
                    try {
                        await vk.api.messages.send({
                            user_id: user_get.idvk, random_id: 0,
                            message: `⚙ С вас снято ${count}💰. \nВаш счёт: ${money_put.gold}💰 \nУведомление: ${messa}`
                        })
                        await context.send(`⚙ Операция завершена успешно`)
                    } catch (error) {
                        console.log(`User ${user_get.idvk} blocked chating with bank`)
                    }
                    await vk.api.messages.send({
                        peer_id: chat_id,
                        random_id: 0,
                        message: `⚙ @id${context.senderId}(Admin) > "-💰" > ${money_put.gold+count}💰-${count}💰=${money_put.gold}💰 для @id${user_get.idvk}(${user_get.name}) 🧷: ${messa}`
                    })
                    console.log(`User ${user_get.idvk} lost ${count} gold. Him/Her bank now ${money_put.gold}`)
                } else {
                    await context.send(`💡 Нужно быть жестче! Греби бабло`)
                }
            }
        }
        async function Xp_Up(id: number) {
            const count = await Ipnut_Gold() 
            const messa = await Ipnut_Message()
            if (count === null || Number.isNaN(count) || messa === null) {
                return await context.send(`⚙ Операция начисления отменена`)
            }
            const user_get: any = await prisma.user.findFirst({ where: { id } })
            const money_put = await prisma.user.update({ where: { id: user_get.id }, data: { xp: user_get.xp + count } })
            try {
                await vk.api.messages.send({
                    user_id: user_get.idvk,
                    random_id: 0,
                    message: `⚙ Вам начислено ${count}🧙. \nВаш МО: ${money_put.xp}🧙 \nУведомление: ${messa}`
                })
                await context.send(`⚙ Операция завершена успешно`)
            } catch (error) {
                console.log(`User ${user_get.idvk} blocked chating with bank`)
            }
            await vk.api.messages.send({
                peer_id: chat_id,
                random_id: 0,
                message: `⚙ @id${context.senderId}(Admin) > "+🧙" > ${money_put.xp-count}🧙+${count}🧙=${money_put.xp}🧙 для @id${user_get.idvk}(${user_get.name}) 🧷: ${messa}`
            })
            console.log(`User ${user_get.idvk} got ${count} MO. Him/Her XP now ${money_put.xp}`)
        }
        async function Xp_Down(id: number) {
            const count = await Ipnut_Gold() 
            if (count === null || Number.isNaN(count)) { return await context.send(`⚙ Операция списания отменена`) }
            if (count === 0) { return }
            const messa = await Ipnut_Message()
            if (messa === null) { return await context.send(`⚙ Операция списания отменена`) }
            const user_get: any = await prisma.user.findFirst({ where: { id } })
            if (user_get.xp-count >= 0) {
                const money_put = await prisma.user.update({ where: { id: user_get.id }, data: { xp: user_get.xp - count } })
                try {
                    await vk.api.messages.send({
                        user_id: user_get.idvk,
                        random_id: 0,
                        message: `⚙ С вас снято ${count}🧙. \nВаш МО: ${money_put.xp}🧙  \nУведомление: ${messa}`
                    })
                    await context.send(`⚙ Операция завершена успешно`)
                } catch (error) {
                    console.log(`User ${user_get.idvk} blocked chating with bank`)
                }
                await vk.api.messages.send({
                    peer_id: chat_id,
                    random_id: 0,
                    message: `⚙ @id${context.senderId}(Admin) > "-🧙" > ${money_put.xp+count}🧙-${count}🧙=${money_put.xp}🧙 для @id${user_get.idvk}(${user_get.name}) 🧷: ${messa}`
                })
                console.log(`User ${user_get.idvk} lost ${count} MO. Him/Her XP now ${money_put.xp}`)
            } else {
                await context.send(`⌛ Вы хотите снять ${count} 🧙магического опыта c счета ${user_get.name}, но счет этого ${user_get.spec} ${user_get.xp}. Уверены, что хотите сделать баланс: ${user_get.xp-count}? (Автоподтверждение)`)
                const money_put = await prisma.user.update({ where: { id: user_get.id }, data: { xp: user_get.xp - count } })
                try {
                    await vk.api.messages.send({
                        user_id: user_get.idvk,
                        random_id: 0,
                        message: `⚙ С вас снято ${count}🧙. \nВаш МО: ${money_put.xp}🧙  \nУведомление: ${messa}`
                    })
                    await context.send(`⚙ Операция завершена успешно`)
                } catch (error) {
                    console.log(`User ${user_get.idvk} blocked chating with bank`)
                }
                await vk.api.messages.send({
                    peer_id: chat_id,
                    random_id: 0,
                    message: `⚙ @id${context.senderId}(Admin) > "-🧙" > ${money_put.xp+count}🧙-${count}🧙=${money_put.xp}🧙 для @id${user_get.idvk}(${user_get.name}) 🧷: ${messa}`
                })
                console.log(`User ${user_get.idvk} lost ${count} MO. Him/Her XP now ${money_put.xp}`)
            }
        }

        //Модуль доп клавиатуры
        async function Sub_Menu(id: number) {
            const ans_again: any = await context.question( `✉ Доступны следующие операции с 💳UID: ${datas[0].id}`,
                {   
                    keyboard: Keyboard.builder()
                    .textButton({ label: '➕🔮', payload: { command: 'artefact_add' }, color: 'secondary' })
                    .textButton({ label: '📚🔮', payload: { command: 'artefact_show_selected' }, color: 'secondary' }).row()
                    .textButton({ label: '✏🔮', payload: { command: 'artefact_edit' }, color: 'secondary' })
                    .textButton({ label: '✏', payload: { command: 'editor' }, color: 'secondary' }).row()
                    .textButton({ label: '👁👜', payload: { command: 'inventory_show' }, color: 'secondary' }).row()
                    .textButton({ label: '📦🛠', payload: { command: 'storage_admin' }, color: 'secondary' }).row()
                    .textButton({ label: '🔙', payload: { command: 'back' }, color: 'secondary' }).row()
                    .textButton({ label: '☠', payload: { command: 'user_delete' }, color: 'secondary' })
                    .oneTime().inline(),
                    answerTimeLimit                                                                       
                }
            )
            if (ans_again.isTimeout) { return await context.send(`⏰ Время ожидания на ввод операции с 💳UID: ${datas[0].id} истекло!`) }
            if (ans_again.payload && ans_again.payload.command != 'back') {
                const config: any = {
                    'back': Back,
                    'artefact_add': Artefact_Add,
                    'artefact_show': Artefact_Show,
                    'artefact_show_selected': Artefact_Show,
                    'artefact_edit': Artefact_Edit,
                    'inventory_show': Inventory_Show,
                    'storage_admin': Storage_Admin,
                    'user_delete': User_delete,
                    'editor': Editor,
                }
                const answergot = await config[ans_again.payload.command](Number(datas[0].id))
            } else {
                await context.send(`⚙ Операция отменена пользователем.`)
            }
        }

        async function Storage_Admin(id: number) {
            const mode = await context.question(
                `🧷 Режим админ-хранилища. Выберите источник UID:`,
                {
                    keyboard: Keyboard.builder()
                    .textButton({ label: 'Текущий UID', payload: { command: 'storage_current' }, color: 'secondary' })
                    .textButton({ label: 'Другой UID', payload: { command: 'storage_other' }, color: 'secondary' }).row()
                    .textButton({ label: '🔙', payload: { command: 'back' }, color: 'secondary' })
                    .textButton({ label: '🚫', payload: { command: 'cancel' }, color: 'negative' })
                    .oneTime().inline(),
                    answerTimeLimit
                }
            )

            if (Question_Is_Cancel(mode) || Question_Is_Back(mode) || mode.isTimeout) {
                return
            }

            let targetUid = id
            if (mode?.payload?.command === 'storage_other') {
                const selected = await Input_Target_UID(context, `🧷 Введите 💳UID для открытия админ-хранилища:`)
                if (selected === null) {
                    return
                }
                targetUid = selected
            }

            await Storage_Printer(context, targetUid)
        }
    })

    hearManager.hear(/^!артефактывсе$/i, async (context) => {
        if (await Accessed(context) != 2) {
            return
        }

        const artefacts: any[] = await prisma.artefact.findMany({
            include: { user: true },
            orderBy: { id: 'asc' }
        })

        if (artefacts.length === 0) {
            await context.send(`✉ Общий список артефактов пуст`)
            return
        }

        const lines = artefacts.map((element: any, index: number) => {
            return `${index + 1}) 🔮ID ${element.id} | 💳UID ${element.id_user} | 👤 ${element?.user?.name ?? 'неизвестно'}\n🧷 ${element.name} | ${element.type}${element.label}\n🔗 ${element.description}`
        })

        const chunks: string[] = []
        let current = ''
        for (const line of lines) {
            const candidate = current ? `${current}\n${line}` : line
            if (candidate.length > 3200) {
                if (current) {
                    chunks.push(current)
                }
                current = line
            } else {
                current = candidate
            }
        }
        if (current) {
            chunks.push(current)
        }

        await context.send(`📚 Общий список артефактов. Всего: ${artefacts.length}`)
        for (const chunk of chunks) {
            await context.send(chunk)
        }

        await vk.api.messages.send({
            peer_id: chat_id,
            random_id: 0,
            message: `⚙ @id${context.senderId}(Admin) запросил общий список артефактов через !артефактывсе. Всего: ${artefacts.length}`
        })
    })
    //Обработчики удаления инвентаря и артефактов
    hearManager.hear(/Удалить👜/, async (context) => {
        if (context.messagePayload == null) {
            return
        }
        const art_get: any = await prisma.inventory.findFirst({ where: { id: Number(context.messagePayload.command) } })
        const item: any = await prisma.item.findFirst({ where: { id: art_get.id_item } })
        if (art_get) {
            const art_del = await prisma.inventory.delete({ where: { id: Number(context.messagePayload.command) } })
            await context.send(`⚙ Удален товар ${item.name}-${art_del.id}`)
            const user_find = await prisma.user.findFirst({ where: { id: art_del.id_user } })
            if (user_find) {
                try {
                    await vk.api.messages.send({
                        user_id: user_find.idvk,
                        random_id: 0,
                        message: `⚙ Ваш товар ${item.name} пожертвовали в АЗКАБАН!`
                    })
                    await context.send(`⚙ Удаление товара успешно завершено`)
                } catch (error) {
                    console.log(`User ${user_find.idvk} blocked chating with bank`)
                }
                await vk.api.messages.send({
                    peer_id: chat_id,
                    random_id: 0,
                    message: `⚙ @id${context.senderId}(Admin) > "🚫👜" > товар ${item.name} пожертвовали в Азкабан! у @id${user_find.idvk}(${user_find.name})`
                })
            }
            console.log(`Admin ${context.senderId} destroy item from user UID: ${user_find?.idvk}`)
        }
        await Keyboard_Index(context, '💡 Был товар, нееет товара!')
    })
    hearManager.hear(/Удалить🔮/, async (context) => {
        if (context.messagePayload == null) {
            return
        }
        const art_get: any = await prisma.artefact.findFirst({ where: { id: Number(context.messagePayload.command) } })
        if (art_get) {
            const art_del = await prisma.artefact.delete({ where: { id: Number(context.messagePayload.command) } })
            await context.send(`⚙ Удален артефакт ${art_del.name}`)
            const user_find = await prisma.user.findFirst({ where: { id: art_del.id_user } })
            if (user_find) {
                try {
                    await vk.api.messages.send({
                        user_id: user_find.idvk,
                        random_id: 0,
                        message: `⚙ Ваш артефакт ${art_del.name} изъял ОМОН!`
                    })
                    await context.send(`⚙ Удаление артефакта успешно завершено`)
                } catch (error) {
                    console.log(`User ${user_find.idvk} blocked chating with bank`)
                }
                await vk.api.messages.send({
                    peer_id: chat_id,
                    random_id: 0,
                    message: `⚙ @id${context.senderId}(Admin) > "🚫🔮" > артефакт ${art_del.name} изъял ОМОН! у @id${user_find.idvk}(${user_find.name})`
                })
            }
            console.log(`Admin ${context.senderId} destroy artefact from user UID: ${user_find?.idvk}`)
        }
        await Keyboard_Index(context, '💡 Был артефакт, нееет артефакта!')
    })

    hearManager.hear(/админка/, async (context: any) => {
        if (context.senderId == root) {
            const user:any = await prisma.user.findFirst({ where: { idvk: Number(context.senderId) } })
            const lvlup = await prisma.user.update({ where: { id: user.id }, data: { id_role: 2 } })
            if (lvlup) {
                await context.send(`⚙ Рут права получены`)
            } else {
                await context.send(`⚙ Ошибка`)
            }
        }
        await vk.api.messages.send({
            peer_id: chat_id,
            random_id: 0,
            message: `⚙ @id${context.senderId}(Root) становится администратором!)`
        })
        console.log(`Super user ${context.senderId} got root`)
        await Keyboard_Index(context, `💡 Захват мира снова в теме!`)
    })
    hearManager.hear(/права/, async (context: any) => {
        if (context.senderId == root) {
            const uid = await context.question(`🧷 Введите 💳UID банковского счета получателя:`, timer_text)
            if (uid.isTimeout) { return await context.send(`⏰ Время ожидания ввода банковского счета истекло!`) }
			if (uid.text) {
                const get_user = await prisma.user.findFirst({ where: { id: Number(uid.text) } })
                if (get_user) {
                    const artefact_counter = await prisma.artefact.count({ where: { id_user: Number(uid.text) } })
                    const role: any = await prisma.role.findFirst({ where: { id: get_user.id_role } })
                    await context.send(`✉ Открыта следующая карточка: ${get_user.class} ${get_user.name}, ${get_user.spec}: \n\n💳 UID: ${get_user.id} \n💰 Галлеоны: ${get_user.gold} \n🧙 Магический опыт: ${get_user.xp} \n📈 Уровень: ${get_user.lvl} \n🔮 Количество артефактов: ${artefact_counter}\n \nПрава пользователя: ${role.name} `)
                    const answer1 = await context.question(`⌛ Что будем делать?`,
                        {
                            keyboard: Keyboard.builder()
                            .textButton({ label: 'Дать админку', payload: { command: 'access' }, color: 'secondary' })
                            .textButton({ label: 'Снять админку', payload: { command: 'denied' }, color: 'secondary' }).row()
                            .textButton({ label: 'Ничего не делать', payload: { command: 'cancel' }, color: 'secondary' })
                            .oneTime().inline(),
                            answerTimeLimit
                        }
                    )
                    if (answer1.isTimeout) { return await context.send(`⏰ Время ожидания изменения прав истекло!`) }
                    if (!answer1.payload) {
                        await context.send(`💡 Жмите только по кнопкам с иконками!`)
                    } else {
                        if (answer1.payload.command === 'access') {
                            const lvlup = await prisma.user.update({ where: { id: get_user.id }, data: { id_role: 2 } })
                            if (lvlup) {
                                await context.send(`⚙ Администратором становится ${get_user.name}`)
                                try {
                                    await vk.api.messages.send({
                                        user_id: get_user.idvk,
                                        random_id: 0,
                                        message: `⚙ Вас назначили администратором`
                                    })
                                    await context.send(`⚙ Операция назначения администратора завершена успешно.`)
                                } catch (error) {
                                    console.log(`User ${get_user.idvk} blocked chating with bank`)
                                }
                                await vk.api.messages.send({
                                    peer_id: chat_id,
                                    random_id: 0,
                                    message: `⚙ @id${context.senderId}(Root) > делает администратором @id${get_user.idvk}(${get_user.name})`
                                })
                                console.log(`Admin ${context.senderId} set status admin for ${get_user.idvk}`)
                            } else {
                                await context.send(`💡 Ошибка`)
                            }
                        }
                        if (answer1.payload.command === 'denied') {
                            const lvlup = await prisma.user.update({ where: { id: get_user.id }, data: { id_role: 1 } })
                            if (lvlup) {
                                await context.send(`⚙ Обычным пользователем становится ${get_user.name}`)
                                try {
                                    await vk.api.messages.send({
                                        user_id: get_user.idvk,
                                        random_id: 0,
                                        message: `⚙ Вас понизили до обычного пользователя`
                                    })
                                    await context.send(`⚙ Операция назначения пользователем завершена успешно.`)
                                } catch (error) {
                                    console.log(`User ${get_user.idvk} blocked chating with bank`)
                                }
                                await vk.api.messages.send({
                                    peer_id: chat_id,
                                    random_id: 0,
                                    message: `⚙ @id${context.senderId}(Root) > делает обычным пользователем @id${get_user.idvk}(${get_user.name})`
                                })
                                console.log(`Admin ${context.senderId} drop status admin for ${get_user.idvk}`)
                            } else {
                                await context.send(`💡 Ошибка`)
                            }
                        }
                        if (answer1.payload.command === 'cancel') {
                            await context.send(`💡 Тоже вариант`)
                        }
                    }
                }
			} else {
				await context.send(`💡 Нет такого банковского счета!`)
			}
        }
        await Keyboard_Index(context, `💡 Повышение в должности, не всегда понижение!`)
    })
    hearManager.hear(/енотик|!енотик/, async (context: any) => {
        if (await Accessed(context) == 2) {
            await context.sendDocuments({ value: `./prisma/dev.db`, filename: `dev.db` }, { message: '💡 Открывать на сайте: https://sqliteonline.com/' } );
            await vk.api.messages.send({
                peer_id: chat_id,
                random_id: 0,
                message: `‼ @id${context.senderId}(Admin) делает бекап баз данных dev.db.`
            })
        }
    })
    hearManager.hear(/!банк|!Банк/, async (context: any) => {
        const user_count = await prisma.user.count()
		const sums: any = await prisma.user.aggregate({ _sum: { gold: true, lvl: true, xp: true } })
		const artefacts: any = await prisma.artefact.count()
        const achievement: any = await prisma.achievement.count()
        const user_check: any = await prisma.user.findFirst({ where: { idvk: context.senderId } })
        const artefact_counter = await prisma.artefact.count({ where: { id_user: user_check.id } })
        const achievement_counter = await prisma.achievement.count({ where: { id_user: user_check.id } })
		await Image_Random(context, "bank")
        let text = `⌛ Пожалуйста, подождите и дождитесь выдачи кнопки для входа, подготавливаем для вас систему: \n\n`
		if (user_check.id_role != 1) {
            text += `🏦 Банк Гринготтс Онлайн 1.25v, общая статистика:\n👥 ${user_count}\n💰 ${sums._sum.gold}\n🧙 ${sums._sum.lvl*250+sums._sum.xp}\n🔮 ${artefacts}\n🌟 ${achievement}\n\n`
			await Keyboard_Index(context, `${text}`)
		} else {
            text += `🏦 Банк Гринготтс Онлайн 1.25v, общая статистика:\n👥 ${user_check.name}\n💰 ${user_check.gold}\n🧙 ${user_check.lvl*250+user_check.xp}\n🔮 ${artefact_counter}\n🌟 ${achievement_counter} \n\n`
			await Keyboard_Index(context, `${text}`)
		}
		const user_inf = await User_Info(context)
		await context.send(`${user_inf.first_name}, чтобы авторизоваться, нажмите кнопку под этим сообщением!`, {
			keyboard: new KeyboardBuilder().callbackButton({
				label: '✅ Подтвердить авторизацию',
				payload: {
					command: 'system_call',
					item: 'coffee'
				}
			}).inline()
		})
    })
    hearManager.hear(/!ездвиж/, async (context) => {
        await Location_Printer(context)
        await Keyboard_Index(context, `🏦 Хорошая работа, любители ез оценят! \n\n`)
    })
    hearManager.hear(/➕📦/, async (context) => {
        await Storage_Printer(context)
        await Keyboard_Index(context, `🏦 Говорят, тут можно хранить даже контрабанду! \n\n`)
    })
}

    

