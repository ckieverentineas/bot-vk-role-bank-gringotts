import { PrismaClient } from "@prisma/client"
import { randomInt } from "crypto"
import { Keyboard, KeyboardBuilder, PhotoAttachment } from "vk-io"
import { answerTimeLimit, chat_id, group_id, root, starting_date, vk } from "../.."
import { Image_Interface, Image_Random } from "./imagecpu"
import { promises as fsPromises } from 'fs'

const prisma = new PrismaClient()

export type VkId = number | bigint | string

export function To_Vk_Id(idvk: VkId | null | undefined): number {
    const id = Number(idvk)
    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error(`Invalid VK id: ${String(idvk)}`)
    }
    return id
}

const QUESTION_CONTEXT_PATCH_FLAG = '__question_context_patched'
const QUESTION_CONTEXT_SEND_PATCH_FLAG = '__question_context_send_patched'
const QUESTION_CONTEXT_SUPPRESS_TIMEOUT_FLAG = '__question_context_suppress_timeout'
const QUESTION_BACK_COMMANDS = new Set(['back', 'назад', '🔙', 'вернуться'])
const QUESTION_CANCEL_COMMANDS = new Set(['cancel', 'отмена', '🚫', 'выход', 'стоп', 'exit'])

function Normalize_Question_Command(input: any): string {
    return String(input ?? '').trim().toLowerCase()
}

function Build_Question_Control_Keyboard() {
    return Keyboard.builder()
    .textButton({ label: '🔙', payload: { command: 'back' }, color: 'secondary' })
    .textButton({ label: '🚫', payload: { command: 'cancel' }, color: 'negative' })
    .oneTime()
}

export function Question_Is_Back(answer: any): boolean {
    const command = Normalize_Question_Command(answer?.payload?.command)
    if (command === 'back') {
        return true
    }
    const text = Normalize_Question_Command(answer?.text)
    if (QUESTION_BACK_COMMANDS.has(text)) {
        return true
    }
    return text.includes('back') || text.includes('назад')
}

export function Question_Is_Cancel(answer: any): boolean {
    const command = Normalize_Question_Command(answer?.payload?.command)
    if (command === 'cancel') {
        return true
    }
    const text = Normalize_Question_Command(answer?.text)
    return QUESTION_CANCEL_COMMANDS.has(text)
}

async function Question_Cancel_To_Main_Menu(context: any) {
    const rawIdvk = context?.senderId ?? context?.peerId ?? context?.userId
    if (!rawIdvk) {
        return
    }

    const idvk = To_Vk_Id(rawIdvk)
    const user = await prisma.user.findFirst({ where: { idvk } })
    if (!user) {
        await Send_Message_Universal(context.peerId, `⚙ Операция отменена. Для запуска новой сессии напишите !банк`)
        return
    }

    try {
        const { Main_Menu } = await import('../events/contoller')
        const { image_bank } = await import('../data_center/system_image')
        const keyboard = await Main_Menu(context)
        await Send_Message_Universal(context.peerId, `⚙ Операция отменена пользователем. Возврат в главное меню.`, keyboard, image_bank)
    } catch (e) {
        console.log(`Ошибка возврата в главное меню после отмены: ${e}`)
    }
}

