import { KeyboardBuilder } from "vk-io"
import { Image_Random } from "../../core/imagecpu"
import prisma from "./prisma_client"
import { chat_id, vk } from "../../.."
import { randomInt } from "crypto"
import { Analyzer_Beer_Counter, Analyzer_Beer_Premium_Counter, Analyzer_Convert_MO_Counter, Analyzer_Quest_Counter, Analyzer_Underwear_Counter } from "./analyzer"

const timeouter = 86400000 //время кд квестов

export async function Service_Enter(context: any) {
    const attached = await Image_Random(context, "service")
    const user = await prisma.user.findFirst({ where: { idvk: context.peerId } })
    const keyboard = new KeyboardBuilder()
    .callbackButton({ label: '📈', payload: { command: 'service_level_up' }, color: 'secondary' })
    .callbackButton({ label: '📅', payload: { command: 'service_quest_open' }, color: 'secondary' })
    .callbackButton({ label: '👙', payload: { command: 'service_underwear_open' }, color: 'secondary' }).row()
    .callbackButton({ label: '🧙>💰', payload: { command: 'service_convert_magic_experience' }, color: 'secondary' })
    //.callbackButton({ label: '💰>🧙', payload: { command: 'service_convert_galleon' }, color: 'secondary' }).row()
    .callbackButton({ label: '🍺', payload: { command: 'service_beer_open' }, color: 'secondary' })
    .callbackButton({ label: '🍵', payload: { command: 'service_beer_premium_open' }, color: 'secondary' }).row()
    .callbackButton({ label: '🚫', payload: { command: 'system_call' }, color: 'secondary' }).row().inline().oneTime()
    const text = `✉ В данный момент доступны следующие операции:`
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${text}`, keyboard: keyboard, attachment: attached?.toString()})  
    if (context?.eventPayload?.command == "service_enter") {
        await vk.api.messages.sendMessageEventAnswer({
            event_id: context.eventId,
            user_id: context.userId,
            peer_id: context.peerId,
            event_data: JSON.stringify({
                type: "show_snackbar",
                text: `🔔 Ваш баланс: ${user?.xp}🧙 ${user?.gold}💰`
            })
        })
    }
}
export async function Service_Cancel(context: any) {
    await Service_Enter(context)
    await vk.api.messages.sendMessageEventAnswer({
        event_id: context.eventId,
        user_id: context.userId,
        peer_id: context.peerId,
        event_data: JSON.stringify({
            type: "show_snackbar",
            text: `🔔 Возврат в центр услуг.`
        })
    })
}
export async function Service_Convert_Galleon(context: any) {
    const user: any = await prisma.user.findFirst({ where: { idvk: context.peerId } })
    const attached = await Image_Random(context, "conv_gal")
    let text = `✉ Гоблин в черных очках предлагает обменять галлеоны на магический опыт.`
    const keyboard = new KeyboardBuilder()
    if (user.gold >= 1) { keyboard.callbackButton({ label: '1💰 => 2🧙', payload: { command: 'service_convert_galleon_change', item: "gold", value: 1 }, color: 'secondary' }) }
    if (user.gold >= 10) { keyboard.callbackButton({ label: '10💰 => 20🧙', payload: { command: 'service_convert_galleon_change', item: "gold", value: 10 }, color: 'secondary' }).row() }
    if (user.gold >= 100) { keyboard.callbackButton({ label: '100💰 => 200🧙', payload: { command: 'service_convert_galleon_change', item: "gold", value: 100 }, color: 'secondary' }) }
    if (user.gold >= 1000) { keyboard.callbackButton({ label: '1000💰 => 2000🧙', payload: { command: 'service_convert_galleon_change', item: "gold", value: 1000 }, color: 'secondary' }).row() }
    keyboard.callbackButton({ label: '🚫', payload: { command: 'service_cancel' }, color: 'secondary' }).row().inline().oneTime()
    text += user.gold <= 0 ? `\n\n💬 Ээээ, Бомжара, тикай с района! Кричали гоблины, выпинывая вас из учреждения...` : `\n\n🧷 На вашем балансе ${user?.gold}💰 ${user?.xp}🧙, сколько сконвертируем?`
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${text}`, keyboard: keyboard, attachment: attached?.toString()}) 
    if (context?.eventPayload?.command == "service_convert_galleon") {
        await vk.api.messages.sendMessageEventAnswer({
            event_id: context.eventId,
            user_id: context.userId,
            peer_id: context.peerId,
            event_data: JSON.stringify({
                type: "show_snackbar",
                text: `🔔 Услуга обмена 1 галлеона на 2 единицы магического опыта.`
            })
        })
    }
}
export async function Service_Convert_Galleon_Change(context: any) {
    const user: any = await prisma.user.findFirst({ where: { idvk: context.peerId } })
    if (context.eventPayload.command == "service_convert_galleon_change" && context.eventPayload.item == "gold") {
        const input = context.eventPayload.value
        if (input <= user.gold) {
            const convert_gal = await prisma.user.update({ where: { id: user.id }, data: { gold: user.gold-input, xp: user.xp+input*2 } })
            console.log(`User ${context.peerId} converted ${input} G in ${input*2}MO`)
            await vk.api.messages.sendMessageEventAnswer({
                event_id: context.eventId,
                user_id: context.userId,
                peer_id: context.peerId,
                event_data: JSON.stringify({
                    type: "show_snackbar",
                    text: `🔔 Конвертировано ${input}💰 в ${input*2}🧙.`
                })
            })
            await vk.api.messages.send({
                peer_id: chat_id,
                random_id: 0,
                message: `⌛ @id${user.idvk}(${user.name}) конвертирует ${input}💰 в ${input*2}🧙. \n💳 Баланс: ${convert_gal?.gold}💰 ${convert_gal?.xp}🧙`
            })
            await Service_Convert_Galleon(context)
        } else {
            await vk.api.messages.sendMessageEventAnswer({
                event_id: context.eventId,
                user_id: context.userId,
                peer_id: context.peerId,
                event_data: JSON.stringify({
                    type: "show_snackbar",
                    text: `🔔 Ошибка конвертирования галлеонов в магический опыт`
                })
            })
        }
    } 
}
export async function Service_Convert_Magic_Experience(context: any) {
    const user: any = await prisma.user.findFirst({ where: { idvk: context.peerId } })
    const attached = await Image_Random(context, "conv_mo")
    let text = `✉ Гоблин в черной одежде предлагает обменять магический опыт на галлеоны.`
    const keyboard = new KeyboardBuilder()
    if (user.xp >= 15) { keyboard.callbackButton({ label: '15🧙 => 5💰', payload: { command: 'service_convert_magic_experience_change', item: "xp", value: 15 }, color: 'secondary' }) }
    if (user.xp >= 30) { keyboard.callbackButton({ label: '30🧙 => 10💰', payload: { command: 'service_convert_magic_experience_change', item: "xp", value: 30 }, color: 'secondary' }).row() }
    if (user.xp >= 75) { keyboard.callbackButton({ label: '75🧙 => 25💰', payload: { command: 'service_convert_magic_experience_change', item: "xp", value: 75 }, color: 'secondary' }) }
    if (user.xp >= 150) { keyboard.callbackButton({ label: '150🧙 => 50💰', payload: { command: 'service_convert_magic_experience_change', item: "xp", value: 150 }, color: 'secondary' }).row() }
    keyboard.callbackButton({ label: '🚫', payload: { command: 'service_cancel' }, color: 'secondary' }).row().inline().oneTime()
    text += user.xp < 15 ? `\n\n💬 Ээээ, Бомжара, тикай с района! Кричали гоблины, выпинывая вас из учреждения...` : `\n\n🧷 На вашем балансе ${user?.xp}🧙 ${user?.gold}💰, сколько сконвертируем?`
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${text}`, keyboard: keyboard, attachment: attached?.toString()}) 
    if (context?.eventPayload?.command == "service_convert_magic_experience") {
        await vk.api.messages.sendMessageEventAnswer({
            event_id: context.eventId,
            user_id: context.userId,
            peer_id: context.peerId,
            event_data: JSON.stringify({
                type: "show_snackbar",
                text: `🔔 Услуга обмена 15 единиц магического опыта на 5 галлеонов.`
            })
        })
    }
}
export async function Service_Convert_Magic_Experience_Change(context: any) {
    const user: any = await prisma.user.findFirst({ where: { idvk: context.peerId } })
    if (context.eventPayload.command == "service_convert_magic_experience_change" && context.eventPayload.item == "xp") {
        const input = context.eventPayload.value
        if (input <= user.xp) {
            const convert_mo = await prisma.user.update({ where: { id: user.id }, data: { gold: user.gold+input/3, xp: user.xp-input } })
            console.log(`User ${context.peerId} converted ${input}MO in ${input/3}G`)
            await vk.api.messages.sendMessageEventAnswer({
                event_id: context.eventId,
                user_id: context.userId,
                peer_id: context.peerId,
                event_data: JSON.stringify({
                    type: "show_snackbar",
                    text: `🔔 Конвертировано ${input}🧙 в ${input/3}💰.`
                })
            })
            await vk.api.messages.send({
                peer_id: chat_id,
                random_id: 0,
                message: `⌛ @id${user.idvk}(${user.name}) конвертирует ${input}🧙 в ${input/3}💰. \n💳 Баланс: ${convert_mo?.xp}🧙 ${convert_mo?.gold}💰`
            })
            await Analyzer_Convert_MO_Counter(context)
            await Service_Convert_Magic_Experience(context)
        } else {
            await vk.api.messages.sendMessageEventAnswer({
                event_id: context.eventId,
                user_id: context.userId,
                peer_id: context.peerId,
                event_data: JSON.stringify({
                    type: "show_snackbar",
                    text: `🔔 Ошибка конвертирования магического опыта в галлеоны.`
                })
            })
        }
    } 
}
export async function Service_Level_Up(context: any) {
    const user: any = await prisma.user.findFirst({ where: { idvk: context.peerId } })
    const attached = await Image_Random(context, "lvl_up")
    let text = `✉ Гоблин в темных очках, предлагает вам повысить свой уровень.`
    const keyboard = new KeyboardBuilder()
    let paying = 250
    if (user.lvl == 0) { paying = 0 }
    if (user.xp >= paying) { keyboard.callbackButton({ label: `${paying}🧙 => 1📈`, payload: { command: 'service_level_up_change', item: "xp", value: paying }, color: 'secondary' }) }
    keyboard.callbackButton({ label: '🚫', payload: { command: 'service_cancel' }, color: 'secondary' }).row().inline().oneTime()
    text += user.xp < paying ? `\n\n💬 Ээээ, Бомжара, тикай с района! Кричали гоблины, выпинывая вас из учреждения...` : `\n\n🧷 На вашем балансе ${user?.xp}🧙, так давайте же прокачаемся?`
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${text}`, keyboard: keyboard, attachment: attached?.toString()}) 
    if (context?.eventPayload?.command == "service_level_up") {
        await vk.api.messages.sendMessageEventAnswer({
            event_id: context.eventId,
            user_id: context.userId,
            peer_id: context.peerId,
            event_data: JSON.stringify({
                type: "show_snackbar",
                text: `🔔 Услуга повышения уровня.`
            })
        })
    }
}
export async function Service_Level_Up_Change(context: any) {
    const attached = await Image_Random(context, "lvl_up")
    const user: any = await prisma.user.findFirst({ where: { idvk: context.peerId } })
    const leveling: any = {
        1: `1 уровень — стандартные возможности. Разрешается использование только волшебной палочки.`,
        2: `2 уровень — возможность добычи ингредиентов для зелий и т.д. в теплицах`,
        3: `3 уровень — доступен к покупке порошок мгновенной тьмы`,
        4: `4 уровень — доступно к покупке кольцо мыслей`,
        5: `5 уровень — разрешается использование невербальных заклинаний. Разрешается вступить в "Дуэльный Клуб"`,
        6: `6 уровень — доступно к покупке любовное зелье. Доступ к получению ингредиентов в кладовке профессора Снейпа с зельями`,
        7: `7 уровень — возможность обучиться анимагии (при наличии среднего балла по трансфигурации 4,8 из 5 за первые пять лет обучения), доступна к покупке мантия невидимости. Использование заклинаний без волшебной палочки. Также становится возможным укорочение постов для изучения заклинаний. 7 строк ПК вместо 15`,
        8: `8 уровень — открытие рынка магических животных от ХХХ. Можно купить зверька, на рынке будут выставлены его характеристики`,
        9: `9 уровень — возможность обучиться трансгресии (за плату)`,
        10: `10 уровень — создание собственных заклинаний и изобретение зелий/растений и т.д.`,
        11: `11 уровень — разрешение на использование магических созданий в качестве своих спутников, а также возможность путешествовать на магических существах, таких как гиппогрифы, драконы и т.д.`,
        12: `12 уровень — возможность обучиться легилименции и окклюменции (только мракоборцам!)`,
        13: `13 уровень — доступ к изучению тёмной магии (при наличии среднего балла по ЗоТИ и Заклинаниям 5 из 5 за первые пять лет обучения и адекватного обоснования, а также справки от целителей об адекватности желающего изучать данную практику)`,
        14: `14 уровень — доступ к библиотеке Бристона. Разрешается изучать запрещенные книги и свитки. Доступ к изучению древних магических практик и традиций, которые были забыты или потеряны на протяжении веков (при наличии среднего балла по ЗоТИ и Заклинаниям 5 из 5 за первые пять лет обучения и адекватного обоснования, а также справки от целителей об адекватности желающего изучать данную практику)`,
        15: `15 уровень — доступ к покупке и использованию темных артефактов. Доступ к изучению тёмных заклинаний, которые были запрещены Министерством Магии (даже если вы мракоборец!)`,
    }
    const keyboard = new KeyboardBuilder()
    let paying = 250
    if (user.lvl == 0) { paying = 0 }
    if (user.xp >= paying) { keyboard.callbackButton({ label: `${paying}🧙 => 1📈`, payload: { command: 'service_level_up_change', item: "xp", value: paying }, color: 'secondary' }) }
    keyboard.callbackButton({ label: '🚫', payload: { command: 'service_cancel' }, color: 'secondary' }).row().inline().oneTime()
    let text = ''
    let ii =''
    
    if (user.xp >= paying && user.lvl < 15) {
        const user_update = await prisma.user.update({ where: { id: user.id }, data: { xp: user.xp-paying, lvl: user.lvl+1 } })
        text += user.lvl == 0 ? `⚙ Поздравляем с повышением, первый раз бесплатно, далее за уровень по ${paying}🧙\n 🏦Разблокировка: ${leveling[user_update.lvl]}` : `⚙ Поздравляем с повышением! \n 🏦Разблокировка: ${leveling[user_update.lvl]}`
        ii += `Ваш уровень повышен с ${user.lvl} до ${user_update.lvl}. `
        await vk.api.messages.send({
            peer_id: chat_id,
            random_id: 0,
            message: `📈 @id${user.idvk}(${user.name}) повышает уровень с ${user.lvl} до ${user_update.lvl}.`
        })
        console.log(`User ${context.peerId} lvl up from ${user.lvl} to ${user_update.lvl}`)
    } else {
        text += user.lvl >= 15 ? `Вы достигли своего предела!` : `Недостаточно магического опыта! Необходимо ${paying}🧙 для повышения уровня.`
        console.log(`User ${context.peerId} have not enough MO for lvl up from ${user.lvl} to ${user.lvl++}`)
    }
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${text}`, keyboard: keyboard, attachment: attached?.toString()}) 
    await vk.api.messages.sendMessageEventAnswer({
        event_id: context.eventId,
        user_id: context.userId,
        peer_id: context.peerId,
        event_data: JSON.stringify({
            type: "show_snackbar",
            text: `🔔 Услуга повышения уровня.`
        })
    })
}
export async function Service_Beer_Open(context: any) {
    let attached = await Image_Random(context, "beer")
    const user: any = await prisma.user.findFirst({ where: { idvk: context.peerId } })
    const trigger: any = await prisma.trigger.findFirst({ where: { id_user: user.id, name: 'beer' } })
    if (!trigger) { 
        const trigger_init: any = await prisma.trigger.create({ data: { id_user: user.id, name: 'beer', value: false } })
        console.log(`Init beer for user ${context.peerId}`)
    }
    let text = ''
    const keyboard = new KeyboardBuilder()
    
    const trigger_check: any = await prisma.trigger.findFirst({ where: { id_user: user.id, name: 'beer' } })
    if (trigger_check.value == false) {
        if (user.gold >= 5 && context.eventPayload?.command_sub == 'beer_buying') {
            const underwear_sold: any = await prisma.user.update({ where: { id: user.id }, data: { gold: user.gold-5 } })
            const trigger_update: any = await prisma.trigger.update({ where: { id: trigger_check.id }, data: { value: true } })
            text = `⚙ Кто-бы мог подумать, у дверей возникло сливочное пиво прямиком из Хогсмида, снято 5💰. Теперь ваш баланс: ${underwear_sold.gold}`
            console.log(`User ${context.peerId} sold self beer`)
            await Analyzer_Beer_Counter(context)
        } else {
            if (user.gold >= 5) {
                text += `🍺 Желаете сливочного пива прямиком из Хогсмида с доставкой на дом, всего лишь за 5💰?`
                keyboard.callbackButton({ label: '-5💰+🍺', payload: { command: 'service_beer_open', command_sub: "beer_buying" }, color: 'secondary' }).row()
            } else {
                text += `🍺 Здесь должно было быть ваше пиво, но у вас нет даже 5💰!`
            }
        }
    } else {
        attached = await Image_Random(context, "beer_drop")
        const datenow: any = new Date()
        const dateold: any = new Date(trigger_check.crdate)
        if (datenow-trigger_check.crdate > timeouter && trigger_check.value) {
            const trigger_change: any = await prisma.trigger.update({ where: { id: trigger_check.id }, data: { crdate: datenow } })
            text += `🍺 Вы точно хотите, сдать бутылку 1.5 литра за 1💰?`
        } else {
            text = `🔔 Вы уже бухали по сливочному: ${dateold.getDate()}-${dateold.getMonth()}-${dateold.getFullYear()} ${dateold.getHours()}:${dateold.getMinutes()}! Приходите через ${((timeouter-(datenow-trigger_check.crdate))/60000/60).toFixed(2)} часов.`
        }
        if (context.eventPayload?.command_sub == 'beer_selling') {
            const underwear_sold: any = await prisma.user.update({ where: { id: user.id }, data: { gold: user.gold+1 } })
            const trigger_update: any = await prisma.trigger.update({ where: { id: trigger_check.id }, data: { value: false } })
            text = `⚙ Даже ваш староста зауважает вас, если узнает, что вы за экологию, +1💰. Теперь ваш баланс: ${underwear_sold.gold} Когда вы сдавали стеклотару, то вслед послышалось: \n — Воу респект, респект, еще бы пластик сдавали!`
            console.log(`User ${context.peerId} return self beer`)
        } else {
            if (datenow-trigger_check.crdate > timeouter && trigger_check.value) {
                keyboard.callbackButton({ label: '+1💰-🍺', payload: { command: 'service_beer_open', command_sub: "beer_selling" }, color: 'secondary' }).row()
            }
        }
    }
    keyboard.callbackButton({ label: '🚫', payload: { command: 'service_cancel' }, color: 'secondary' }).inline().oneTime()
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${text}`, keyboard: keyboard, attachment: attached?.toString()}) 
}

