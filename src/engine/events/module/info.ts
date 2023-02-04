import { KeyboardBuilder } from "vk-io"
import prisma from "./prisma_client"
import { vk } from "../../.."
import { User } from "@prisma/client"
import { Image_Interface_Inventory, Image_Random, Image_Text_Add_Card } from "../../core/imagecpu"

export async function Card_Enter(context:any) {
    const get_user: User | null | undefined = await prisma.user.findFirst({ where: { idvk: context.peerId } })
    if (get_user) {
        const attached = await Image_Text_Add_Card(context, 50, 650, get_user)
        const artefact_counter = await prisma.artefact.count({ where: { id_user: get_user.id } })
        const text = `✉ Вы достали свою карточку, ${get_user.class} ${get_user.name}, ${get_user?.spec}:\n 💳UID: ${get_user.id} \n 💰Галлеоны: ${get_user.gold} \n 🧙Магический опыт: ${get_user.xp} \n 📈Уровень: ${get_user.lvl} \n 🔮Количество артефактов: ${artefact_counter} \n ⚙${get_user.private ? "Вы отказываетесь ролить" : "Вы разрешили приглашения на отролы"}`
        const keyboard = new KeyboardBuilder()
        .callbackButton({ label: '⚙', payload: { command: 'card_private' }, color: 'secondary' })
        .callbackButton({ label: '🚫', payload: { command: 'system_call' }, color: 'secondary' }).inline().oneTime()
        console.log(`User ${get_user.idvk} see card`)
        let ii = `🔔 В общем вы ${get_user.gold > 100 ? "при деньгах" : "без денег"}. Вы ${get_user.lvl > 4 ? "слишком много знаете" : "должны узнать больше."}`
        await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${text}`, keyboard: keyboard, attachment: attached?.toString()})
        const data = {
            type: "show_snackbar",
            text: `🔔 ${ii}`
        }
        if (context?.eventPayload?.command == "card_enter") {
            await vk.api.messages.sendMessageEventAnswer({
                event_id: context.eventId,
                user_id: context.userId,
                peer_id: context.peerId,
                event_data: JSON.stringify(data)
            })
        }
    }
}
export async function Card_Private(context: any) {
    const check: any = await prisma.user.findFirst({ where: { idvk: context.peerId } })
    const changer: boolean = check.private ? false : true
    const user_update = await prisma.user.update({ where: { id: check.id}, data: { private: changer} })
    await vk.api.messages.sendMessageEventAnswer({
        event_id: context.eventId,
        user_id: context.userId,
        peer_id: context.peerId,
        event_data: JSON.stringify({
            type: "show_snackbar",
            text: `🔔 Приватный режим: ${changer ? 'Включен' : "Выключен"}`
        })
    })
    await Card_Enter(context)
}

export async function Artefact_Enter(context: any) {
    const get_user: any = await prisma.user.findFirst({ where: { idvk: context.peerId } })
    const attached = await Image_Random(context, "artefact")
    let artefact_list = `✉ Ваши артефакты, ${get_user.class} ${get_user.name}, ${get_user.spec}: \n`
    const artefact = await prisma.artefact.findMany({ where: { id_user: get_user.id } })
    if (artefact.length > 0) {
        for (const i in artefact) { artefact_list += `\n💬: ${artefact[i].name} \n 🔧: ${artefact[i].type}${artefact[i].label} \n 🧷:  ${artefact[i].description}` }
    } else { artefact_list += `\n✉ У Вас еще нет артефактов =(` }
    console.log(`User ${get_user.idvk} see artefacts`)
    const keyboard = new KeyboardBuilder().callbackButton({ label: '🚫', payload: { command: 'system_call' }, color: 'secondary' }).inline().oneTime()
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${artefact_list}`, keyboard: keyboard, attachment: attached?.toString()})
    let ii = ''
    if (artefact.length > 0) {
        ii += `🔔 ${artefact.length > 2 ? 'Вы тоже чувствуете эту силу мощи?' : 'Слабое пронизивание источает силу.'}`
    } else { 
        ii += `💡 Вероятно вы магл, раз у вас нет артефакта..`
    }
    await vk.api.messages.sendMessageEventAnswer({
        event_id: context.eventId,
        user_id: context.userId,
        peer_id: context.peerId,
        event_data: JSON.stringify({
            type: "show_snackbar",
            text: `🔔 ${ii}`
        })
    })
} 

export async function Inventory_Enter(context: any) {
    const get_user:any = await prisma.user.findFirst({ where: { idvk: context.peerId }, include: { Trigger: true }, })
    const inventory = await prisma.inventory.findMany({ where: { id_user: get_user.id }, include: { item: true } })
    let cart = ''
    for (const i in get_user.Trigger) {
        if (get_user.Trigger[i].value == false && get_user.Trigger[i].name == 'underwear') { cart += 'Трусы Домашние;' }
        if (get_user.Trigger[i].value == true && get_user.Trigger[i].name == 'beer') { cart += 'Сливочное пиво из Хогсмида;' }
    }
    for (const i in inventory) {
        cart += `${inventory[i].item.name};`
    }
    const destructor = cart.split(';').filter(i => i)
    let compile = []
    let compile_rendered: any = []
    for (const i in destructor) {
        let counter = 0
        for (const j in destructor) { if (destructor[i] != null) { if (destructor[i] == destructor[j]) { counter++ } } }
        compile.push(`👜 ${destructor[i]} x ${counter}\n`)
        compile_rendered.push({name: destructor[i], text:`x ${counter}`})
        counter = 0
    }
    const fUArr: any = compile_rendered.filter( (li: ArrayLike<any> | { [s: string]: any; }, idx: any, self: ({ [s: string]: any; } | ArrayLike<any>)[]) => 
        self.map( (itm: { [s: string]: any; } | ArrayLike<any>) => Object.values(itm).reduce((r, c) => r.concat(c), '') )
        .indexOf( Object.values(li).reduce((r, c) => r.concat(c), '') ) === idx
    )
    const attached = await Image_Interface_Inventory(fUArr, context)
    let final: any = Array.from(new Set(compile));
    const text = final.length > 0 ? `✉ Вы приобрели следующее: \n ${final.toString().replace(/,/g, '')}` : `✉ Вы еще ничего не приобрели:(`
    console.log(`User ${context.peerId} see self inventory`)  
    const keyboard = new KeyboardBuilder().callbackButton({ label: '🚫', payload: { command: 'system_call' }, color: 'secondary' }).inline().oneTime()
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${text}`, keyboard: keyboard, attachment: attached?.toString()})
    let ii = final.length > 0 ? 'А вы зажиточный клиент' : `Как можно было так лохануться?`
    await vk.api.messages.sendMessageEventAnswer({
        event_id: context.eventId,
        user_id: context.userId,
        peer_id: context.peerId,
        event_data: JSON.stringify({
            type: "show_snackbar",
            text: `🔔 ${ii}`
        })
    })

}