export function Patch_Question_Context(context: any) {
    if (!context || typeof context.question !== 'function') {
        return
    }

    if (!context[QUESTION_CONTEXT_SEND_PATCH_FLAG] && typeof context.send === 'function') {
        const sourceSend = context.send.bind(context)
        context.send = async (message: any, params?: any) => {
            const suppressTimeout = Boolean(context[QUESTION_CONTEXT_SUPPRESS_TIMEOUT_FLAG])
            const text = String(message ?? '').toLowerCase()
            if (suppressTimeout && (text.includes('время ожидания') || text.startsWith('⏰'))) {
                context[QUESTION_CONTEXT_SUPPRESS_TIMEOUT_FLAG] = false
                return null
            }
            return sourceSend(message, params)
        }
        context[QUESTION_CONTEXT_SEND_PATCH_FLAG] = true
    }

    if (context[QUESTION_CONTEXT_PATCH_FLAG]) {
        return
    }

    const sourceQuestion = context.question.bind(context)

    context.question = async (message: string, options: any = {}) => {
        const hasKeyboard = Boolean(options?.keyboard)
        const questionOptions = hasKeyboard
            ? options
            : {
                ...options,
                keyboard: Build_Question_Control_Keyboard()
            }

        const answer: any = await sourceQuestion(message, questionOptions)

        if (answer) {
            if (answer.messagePayload) {
                answer.payload = answer.messagePayload
            } else {
                answer.payload = undefined
            }
        }

        if (answer && !answer.payload) {
            const rawText = Normalize_Question_Command(answer.text)
            if (QUESTION_BACK_COMMANDS.has(rawText)) {
                answer.payload = { command: 'back' }
            } else if (QUESTION_CANCEL_COMMANDS.has(rawText)) {
                answer.payload = { command: 'cancel' }
            }
        }

        if (Question_Is_Back(answer)) {
            answer.isBack = true
        }
        if (Question_Is_Cancel(answer)) {
            answer.isCancel = true
            context[QUESTION_CONTEXT_SUPPRESS_TIMEOUT_FLAG] = true
            await Question_Cancel_To_Main_Menu(context)
            answer.isTimeout = true
        }

        return answer
    }

    context[QUESTION_CONTEXT_PATCH_FLAG] = true
}

export function Sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export async function Gen_Inline_Button(context: any, weapon_type: any) {
    let checker = false
    let counter = 0
    let current = 0
    let modif = 0
    let skill:any = {}
    while (checker == false) {
        let keyboard = Keyboard.builder()
        counter = 0
        current = modif
        const limit = 6
        let weapon_list = ''
        while (current < weapon_type.length && counter < limit ) {
            keyboard.textButton({
                label: weapon_type[current].label,
                payload: {
                    command: weapon_type[current].id
                },
                color: 'primary'
            })
            weapon_list += `- ${weapon_type[current].description} \n`
            counter++
            current++
            if (counter%2 == 0) {
                keyboard.row()
            }
        }
        keyboard.row()
        .textButton({
            label: '<',
            payload: {
                command: "left"
            },
            color: 'primary'
        })
        .textButton({
            label: 'назад',
            payload: {
                command: 'back'
            },
            color: 'primary'
        })
        .textButton({
            label: '>',
            payload: {
                command: 'right'
            },
            color: 'primary'
        })
        
        skill = await context.question(`${weapon_list}`, { keyboard: keyboard.inline(), answerTimeLimit } )
        if (skill.isTimeout) { return await context.send(`⏰ Время ожидания вашей активности истекло!`) }
        if (!skill.payload) {
            context.send('Жмите по inline кнопкам!')
        } else {
            if (skill.payload.command == 'back') {
                context.send('Вы нажали назад')
                modif = 0
                continue
            }
            if (skill.payload.command == 'left') {
                modif-limit >= 0 && modif < weapon_type.length ? modif-=limit : context.send('Позади ничего нет!')
                continue
            }
            if (skill.payload.command == 'right') {
                console.log('test ' + modif + ' total:' + weapon_type.length)
                modif+limit < weapon_type.length ? modif+=limit: context.send('Впереди ничего нет')
                continue
            }
            checker = true
            return skill
        }
    }
}

export async function Accessed(context: any) {
    const role: any = await prisma.user.findFirst({
        where: {
            idvk: context.senderId
        }
    })
    return role.id_role
}