export async function Service_Beer_Premium_Open(context: any) {
    let attached = await Image_Random(context, "beer_premium")
    /*if (context?.eventPayload?.command == "service_beer_open") {
        await vk.api.messages.sendMessageEventAnswer({
            event_id: context.eventId,
            user_id: context.userId,
            peer_id: context.peerId,
            event_data: JSON.stringify({
                type: "show_snackbar",
                text: `🔔 Поставки нерентабельны, пройдите к клавиатуре...`
            })
        })
    }*/
    const user: any = await prisma.user.findFirst({ where: { idvk: context.peerId } })
    const trigger: any = await prisma.trigger.findFirst({ where: { id_user: user.id, name: 'beer_premium' } })
    if (!trigger) { 
        const trigger_init: any = await prisma.trigger.create({ data: { id_user: user.id, name: 'beer_premium', value: false } })
        console.log(`Init beer premium for user ${context.peerId}`)
    }
    let text = ''
    const keyboard = new KeyboardBuilder()
    
    const trigger_check: any = await prisma.trigger.findFirst({ where: { id_user: user.id, name: 'beer_premium' } })
    if (trigger_check.value == false) {
        if (user.gold >= 50 && context.eventPayload?.command_sub == 'beer_buying') {
            const underwear_sold: any = await prisma.user.update({ where: { id: user.id }, data: { gold: user.gold-50 } })
            const trigger_update: any = await prisma.trigger.update({ where: { id: trigger_check.id }, data: { value: true } })
            text = `⚙ Кто-бы мог подумать, у дверей возникло бамбуковое пиво прямиком из Хогсмида, снято 50💰. Теперь ваш баланс: ${underwear_sold.gold}`
            console.log(`User ${context.peerId} sold self beer premium`)
            await Analyzer_Beer_Premium_Counter(context)
        } else {
            if (user.gold >= 50) {
                text += `🍵 Желаете бамбукового пива PREMIUM прямиком из Хогсмида с доставкой на дом, всего лишь за 50💰?`
                keyboard.callbackButton({ label: '-50💰+🍵', payload: { command: 'service_beer_premium_open', command_sub: "beer_buying" }, color: 'secondary' }).row()
            } else {
                text += `🍵 Здесь должно было быть ваше бамбуковое PREMIUM пиво, но у вас нет даже 50💰!`
            }
        }
    } else {
        attached = await Image_Random(context, "beer_premium_drop")
        const datenow: any = new Date()
        const dateold: any = new Date(trigger_check.crdate)
        if (datenow-trigger_check.crdate > timeouter && trigger_check.value) {
            const trigger_change: any = await prisma.trigger.update({ where: { id: trigger_check.id }, data: { crdate: datenow } })
            text += `🍵 Вы точно хотите, сдать бамбуковую PREMIUM бутылку 1.5 литра за 10💰?`
        } else {
            text = `🔔 ТАААК, вам больше не наливаем, последний раз бухали: ${dateold.getDate()}-${dateold.getMonth()}-${dateold.getFullYear()} ${dateold.getHours()}:${dateold.getMinutes()}! Приходите через ${((timeouter-(datenow-trigger_check.crdate))/60000/60).toFixed(2)} часов за новой порцией.`
        }
        if (context.eventPayload?.command_sub == 'beer_selling') {
            const underwear_sold: any = await prisma.user.update({ where: { id: user.id }, data: { gold: user.gold+10 } })
            const trigger_update: any = await prisma.trigger.update({ where: { id: trigger_check.id }, data: { value: false } })
            text = `⚙ Даже ваш староста зауважает вас, если узнает, что вы за PREMIUM экологию, +10💰. Теперь ваш баланс: ${underwear_sold.gold} Когда вы сдавали стеклотару, то вслед послышалось: \n — Воу респект, респект, теперь мы на эту бутылку аж целых два сливочных пива прямиком из Хогсмида накатим!`
            console.log(`User ${context.peerId} return self beer`)
        } else {
            if (datenow-trigger_check.crdate > timeouter && trigger_check.value) {
                keyboard.callbackButton({ label: '+10💰-🍵', payload: { command: 'service_beer_premium_open', command_sub: "beer_selling" }, color: 'secondary' }).row()
            }
        }
    }
    keyboard.callbackButton({ label: '🚫', payload: { command: 'service_cancel' }, color: 'secondary' }).inline().oneTime()
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${text}`, keyboard: keyboard, attachment: attached?.toString()}) 
}

export async function Service_Quest_Open(context: any) {
    let attached = await Image_Random(context, "quest")
    const user: any = await prisma.user.findFirst({ where: { idvk: context.peerId } })
    const trigger: any = await prisma.trigger.findFirst({ where: { id_user: user.id, name: 'quest' } })
    if (!trigger) { 
        const trigger_init: any = await prisma.trigger.create({ data: { id_user: user.id, name: 'quest', value: false } })
        console.log(`Init question for user ${context.peerId}`)
    }
    let text = ''
    const keyboard = new KeyboardBuilder()
    
    const trigger_check: any = await prisma.trigger.findFirst({ where: { id_user: user.id, name: 'quest' } })
    if (trigger_check.value == false) {
        if (context.eventPayload?.command_sub == 'beer_buying') {
            const trigger_update: any = await prisma.trigger.update({ where: { id: trigger_check.id }, data: { value: true } })
            text = `⚙ Кто-бы мог подумать, у дверей возникла бумажка с надписью, вам поручено новое ежедневное задание, подробности в новом полученном сообщении...`
            console.log(`User ${context.peerId} got quest`)
            const user_list: any = await prisma.user.findMany({ where: { private: false} })
            const questuin_pull = [
                //Хогвартс
                { location: "Хогвартс", name: "Большой Зал", quest: [ "Попытаться украсть несколько свечек с потолка", "Оккупировать стол другого Факультета", "Подкинуть в тарелку с чужкой едой горстку соли", "Придумать план по захвату мира", "Придумать новый праздник и отметить его", "Создать семью яблок и банана" ] },
                { location: "Хогвартс", name: "Астрономическая Башня", quest: [ "Спеть песню «И камнем вниз...»", "Скинуть водные бомбочки с башни", "Подумать, почему солнце назвали солнцем", "Найти новую звезду и придумать название", "Проверить перила на прочность" ] },
                { location: "Хогвартс", name: "Гремучая Ива", quest: [ "Познакомиться с ветвями дерева", "Утроить бой с деревом", "Повесить конфеты на дерево", "Устроить показ мод", "Согреть иву с помощью шарфов" ] }, 
                { location: "Хогвартс", name: "Часовая Башня", quest: [ "Посчитать количество ударов часов за полдня", "Сочинить стихотворение", "Изучить механизм часов", "Зарисовать механизм часов", "Найти часового монстра" ] },
                { location: "Хогвартс", name: "Кухня", quest: [ "Приготовить шарлотку", "Помочь эльфам", "Перемыть всю посуду", "Придумать новое оригинальное блюдо", "Составить мен для профессоров на день" ] },
                { location: "Хогвартс", name: "Туалет Плаксы Миртл", quest: [ "Познакомиться с местным призраком", "Выплакаться мисс Миртл", "Погадать на картах таро на свою судьбу", "Поиграть в карты с Миртл", "Узнать о судьбе призрака" ] },
                { location: "Хогвартс", name: "Зал Наказаний", quest: [ "Испробовать на себе орудия пыток", "Найти местных духов", "Поговорить с холодной стеной", "Засунуть арбуз в гильотину" ] },
                { location: "Хогвартс", name: "Внутренний Двор", quest: [ "Посчитать камни на тропинке", "Обнять каждого встречного", "Искупаться в Дом", "Выловить на фонтана все монетки", "Устроить день отдыха и позагорать" ] },
                { location: "Хогвартс", name: "Запретный лес", quest: [ "Проследить за незнакомцем", "Встретить заход солнца", "Устроить охоту на зайцев", "Нарисовать пейзаж вечернего леса", "Найти отличное место для колдографий" ] },
                { location: "Хогвартс", name: "Правый коридор | 5 этаж", quest: [ "Нарисовать на полу портрет профессора МакГонагалл", "Поиграть в классики", "Покривляться и построить смешные рожицы" ] },
                { location: "Хогвартс", name: "Деревянный мост", quest: [ "Порыбачить с моста", "Посидеть на перилах", "Поиграть в шашки", "Проверить мост на прочность", "Пролететь под мостом на метле" ] },
                { location: "Хогвартс", name: "Совятня", quest: [ "Написать письмо домой", "Покормить птиц", "Убрать помет", "Устроить тусу птицам", "Сшить совам одежду" ] },
                { location: "Хогвартс", name: "Выручай-комната", quest: [ "Устроить вечер сказок", "Построить дом из одеял и кресел", "Устроить бой подушками" ] },
                { location: "Хогвартс", name: "Комната Пивза", quest: [ "Прибраться в комнате", "Позаимствовать несколько книг у сэра Пивза", "Покормить хомяков сэра Пивза" ] },
                { location: "Хогвартс", name: "Чердак", quest: [ "Сделать генеральную уборку", "Найти старинные украшения", "Прорепетировать ответ на уроке зельеварения" ] },
                { location: "Хогвартс", name: "Больничное крыло", quest: [ "Перевязать порезанную руку", "Оставить для больных сладости", "Навестить мадам Помфри", "Нарисовать себе синяк под глазом" ] },
                { location: "Хогвартс", name: "Вестибюль", quest: [ "Поцеловать стену", "Прокатиться на роликах", "Станцевать лезгинку", "Сделать себе боевой раскрас" ] },
                { location: "Хогвартс", name: "Опушка леса", quest: [ "Устроить пикник с лесными духами", "Поиграть в мяч", "Съесть траву", "Поймать бабочек" ] },
                { location: "Хогвартс", name: "Библиотека Хогвартса", quest: [ "Принести мадам Пинс в подарок коробку конфет", "Заклеить порванные книги" , "Положить в одну из книг небольшой подарочек", "Оставить в одной из книг записку" ] },
                { location: "Хогвартс", name: "Чёрное Озеро", quest: [ "Пустить в дальнее плавание мягкую игрушку", "Запустить бумажные кораблики", "Поиграть в блинчики", "Поплескаться в воде", "Покрасоваться своими новыми плавками/купальником" ] },
                { location: "Хогвартс", name: "Лестничные пролёты", quest: [ "Споткнуться о ступеньку и разбить коленку", "Поговорить с картинами", "Прокатиться на лестницах по всему замку" ] },
                { location: "Хогвартс", name: "Каменный Круг", quest: [ "Сосчитать все камни в кругу", "Придумать легенду о каменном человеке", "Развести костер, чтобы согреться " ] },
                { location: "Хогвартс", name: "Кабинет Зельеварения", quest: [ "Оставить профессору Снейпу тетрадь с его карикатурой", "Взорвать котел", "Поменять банки с игридиентами местами" ] },
                { location: "Хогвартс", name: "Подземелья Хогвартса", quest: [ "Оставить послание змейкам", "Измазать пол искусственной кровью", "Посадить плюшевую игрушку на потухший факел" ] },
                { location: "Хогвартс", name: "Прачечная", quest: [ "Закинуть в стирку чужие белые вещи с розовыми носками", "Затопить замок", "Разлить амортенцию на пол", "Порвать чью-то только что стиранную футболку", "Нарисовать на всей одежде черным маркером лицо профессора Макгонагалл" ] },
                { location: "Хогвартс", name: "Зал Славы", quest: [ "Незаметно украсть один из кубков", "Поставить свою шуточную грамоту к остальным ", "Налить в кубок сок и распивать, поднимая тосты " ] },
                { location: "Хогвартс", name: "Учебный Зал", quest: [ "Выкинуть книгу в окно", "Поджечь шторы", "Удивить всех присутствующих в зале своими жонглёрскими способностями" ] },
                { location: "Хогвартс", name: "Теплицы", quest: [ "Спародировать мандрагору", "Посадить монетку в землю", "Закопать кусок пиццы в горшок", "Станцевать на столе танго" ] },
                { location: "Хогвартс", name: "Тайная Комната", quest: [ "Попрыгать по лужам", "Найти чьи-то кости", "Вообразить себя супергероем", "Вооружиться вилкой и пойти в бой с самим собой " ] },
                { location: "Хогвартс", name: "Кладбище", quest: [ "Проверить могилы ", "Выкопать маленькую могилку для своей психики", "Написать на входе в кладбище «тут был я»", "Вызвать конфетного гномика" ] },
                { location: "Хогвартс", name: "Лодочный сарай", quest: [ "Устроить гонки на лодках без воды", "Покрасить лодку в красный цвет", "Вырезать в лодке дно", "Перекрыть вход в сарай" ] },
                { location: "Хогвартс", name: "Кабинет школьного психолога", quest: [ "Оставить психологу под дверью открытку", "Сломать дверь в кабинет психолога ", "Зайти в кабинет психолога в одном халате", "Выпить весь чай" ] },
                { location: "Хогвартс", name: "Коридор Одноглазой Ведьмы", quest: [ "Найти потайной проход в Хогсмид", "Оставить коробку со значками с пятой точкой кота", "Украсть один из факелов и спрятать его" ] },
                { location: "Хогвартс", name: "Комната 234-00", quest: [ "Забрать трусы Филча, пока его нет", "Подменить миссис Норис", "Подложить Филчу под матрас горошину", "Кинуть на стол под мусор кусок мяса" ] },
                { location: "Хогвартс", name: "Учительская", quest: [ "Принести профессорам завтрак в кабинет", "Украсть работы по заклинаниям", "Случайно пролить кофе на работы третьего курса" ] },
                { location: "Хогвартс", name: "Хижина Хагрида", quest: [ "Сходить на чай к профессору Хагриду ", "Подарить профессору животное", "Пригласить профессора Хагрида на прогулку во внутренний двор" ] },
                { location: "Хогвартс", name: "Коридоры", quest: [ "Примерить на себе доспехи", "Пройтись по стене", "Расставить по всем коридорам зеркала", "Побегать босиком" ] },
                //Бристон
                { location: "Бристон", name: "Филиал Некромантии и Бесоизгнания", quest: [ "Воскрешение умершей бабочки", "Изгнание бесов из кошки", "Знакомство с возможным будущим местом работы" ] },
                { location: "Бристон", name: "Суд", quest: [ "Знакомство с возможным будущим местом работы ", "Суд над совой, которая съела последний бутерброд", "Суд над будильником, что не дал поспать" ] },
                { location: "Бристон", name: "Парк", quest: [ "Устроить свадьбу для двух голубей", "Посрывать листья с деревьев и собрать из них букет", "Забрать лавочку и перетаскивать её за собой по всему парку" ] },
                { location: "Бристон", name: "Больница", quest: [ "Украсть вкусняшки с ресепшена", "Сдать анализы на гельминтов", "Шпионство в окна больницы за работниками", "Кража кресла с ресепшена" ] },
                { location: "Бристон", name: "Мракоборческий участок", quest: [ "Принести мракоборцам коробку пончиков", "Заигрывать с кем-нибудь из мракоборцев", "Попросить мракоборцев помочь донести до дома сумку с продуктами" ] },
                { location: "Бристон", name: "Заповедник", quest: [ "Покормить животных", "Перелезть через забор к домику лесника", "Вывести магических блох у гиппогрифа" ] },
                { location: "Бристон", name: "Торговый центр", quest: [ "Примерка новых луков", "Закупка продуктами", "Отдых в СПА", "Занятие в бассейне " ] },
                { location: "Бристон", name: "Лавка зелий и артефактов", quest: [ "Покупка зелья", "Консультация по поводу артефакта", "Разговор по душам с владельцем лавки" ] },
                { location: "Бристон", name: 'Бар "У Пьюси и Винтер"', quest: [ "Отдых с коктельчиком", "Потратить минимум 10 галлеонов в баре", "Полакомиться стейком из Грифона" ] },
                { location: "Бристон", name: "Магическая аптека", quest: [ "Покупка лекарств от мигрени", "Покупка лекарств от болей в животе", "Покупка аскорбинок", "Покупка гемотогенок" ] },
                { location: "Бристон", name: "Бухта Ингернах", quest: [ "Продажа рыбы", "Покупка удочки", "Покупка круга для купания " ] },
                { location: "Бристон", name: "Филиал Гильдии Артефакторов", quest: [ "Консультация по поводу артефактов", "Знакомство с возможным местом работы", "Выпрашивание какого-нибудь артефакта" ] },
                { location: "Бристон", name: 'Отель "Меллоу Брук"', quest: [ "Розыгрыш администратора", "Наслаждение свежим воздухом на террасе", "Обед в ресторане" ] },
                { location: "Бристон", name: "Закрытая пиццерия", quest: [ "Расспрос Джеффа о его матери", "Подкаты к присматривающему за заведением", "Просьба переночевать в пиццерии " ] },
                { location: "Бристон", name: "Волшебный зверинец", quest: [ "Покупка нового животного", "Заглянуть посмотреть на животных", "Выбор домашнего питомца" ] },
            ]
            const task = questuin_pull[Math.floor(Math.random() * questuin_pull.length)]
            const quest = task.quest[Math.floor(Math.random() * task.quest.length)]
            const reward_mo: number = randomInt(5, 51) //15МО = 5Г => 3MO = 1 G \2G
            const reward_gold: number = randomInt(1, 6) //2G
            await vk.api.messages.send({ user_id: context.peerId, random_id: 0, message: `⌛ Загружается новое событие...`})
            await vk.api.messages.send({ user_id: context.peerId, random_id: 0, message: `📅 Как насчет отролить с тем, с 👥 кем захотите?\n\n🌐 ${task.location}\n👣 ${task.name}\n⚡ ${quest}\n✅ ${reward_mo*2 + reward_gold*5} ПК+ \n🏆 Для 👤 ${reward_gold+4}💰 ${reward_mo}🧙.  Для 👥 ${reward_gold}💰 ${reward_mo}🧙\n\n💡 После выполнения квеста напишите в обсуждениях группы для ежедневных заданий. Если вам локация недоступна, выберите любую из доступных сами. Укажите ваш UID и вашего сорола, ссылки/скриншоты на ваши отролы.` })
            await vk.api.messages.send({ peer_id: chat_id, random_id: 0, message: `📅 Обнаружен квест для 👤@id${user.idvk}(${user.name}):\n\n🌐 ${task.location}\n👣 ${task.name}\n⚡ ${quest}\n✅ ${reward_mo*2 + reward_gold*5} ПК+ \n🏆 Для 👤 ${reward_gold+4}💰 ${reward_mo}🧙.  Для 👥 ${reward_gold}💰 ${reward_mo}🧙` })
            await Analyzer_Quest_Counter(context)
        } else {
            if (user) {
                text += `📅 Кто-то позвонил в дверь, открыть?`
                keyboard.callbackButton({ label: '+📅', payload: { command: 'service_quest_open', command_sub: "beer_buying" }, color: 'secondary' }).row()
            } else {
                text += `📅 Здесь должно было быть ваше ежедневное задание, но мы его еще не придумали!`
            }
        }
    } else {
        attached = await Image_Random(context, "quest_drop")
        const datenow: any = new Date()
        const dateold: any = new Date(trigger_check.crdate)
        if (datenow-trigger_check.crdate > timeouter && trigger_check.value) {
            const trigger_change: any = await prisma.trigger.update({ where: { id: trigger_check.id }, data: { crdate: datenow } })
            text += `📅 Вы точно хотите, приступить к новому квесту?`
        } else {
            text = `🔔 Вы уже получали задание: ${dateold.getDate()}-${dateold.getMonth()}-${dateold.getFullYear()} ${dateold.getHours()}:${dateold.getMinutes()}! Приходите через ${((timeouter-(datenow-trigger_check.crdate))/60000/60).toFixed(2)} часов за новым ЕЗ.`
        }
        if (context.eventPayload?.command_sub == 'beer_selling') {
            const trigger_update: any = await prisma.trigger.update({ where: { id: trigger_check.id }, data: { value: false } })
            text = `⚙ Вы опустили в магический шредер листовку с прошлым заданием`
            console.log(`User ${context.peerId} ready for new quest`)
        } else {
            if (datenow-trigger_check.crdate > timeouter && trigger_check.value) {
                keyboard.callbackButton({ label: '-📅', payload: { command: 'service_quest_open', command_sub: "beer_selling" }, color: 'secondary' }).row()
            }
        }
    }
    keyboard.callbackButton({ label: '🚫', payload: { command: 'service_cancel' }, color: 'secondary' }).inline().oneTime()
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${text}`, keyboard: keyboard, attachment: attached?.toString()}) 
}

