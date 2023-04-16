import { KeyboardBuilder } from "vk-io"
import { Image_Random } from "../../core/imagecpu"
import prisma from "./prisma_client"
import { chat_id, vk } from "../../.."
import { randomInt } from "crypto"

export async function Service_Enter(context: any) {
    const attached = await Image_Random(context, "service")
    const user = await prisma.user.findFirst({ where: { idvk: context.peerId } })
    const keyboard = new KeyboardBuilder()
    .callbackButton({ label: '📈', payload: { command: 'service_level_up' }, color: 'secondary' })
    .callbackButton({ label: '👙', payload: { command: 'service_underwear_open' }, color: 'secondary' }).row()
    .callbackButton({ label: '🧙>💰', payload: { command: 'service_convert_magic_experience' }, color: 'secondary' })
    .callbackButton({ label: '💰>🧙', payload: { command: 'service_convert_galleon' }, color: 'secondary' }).row()
    .callbackButton({ label: '🍺', payload: { command: 'service_beer_open' }, color: 'secondary' })
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
    text += user.gold <= 0 ? `\n\n💬 Ээээ, Бомжара, тиакай с района! Кричали гоблины, выпинывая вас из учреждения...` : `\n\n🧷 На вашем балансе ${user?.gold}💰 ${user?.xp}🧙, сколько сконвертируем?`
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
    text += user.xp < 15 ? `\n\n💬 Ээээ, Бомжара, тиакай с района! Кричали гоблины, выпинывая вас из учреждения...` : `\n\n🧷 На вашем балансе ${user?.xp}🧙 ${user?.gold}💰, сколько сконвертируем?`
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
    let paying = 150
    if (user.lvl == 0) { paying = 0 }
    if (user.xp >= paying) { keyboard.callbackButton({ label: `${paying}🧙 => 1📈`, payload: { command: 'service_level_up_change', item: "xp", value: paying }, color: 'secondary' }) }
    keyboard.callbackButton({ label: '🚫', payload: { command: 'service_cancel' }, color: 'secondary' }).row().inline().oneTime()
    text += user.xp < paying ? `\n\n💬 Ээээ, Бомжара, тиакай с района! Кричали гоблины, выпинывая вас из учреждения...` : `\n\n🧷 На вашем балансе ${user?.xp}🧙, так давайте же прокачаемся?`
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
        2: `2 уровень — возможность добычи ингредиентов для зелий и т.д. в теплицах.`,
        3: `3 уровень — разрешается поход в Хогсмид, доступен к покупке порошок мгновенной тьмы. Разрешается вступить в "Дуэльный Клуб".`,
        4: `4 уровень — возможность пользоваться услугами банка "Гринготтс" в полной мере. Самостоятельное изучение любых трёх заклинаний, которые вы должны будете написать Флитвику. Чтобы вы могли их использовать, вы должны описать изучение каждого минимум в 15 комп. строках, и после двух использования в локациях заклинание будет действовать стабильно. Заклинания можно выбрать те, что изучаются на более старших курсах, чем сейчас вы (максимум на два вперёд).`,
        5: `5 уровень — разрешается использование невербальных заклинаний.`,
        6: `6 уровень — доступно к покупке любовное зелье. Доступ к получению ингредиентов в кладовке профессора Снейпа с зельями. Доступна окклюменция.`,
        7: `7 уровень — возможность обучиться анимагии, доступна к покупке мантия невидимости. Использование заклинаний без волшебной палочки. Доступна легилименция.,
        Также становится возможным укорочение постов для изучения заклинаний. 7 строк ПК вместо 15.`,
        8: `8 уровень — возможность стать полноценным работником газеты "Ежедневного Пророка" и получать за каждую статью по 15 МО и по 10 галлеонов. Открытие рынка магических животных от ХХХ. Можно купить зверька, на рынке будут выставлены его характеристики.`,
        9: `9 уровень — возможность обучиться трансгресии, доступ к изучению тёмной магии.`,
        10: `10 уровень — создание собственных заклинаний и изобретение зелий/растений и т.д.`,
        11: `11 уровень — обычный уровень`,
        12: `12 уровень — редкий уровень`,
        13: `13 уровень — эпический уровень`,
        14: `14 уровень — легендарный уровень`,
        15: `15 уровень — мифический уровень`,
    }
    const keyboard = new KeyboardBuilder()
    let paying = 150
    if (user.lvl == 0) { paying = 0 }
    if (user.xp >= paying) { keyboard.callbackButton({ label: `150🧙 => 1📈`, payload: { command: 'service_level_up_change', item: "xp", value: 150 }, color: 'secondary' }) }
    keyboard.callbackButton({ label: '🚫', payload: { command: 'service_cancel' }, color: 'secondary' }).row().inline().oneTime()
    let text = ''
    let ii =''
    
    if (user.xp >= paying && user.lvl < 15) {
        const user_update = await prisma.user.update({ where: { id: user.id }, data: { xp: user.xp-paying, lvl: user.lvl+1 } })
        text += user.lvl == 0 ? `⚙ Поздравляем с повышением, первый раз бесплатно, далее за уровень по 150🧙\n 🏦Разблокировка: ${leveling[user_update.lvl]}` : `⚙ Поздравляем с повышением! \n 🏦Разблокировка: ${leveling[user_update.lvl]}`
        ii += `Ваш уровень повышен с ${user.lvl} до ${user_update.lvl}. `
        await vk.api.messages.send({
            peer_id: chat_id,
            random_id: 0,
            message: `📈 @id${user.idvk}(${user.name}) повышает уровень с ${user.lvl} до ${user_update.lvl}.`
        })
        console.log(`User ${context.peerId} lvl up from ${user.lvl} to ${user_update.lvl}`)
    } else {
        text += user.lvl >= 15 ? `Вы достигли своего предела!` : `Недостаточно магического опыта! Необходимо 150🧙 для повышения уровня.`
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
    const trigger: any = await prisma.trigger.findFirst({ where: { id_user: user.id, name: 'beer' } })
    if (!trigger) { 
        const trigger_init: any = await prisma.trigger.create({ data: { id_user: user.id, name: 'beer', value: false } })
        console.log(`Init beer for user ${context.peerId}`)
    }
    let text = ''
    const keyboard = new KeyboardBuilder()
    
    const trigger_check: any = await prisma.trigger.findFirst({ where: { id_user: user.id, name: 'beer' } })
    if (trigger_check.value == false) {
        if (user.gold >= 5) {
            text += `🍺 Желаете сливочного пива прямиком из Хогсмида с доставкой на дом, всего лишь за 5💰? \n 💡В случае отрола затраты на пиво будут компенсированы!`
            keyboard.callbackButton({ label: '-5💰+🍺', payload: { command: 'service_beer_open', command_sub: "beer_buying" }, color: 'secondary' }).row()
        } else {
            text += `🍺 Здесь должно было быть ваше пиво, но у вас нет даже 5💰!`
        }
        keyboard.callbackButton({ label: '🚫', payload: { command: 'service_cancel' }, color: 'secondary' }).inline().oneTime()
        
        if (user.gold >= 5 && context.eventPayload?.command_sub == 'beer_buying') {
            const underwear_sold: any = await prisma.user.update({ where: { id: user.id }, data: { gold: user.gold-5 } })
            const trigger_update: any = await prisma.trigger.update({ where: { id: trigger_check.id }, data: { value: true } })
            text = `⚙ Кто-бы мог подумать, у дверей возникло сливочное пиво прямиком из Хогсмида, снято 5💰. Теперь ваш баланс: ${underwear_sold.gold}`
            console.log(`User ${context.peerId} sold self beer`)
            const user_list: any = await prisma.user.findMany({ where: { private: false} })
            const location_list: any = {
                "Хогвартс": [ "Большой Зал", "Астрономическая Башня", "Гремучая Ива", "Часовая Башня", "Кухня", "Туалет Плаксы Миртл", "Кухня", "Зал Наказаний", "Внутренний Двор", "Запретный лес", "Правый коридор | Пятый этаж", "Деревянный мост", "Совятня", "Выручай-комната", "Комната Пивза", "Чердак", "Больничное крыло", "Вестибюль", "Опушка леса", "Библиотека Хогвартса", "Чёрное Озеро", "Лестничные пролёты", "Каменный Круг", "Кабинет Зельеварения", "Подземелья Хогвартса", "Прачечная", "Зал Славы", "Учебный Зал", "Теплицы", "Тайная Комната", "Кладбище", "Лодочный сарай", "Кабинет школьного психолога", "Коридор Одноглазой Ведьмы", "Комната 234-00", "Учительская", "Хижина Хагрида", "Коридоры", "Учительская"],
                "Бристон": [ 'Стрип-клуб "MurMur angels-club"', "Филиал Некромантии и Бесоизгнания", "Суд", "ЗаМУРчательное кафе", "Парк", "Больница", "Мракоборческий участок", "Заповедник", "Торговый центр", "Лавка зелий и артефактов", 'Бар "У Пьюси и Винтер"', "Магическая аптека", "Бухта Ингернах", "Филиал Гильдии Артефакторов", 'Отель "Меллоу Брук"', "Закрытая пиццерия", "Волшебный зверинец",],
                "Пиво из Хогсмида": [ 'Паб "Три метлы"', 'Трактир "Кабанья голова"']
            }
            const location_name : any = ["Хогвартс", "Бристон"]
            const selector = randomInt(0, location_name.length)
            const tara = randomInt(0, location_list[location_name[selector]].length)
            const rana = randomInt(0, user_list.length)
            const task_list: any = { "Большой зал": ["Попытаться украсть несколько свечек с потолка", "Оккупировать стол другого Факультета", "Подкинуть в тарелку с чужкой едой горстку соли", "Придумать план по захвату мира", "Придумать новый праздник и отметить его", "Создать семью яблок и банана" ],
                                "Астрономическая Башня": ["Спеть песню «И камнем вниз...»", "Скинуть водные бомбочки с башни", "Подумать, почему солнце назвали солнцем", "Поиграть в догони меня кирпич", "Проверить перила на прочность" ],
                                "Гремучая Ива": [ "Познакомиться с ветвями дерева", "Утроить бой с деревом", "Повесить конфеты на дерево", "Устроить показ мод", "Согреть иву с помощью шарфов" ],
                                "Часовая Башня": [ "Посчитать количество ударов часов за полдня", "Сочинить стихотворение", "Изучить механизм часов", "Зарисовать механизм часов", "Найти часового монстра" ],
                                "Кухня": ["Приготовить шарлотку", "Помочь эльфам", "Перемыть всю посуду", "Придумать новое оригинальное блюдо", "Составить мен для профессоров на день" ],
                                "Туалет Плаксы Миртл": [ "Познакомиться с местным призраком", "Выплакаться мисс Миртл", "Погадать на картах таро на свою судьбу", "Поиграть в карты с Миртл", "Узнать о судьбе призрака" ],
                                "Зал наказаний": [ "Испробовать на себе орудия пыток", "Найти местных духов", "Поговорить с холодной стеной", "Засунуть арбуз в гильотину" ],
                                "Внутренний двор": [ "Посчитать камни на тропинке", "Обнять каждого встречного", "Искупаться в Дом", "Выловить на фонтана все монетки", "Устроить день отдыха и позагорать" ],
                                "Запретный лес": [ "Проследить за незнакомцем", "Встретить заход солнца", "Устроить охоту на зайцев", "Нарисовать пейзаж вечернего леса", "Найти отличное место для колдографий" ],
                                "Правый коридор | Пятый этаж": [ "Нарисовать на полу портрет профессора Макгонагалд", "Поиграть в классики", "Покривляться и построить смешные рожицы" ],
                                "Деревянный мост": [ "Спрыгнуть с моста в воду", "Посидеть на перилах", "Поиграть в шашки", "Проверить мост на прочность", "Скатиться с моста на скейте" ],
                                "Совятня": [ "Написать письмо домой", "Покормить птиц", "Убрать помет", "Устроить тусу птицам", "Сшить совам одежду" ],
                                "Выручай-комната": [ "Устроить вечер сказок", "Построить дом из одеял и кресел", "Устроить бой подушками" ],
                                "Комната Пивза": [ "Прибраться в комнате", "Позаимствовать несколько книг у сэра Пивза", "Покормить хомяков сэра Пивза" ],
                                "Чердак": [ "Сделать генеральную уборку", "Найти старинные украшения", "Прорепетировать ответ на уроке зельеварения" ],
                                "Больничное крыло": [ "Перевязать порезанную руку", "Оставить для больных сладости", "Навестить мадам Помфри", "Нарисовать себе синяк под глазом" ],
                                "Вестибюль": [ "Поцеловать стену", "Прокатиться на роликах", "Станцевать лезгинку", "Сделать себе боевой раскрас" ],
                                "Опушка леса": [ "Устроить пикник с лесными духами", "Поиграть в мяч", "Съесть траву", "Поймать бабочек" ],
                                "Библиотека Хогвартса": [ "Принести мадам Пинс в подарок коробку конфет", "Заклеить порванные книги" , "Положить в одну из книг небольшой подарочек", "Оставить в одной из книг записку" ],
                                "Чёрное Озеро": [ "Пустить в дальнее плавание мягкую игрушку", "Запустить бумажные кораблики", "Поиграть в блинчики", "Поплескаться в воде", "Покрасоваться своими новыми плавками/купальником" ],
                                "Лестничные пролёты": [ "Споткнуться о ступеньку и разбить коленку", "Поговорить с картинами", "Прокатиться на лестницах по всему замку" ],
                                "Каменный Круг": [ "Сосчитать все камни в кругу", "Придумать легенду о каменном человеке", "Развести костер, чтобы согреться " ],
                                "Кабинет Зельеварения": [ "Оставить профессору Снейпу тетрадь с его карикатурой", "Взорвать котел", "Поменять банки с игридиентами местами" ],
                                "Подземелья Хогвартса": [ "Оставить послание змейкам", "Измазать пол искусственной кровью", "Посадить плюшевую игрушку на потухший факел" ],
                                "Прачечная": [ "Закинуть в стирку чужие белые вещи с розовыми носками", "Затопить замок", "Разлить амортенцию на пол", "Порвать чью-то только что стиранную футболку", "Нарисовать на всей одежде черным маркером лицо профессора Макгонагалл" ],
                                "Зал Славы": [ "Незаметно украсть один из кубков", "Поставить свою шуточную грамоту к остальным ", "Налить в кубок сок и распивать, поднимая тосты " ],
                                "Учебный Зал": [ "Выкинуть книгу в окно", "Поджечь шторы", "Удивить всех присутствующих в зале своими жонглёрскими способностями" ],
                                "Теплицы": [ "Спародировать мандрагору", "Посадить монетку в землю", "Закопать кусок пиццы в горшок", "Станцевать на столе танго" ],
                                "Тайная Комната": [ "Попрыгать по лужам", "Найти чьи-то кости", "Вообразить себя супергероем", "Вооружиться вилкой и пойти в бой с самим собой " ],
                                "Кладбище": [ "Проверить могилы ", "Выкопать маленькую могилку для своей психики", "Написать на входе в кладбище «тут был я»", "Вызвать конфетного гномика" ],
                                "Лодочный сарай": [ "Устроить гонки на лодках без воды", "Покрасить лодку в красный цвет", "Вырезать в лодке дно", "Перекрыть вход в сарай" ],
                                "Кабинет школьного психолога": [ "Оставить психологу под дверью открытку", "Сломать дверь в кабинет психолога ", "Зайти в кабинет психолога в одном халате", "Выпить весь чай" ],
                                "Коридор Одноглазой Ведьмы": [ "Найти потайной проход в Хогсмид", "Оставить коробку со значками с пятой точкой кота", "Украсть один из факелов и спрятать его" ],
                                "Комната 234-00": [ "Забрать трусы Филча, пока его нет", "Подменить миссис Норис", "Подложить Филчу под матрас горошину", "Кинуть на стол под мусор кусок мяса" ],
                                "Учительская": [ "Принести профессорам завтрак в кабинет", "Украсть работы по заклинаниям", "Случайно пролить кофе на работы третьего курса" ],
                                "Хижина Хагрида": [ "Сходить на чай к профессору Хагриду ", "Подарить профессору животное", "Пригласить профессора Хагрида на прогулку во внутренний двор" ],
                                "Коридоры": [ "Примерить на себе доспехи", "Пройтись по стене", "Расставить по всем коридорам зеркала", "Побегать босиком" ],
                                //Бристон
                                'Стрип-клуб "MurMur angels-club"': [ "Подача резюме на работу", "Подделка документов", "Кража конфеток с ресепшена" ],
                                "Филиал Некромантии и Бесоизгнания": [ "Воскрешение умершей бабочки", "Изгнание бесов из кошки", "Знакомство с возможным будущим местом работы" ],
                                "Суд": [ "Знакомство с возможным будущим местом работы ", "Суд над совой, которая съела последний бутерброд", "Суд над будильником, что не дал поспать" ],
                                "ЗаМУРчательное кафе": [ "Кошачья терапия", "Проверка заболевшего домашнего питомца", "Разложиться на стойке для заказов" ],
                                "Парк": [ "Устроить свадьбу для двух голубей", "Посрывать листья с деревьев и собрать из них букет", "Забрать лавочку и перетаскивать её за собой по всему парку" ],
                                "Больница": [ "Украсть вкусняшки с ресепшена", "Похищение анализов", "Шпионство в окна больницы за работниками", "Кража кресла с ресепшена" ],
                                "Мракоборческий участок": [ "Кража ключей от решёток", "Выбить окно в участке", "Вынес всех важных документов " ],
                                "Заповедник": [ "Кража редких животных", "Перелезть через забор к домику лесника", "Спилить несколько деревьев" ],
                                "Торговый центр": [ "Примерка новых луков", "Закупка продуктами", "Отдых в СПА", "Занятие в бассейне " ],
                                "Лавка зелий и артефактов": [ "Покупка зелья", "Консультация по поводу артефакта", "Разговор по душам с владельцем лавки" ],
                                'Бар "У Пьюси и Винтер"': [ "Отдых с коктельчиком", "Потратить минимум 10 галлеонов в баре", "Полакомиться стейком из Грифона" ],
                                "Магическая аптека": [ "Покупка лекарств от мигрени", "Покупка лекарств от болей в животе", "Покупка аскорбинок", "Покупка гемотогенок" ],
                                "Бухта Ингернах": [ "Продажа рыбы", "Покупка удочки", "Покупка круга для купания " ],
                                "Филиал Гильдии Артефакторов": [ "Консультация по поводу артефактов", "Знакомство с возможным местом работы", "Выпрашивание какого-нибудь артефакта" ],
                                'Отель "Меллоу Брук"': [ "Розыгрыш администратора", "Наслаждение свежим воздухом на террасе", "Обед в ресторане" ],
                                "Закрытая пиццерия": [ "Расспрос Джеффа о его матери", "Подкаты к присматривающему за заведением", "Просьба переночевать в пиццерии " ],
                                "Волшебный зверинец": [ "Покупка нового животного", "Заглянуть посмотреть на животных", "Выбор домашнего питомца" ],
                                //Паб
                                'Паб "Три метлы"': [ "Развести мадам Розмерту на свиное жаркое", "Напиться от горя сливочным пивом ", "Угостить незнакомца медовухой" ],
                                'Трактир "Кабанья голова"': [ "Оставить свой след на вывеске", "Выпить бокальчик смородинового Рома", "Залезть под стол и громко кукарекать" ]
            }
            const task = task_list[location_list[location_name[selector]][tara]][randomInt(0,task_list[location_list[location_name[selector]][tara]].length)] || "Божественный напиток"
            await vk.api.messages.send({ user_id: context.peerId, random_id: 0, message: `⌛ Загружается новое событие...`})
            const reward: number = randomInt(5, 50) //15МО = 5Г => 3MO = 1 G \2G
            const reward2: number = randomInt(1, 5) //2G
            await vk.api.messages.send({ user_id: context.peerId, random_id: 0, message: `🍻Как насчет выпить с 👤@id${user_list[rana].idvk}(${user_list[rana].name}): \n \n 🌐 ${location_name[selector]} \n 👣 ${location_list[location_name[selector]][tara]} \n ⚡ ${task} \n ✅ ${reward*2 + reward2*5} ПК+ \n🏆 ${reward2+4}💰 ${reward}🧙` })
            await vk.api.messages.send({
                peer_id: chat_id,
                random_id: 0,
                message: `🍻 Обнаружен отрол: \n 👤@id${user.idvk}(${user.name}) \n 👥@id${user_list[rana].idvk}(${user_list[rana].name})  \n \n 🌐 ${location_name[selector]} \n 👣 ${location_list[location_name[selector]][tara]} \n ⚡ ${task} \n ✅ ${reward*2 + reward2*5} ПК+ \n🏆 Для 👤 ${reward2+4}💰 ${reward}🧙.  Для 👥${reward2}💰 ${reward}🧙`
            })
            try {
                await vk.api.messages.send({
                    user_id: user_list[rana].idvk,
                    random_id: 0,
                    message: `⌛ Загружается новое событие...`
                })
                await vk.api.messages.send({
                    user_id: user_list[rana].idvk,
                    random_id: 0,
                    message: `🍻Как насчет выпить с 👤@id${user.idvk}(${user.name}): \n \n 🌐 ${location_name[selector]} \n 👣 ${location_list[location_name[selector]][tara]} \n ⚡ ${task} \n ✅ ${reward*2 + reward2*5} ПК+ \n🏆 ${reward2}💰 ${reward}🧙`
                })
            } catch (error) {
                console.log(`User ${user_list[rana].idvk} blocked chating with bank!`)
            }
        }
    } else {
        attached = await Image_Random(context, "beer_drop")
        const datenow: any = new Date()
        const dateold: any = new Date(trigger_check.crdate)
        if (datenow-trigger_check.crdate > 86400000 && trigger_check.value) {
            const trigger_change: any = await prisma.trigger.update({ where: { id: trigger_check.id }, data: { crdate: datenow } })
            text += `🍺 Вы точно хотите, сдать бутылку 1.5 литра за 1💰?`
            keyboard.callbackButton({ label: '+1💰-🍺', payload: { command: 'service_beer_open', command_sub: "beer_selling" }, color: 'secondary' }).row()
        } else {
            text = `🔔 Вы уже получали задание: ${dateold.getDate()}-${dateold.getMonth()}-${dateold.getFullYear()} ${dateold.getHours()}:${dateold.getMinutes()}! Приходите через ${((86400000-(datenow-trigger_check.crdate))/60000/60).toFixed(2)} часов.`
        }
        keyboard.callbackButton({ label: '🚫', payload: { command: 'service_cancel' }, color: 'secondary' }).inline().oneTime()
        if (context.eventPayload?.command_sub == 'beer_selling') {
            const underwear_sold: any = await prisma.user.update({ where: { id: user.id }, data: { gold: user.gold+1 } })
            const trigger_update: any = await prisma.trigger.update({ where: { id: trigger_check.id }, data: { value: false } })
            text = `⚙ Даже ваш староста зауважает вас, если узнает, что вы за экологию, +1💰. Теперь ваш баланс: ${underwear_sold.gold} Когда вы сдавали стеклотару, то вслед послышалось: \n — Воу респект, респект, еще бы пластик сдавали!`
            console.log(`User ${context.peerId} return self beer`)
        }
    }
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
    text = `💡 ${underwear} человек уже заложило свои труселя, как на счёт твоих?`
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
        keyboard.callbackButton({ label: '🚫', payload: { command: 'service_cancel' }, color: 'secondary' }).inline().oneTime()
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
            } else { 
                text = 'Соболезнуем, для выкупа нужно 10 галлеонов, хотите в рабство? Дайте нам об этом знать:)'
            }
        } else {
            if (user.gold >= 10) {
                keyboard.callbackButton({ label: '—10💰+👙', payload: { command: 'service_underwear_open', command_sub: "underwear_selling" }, color: 'secondary' }).row()
            }
        }
        keyboard.callbackButton({ label: '🚫', payload: { command: 'service_cancel' }, color: 'secondary' }).inline().oneTime()
    }
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${text}`, keyboard: keyboard, attachment: attached?.toString()}) 
}