export async function Book_Random_String(filename: string) {
    try {
        const contents = await fsPromises.readFile(filename, 'utf-8');
        const arr: any = contents.split(/\r?\n/);
        const clear = await arr.filter((value: any) => value !== undefined && value.length > 5);
        return clear[randomInt(0, clear.length - 1)];
    } catch (err) {
        console.log(err);
    }
}
export async function Keyboard_Index(context: any, messa: any) {
    const user_check: any = await prisma.user.findFirst({ where: { idvk: context.senderId } })
    const keyboard = new KeyboardBuilder()
    if (To_Vk_Id(user_check.idvk) === root) {
        keyboard.textButton({ label: 'Косой переулок', payload: { command: 'sliz' }, color: 'negative' }).row()
        .textButton({ label: 'права', payload: { command: 'sliz' }, color: 'primary' }).row()
    }
    if (user_check.id_role === 2) {
        keyboard.textButton({ label: '!опсоло', payload: { command: 'sliz' }, color: 'secondary' })
        keyboard.textButton({ label: '!опмасс', payload: { command: 'sliz' }, color: 'secondary' }).row()
        keyboard.textButton({ label: '!артефактывсе', payload: { command: 'sliz' }, color: 'primary' }).row()
        keyboard.textButton({ label: '!ездвиж', payload: { command: 'sliz' }, color: 'primary' }).row()
    } 
    keyboard.textButton({ label: '!банк', payload: { command: 'sliz' }, color: 'positive' }).row().oneTime()
    // Отправляем клавиатуру без сообщения
    await vk.api.messages.send({ peer_id: context.senderId, random_id: 0, message: `${messa}\u00A0`, keyboard: keyboard })
    .then(async (response: any) => {
        await Sleep(5000)
        const messageId = typeof response === 'number' ? response : response?.message_id
        if (!messageId) {
            return
        }
        return vk.api.messages.delete({ message_ids: [messageId], delete_for_all: 1 }) })
    .then(() => { console.log(`User ${context.senderId} succes get keyboard`) })
    .catch((error) => { console.error(`User ${context.senderId} fail get keyboard: ${error}`) });

    // Получаем последнее сообщение из истории беседы
  const [lastMessage] = (await vk.api.messages.getHistory({
    peer_id: context.peerId,
    count: 1,
  })).items;

  // Если последнее сообщение от пользователя и не содержит текст "!банк",
  // помечаем беседу как "говорит"
  if (lastMessage.from_id !== group_id && lastMessage.text !== '!банк') {
    await vk.api.messages.setActivity({
      type: 'typing',
      peer_id: context.peerId,
    });
  } else {
    // Иначе отправляем событие, что бот прочитал сообщение
    await vk.api.messages.markAsRead({
      peer_id: context.peerId,
    });
  }

}

async function Searcher(data: any, target: number) {
    let counter = 0
    while (data.length != counter) {
        if (data[counter].id_item == target) {
            return true
        }
        counter++
    }
    return false
}