export async function Service_Underwear_Open(context: any) {
    let attached = await Image_Random(context, "underwear")
    /*if (context?.eventPayload?.command == "service_underwear_open") {
        await vk.api.messages.sendMessageEventAnswer({
            event_id: context.eventId,
            user_id: context.userId,
            peer_id: context.peerId,
            event_data: JSON.stringify({
                type: "show_snackbar",
                text: `🔔 Если так хочется... То зайдите в услуги с помощью обычной клавиатуры`
            })
        })
    }*/
    let text = ''
    const keyboard = new KeyboardBuilder()
    
    const underwear = await prisma.trigger.count({ where: { name: 'underwear', value: true } })
    text = `💡 ${underwear} человек уже заложили свои труселя, как на счёт твоих?`
    const user: any = await prisma.user.findFirst({ where: { idvk: context.peerId } })
    const trigger: any = await prisma.trigger.findFirst({ where: { id_user: user.id, name: 'underwear' } })
    if (!trigger) { 
        const trigger_init: any = await prisma.trigger.create({ data: { id_user: user.id, name: 'underwear', value: false } })
        console.log(`Init underwear for user ${context.peerId}`)
    }
    const trigger_check: any = await prisma.trigger.findFirst({ where: { id_user: user.id, name: 'underwear' } })
    if (trigger_check.value == false) {
        text += `✉ Заложить трусы?`
        if (context.eventPayload?.command_sub == 'underwear_buying') {
            const underwear_sold: any = await prisma.user.update({ where: { id: user.id }, data: { gold: user.gold+5 } })
            const trigger_update: any = await prisma.trigger.update({ where: { id: trigger_check.id }, data: { value: true } })
            text = `⚙ Вы заложили свои трусы Гоблинам, держите 5💰. Теперь ваш баланс: ${underwear_sold.gold}`
            await vk.api.messages.send({
                peer_id: chat_id,
                random_id: 0,
                message: `⌛ Кто-то заложил свои трусы...`
            })
            console.log(`User ${context.peerId} sold self underwear`)
        } else {
            keyboard.callbackButton({ label: '+5💰-👙', payload: { command: 'service_underwear_open', command_sub: "underwear_buying" }, color: 'secondary' }).row()
        }
    } else {
        text += `✉ Выкупить трусы, не хотите?`
        if (context.eventPayload?.command_sub == 'underwear_selling') {
            if (user.gold >= 10) {
                const underwear_sold: any = await prisma.user.update({ where: { id: user.id }, data: { gold: user.gold-10 } })
                const trigger_update: any = await prisma.trigger.update({ where: { id: trigger_check.id }, data: { value: false } })
                text = `⚙ Вы выкупили свои трусы у Гоблинов, держите за 10💰. Теперь ваш баланс: ${underwear_sold.gold} Когда вы их забирали, то стоял шум от всего персонала банка: \n — Забирайте свои вонючие труханы, все хранилище нам завоняли!`
                await vk.api.messages.send({
                    peer_id: chat_id,
                    random_id: 0,
                    message: `⌛ Кто-то выкупил свои трусы...`
                })
                console.log(`User ${context.peerId} return self underwear`)
                await Analyzer_Underwear_Counter(context)
            } else { 
                text = 'Соболезнуем, для выкупа нужно 10 галлеонов, хотите в рабство? Дайте нам об этом знать:)'
            }
        } else {
            if (user.gold >= 10) {
                keyboard.callbackButton({ label: '—10💰+👙', payload: { command: 'service_underwear_open', command_sub: "underwear_selling" }, color: 'secondary' }).row()
            }
        }
    }
    keyboard.callbackButton({ label: '🚫', payload: { command: 'service_cancel' }, color: 'secondary' }).inline().oneTime()
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${text}`, keyboard: keyboard, attachment: attached?.toString()}) 
}