export async function Gen_Inline_Button_Item(category: any, context: any) {
    await context.send(`⌛ Вы оказались в ${category.name}`)
    const user: any = await prisma.user.findFirst({ where: {    idvk: context.senderId  }   })
    const data: any= await prisma.item.findMany({   where: {    id_category: Number(category.id)    }   })
    let stopper = false
	let modif: number = 0
	const lim = 3 
    while (stopper == false) {
        let i = modif
        let counter = 0
        const inventory: any = await prisma.inventory.findMany({    where: {    id_user: user.id    }   })
        const item_render = []
        for (let j = modif; j < modif+3 && j < data.length; j++) {
            item_render.push({ name: data[j].name, price: `${data[j].price}G` })
        }
        await Image_Interface(item_render, context)
        let keyboard = Keyboard.builder()
        while (i < data.length && counter <lim) {
            const checker = await Searcher(inventory, data[i].id)
            
            if (checker && data[i].type != 'unlimited') {
                const text = `✅${data[i].name}`
                keyboard
                .textButton({   label: text.slice(0,40),
                                payload: {  command: `null`, operation: 'cant byuing'  },
                                color: 'positive'                           })
                .row()
            } else {
                const text = `🛒${data[i].price}💰 - ${data[i].name}`
                keyboard
                .textButton({   label: text.slice(0,40),
                                payload: {  command: `${i}`, operation: 'byuing'  },
                                color: 'secondary'                          })
                .row()
            }
            counter++
            i++
        }
        await context.send(`🛍 Чего желаете?`, { keyboard: keyboard.oneTime().inline() } )
        const  push = await context.question('🧷 Быстрый доступ',
            { keyboard: Keyboard.builder()
                .textButton({   label: '<',
                                payload: { command: "left" },
                                color: 'primary'              })
                .textButton({   label: `${(modif+3)/3}/${Math.round(data.length/3)}`,
                                payload: { command: "terminal" },
                                color: 'primary'              })
                .textButton({   label: '>',
                                payload: { command: 'right' },
                                color: 'primary'              }).row()
                .textButton({   label: 'Назад',
                                payload: { command: 'back' },
                                color: 'primary'              })
                .textButton({   label: 'Закончить',
                                payload: { command: 'end' },
                                color: 'primary'              })
                .oneTime(), answerTimeLimit
            }
        )
        if (push.isTimeout) { await context.send('⏰ Время ожидания выбора товаров истекло!'); return true }
        if (push.payload) {
            if (push.payload.operation == 'byuing') {
                const user: any = await prisma.user.findFirst({ where: { idvk: context.senderId } })
                const item_buy:any = data[push.payload.command]
                const item_inventory:any = await prisma.inventory.findFirst({ where: { id_item: item_buy.id, id_user: user.id } })
                if ((!item_inventory || item_buy.type == 'unlimited') && user.gold >= item_buy.price) {
                    const money = await prisma.user.update({ data: { gold: user.gold - item_buy.price }, where: { id: user.id } })
                    await context.send(`⚙ С вашего счета списано ${item_buy.price}💰, остаток: ${money.gold}💰`)
                    const inventory = await prisma.inventory.create({ data: { id_user: user.id, id_item: item_buy.id } })
                    console.log(`User ${context.senderId} bought new item ${item_buy.id}`)
                    await vk.api.messages.send({
                        peer_id: chat_id,
                        random_id: 0,
                        message: `🛍 @id${user.idvk}(${user.name}) покупает "${item_buy.name}" в "${category.name}" Косого переулка`
                    })
                    await context.send(`⚙ Ваша покупка доставится в течение нескольких секунд: ${item_buy.name}`)
                } else {
                    console.log(`User ${context.senderId} can't buy new item ${item_buy.id}`)
                    !item_inventory ? context.send(`💡 У вас недостаточно средств для покупки ${item_buy.name}!!`) : context.send(`💡 У вас уже есть ${item_buy.name}!`)
                }
            }
            if (push.payload.command == 'back') { await context.send(`⌛ Возврат в Косой переулок...`); return false }
            if (push.payload.command == 'end') { await context.send(`⌛ Шоппинг успешно завершен`); return true }
            if (push.payload.command == 'right') { if (modif+lim < data.length) { modif += lim } }
            if (push.payload.command == 'left') { if (modif-lim >= 0) { modif -= lim } }
        }
    }
}

export async function Gen_Inline_Button_Category(context: any, weapon_type: any, mesa: string) {
    await Image_Random(context, "shop")
    let checker = false
    let counter = 0
    let current = 0
    let modif = 0
    while (checker == false) {
        let keyboard = Keyboard.builder()
        counter = 0
        current = modif
        const limit = 5
        let weapon_list = ''
        while (current < weapon_type.length && counter < limit ) {
            keyboard.textButton({   label: weapon_type[current].name,
                                    payload: {  command: weapon_type[current]   },
                                    color: 'primary'
            }).row()
            weapon_list += `⚓${weapon_type[current].id} ${weapon_type[current].name} \n`
            counter++
            current++
        }
        keyboard.row()
        .textButton({   label: '<',
                        payload: { command: "left" },
                        color: 'primary'              })
        .textButton({   label: 'Вернуться',
                        payload: { command: 'back' },
                        color: 'primary'              })
        .textButton({   label: '>',
                        payload: { command: 'right' },
                        color: 'primary'              })
        const skill = await context.question( `✉ ${mesa}\n${weapon_list}`, { keyboard: keyboard.inline(), answerTimeLimit } )
        if (skill.isTimeout) { await context.send('⏰ Время ожидания выбора места посещения истекло!'); return false }
        if (!skill.payload) {
            await context.send('💡 Жмите по inline кнопкам!')
        } else {
            if (skill.payload.command == 'back') {
                await context.send('💡 Шоппинг успешно отменен')
                modif = 0
                return false
            }
            if (skill.payload.command == 'left') {
                modif-limit >= 0 && modif < weapon_type.length ? modif-=limit : await context.send('💡 Позади ничего нет!')
                continue
            }
            if (skill.payload.command == 'right') {
                modif+limit < weapon_type.length ? modif+=limit: await context.send('💡 Впереди ничего нет')
                continue
            }
            checker = true
            return skill.payload.command
        }
    }
}

export async function Worker_Checker() {
    await vk.api.messages.send({
        peer_id: chat_id,
        random_id: 0,
        message: `✅ Все ок! ${await Up_Time()}`,
    })
}

async function Up_Time() {
    const now = new Date();
    const diff = now.getTime() - starting_date.getTime();
    const timeUnits = [
        { unit: "дней", value: Math.floor(diff / 1000 / 60 / 60 / 24) },
        { unit: "часов", value: Math.floor((diff / 1000 / 60 / 60) % 24) },
        { unit: "минут", value: Math.floor((diff / 1000 / 60) % 60) },
        { unit: "секунд", value: Math.floor((diff / 1000) % 60) },
    ];
    return `Время работы: ${timeUnits.filter(({ value }) => value > 0).map(({ unit, value }) => `${value} ${unit}`).join(" ")}`
}

export async function Logger(text: String) {
    const project_name = `Bank Gringotts`
    /*const options = {
        era: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        timeZone: 'UTC',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    };*/
    console.log(`[${project_name}] --> ${text} <-- (${new Date().toLocaleString("ru"/*, options*/)})`)
}

export async function Fixed_Number_To_Five(num: number) {
    let res = 0
    res = num < 5 ? 0 : Math.floor(num / 5) * 5
    //console.log(`${num} --> ${res}`)
	return res
}

export async function Confirm_User_Success(context: any, text: string) {
    let res = { status: false, text: `` }
    const confirmq = await context.question(`⁉ Вы уверены, что хотите ${text}`,
        {
            keyboard: Keyboard.builder()
            .textButton({ label: 'Да', payload: { command: 'confirm' }, color: 'secondary' })
            .textButton({ label: 'Нет', payload: { command: 'not' }, color: 'secondary' })
            .oneTime().inline(),
            answerTimeLimit
        }
    )
    if (confirmq.isTimeout) { return await context.send(`⏰ Время ожидания на подтверждение операции ${text} истекло!`) }
    if (confirmq.payload.command === 'confirm') {
        res.status = true
        res.text = `✅ Success agree: ${text}`
    } else {
        res.text = `🚫 Success denied: ${text}`
    }
    return res
}

export async function Send_Message(idvk: VkId, message: string, keyboard?: Keyboard) {
    message = message ? message : 'invalid message'
    const peerId = To_Vk_Id(idvk)
    try {
        keyboard ? await vk.api.messages.send({ peer_id: peerId, random_id: 0, message: `${message}`, keyboard: keyboard } ) : await vk.api.messages.send({ peer_id: peerId, random_id: 0, message: `${message}` } )
    } catch (e) {
        console.log(`Ошибка отправки сообщения: ${e}`)
    }
}

export async function Send_Message_Universal(idvk: VkId, message: string, keyboard?: Keyboard, attachment?: string | PhotoAttachment | null) {
    message = message ? message : 'invalid message'
    const peerId = To_Vk_Id(idvk)
    try {
        if (!attachment && !keyboard) { await vk.api.messages.send({ peer_id: peerId, random_id: 0, message: `${message}` } ) }
        if (attachment && !keyboard) { await vk.api.messages.send({ peer_id: peerId, random_id: 0, message: `${message}`, attachment: attachment } ) }
        if (!attachment && keyboard) { await vk.api.messages.send({ peer_id: peerId, random_id: 0, message: `${message}`, keyboard: keyboard } ) }
        if (attachment && keyboard) { await vk.api.messages.send({ peer_id: peerId, random_id: 0, message: `${message}`, keyboard: keyboard, attachment: attachment } ) }
    } catch (e) {
        console.log(`Ошибка отправки сообщения: ${e}`)
    }
}
