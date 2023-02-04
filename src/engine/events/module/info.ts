import { KeyboardBuilder } from "vk-io"
import prisma from "./prisma_client"
import { vk } from "../../.."
import { User } from "@prisma/client"
import { Image_Text_Add_Card } from "../../core/imagecpu"

export async function Card_Enter(context:any) {
    const get_user: User | null | undefined = await prisma.user.findFirst({ where: { idvk: context.senderId } })
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
            text: `${ii}`
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
    const check: any = await prisma.user.findFirst({ where: { idvk: context.senderId } })
    const changer: boolean = check.private ? false : true
    const user_update = await prisma.user.update({ where: { id: check.id}, data: { private: changer} })
    await vk.api.messages.sendMessageEventAnswer({
        event_id: context.eventId,
        user_id: context.userId,
        peer_id: context.peerId,
        event_data: JSON.stringify({
            type: "show_snackbar",
            text: `Приватный режим: ${changer ? 'Включен' : "Выключен"}`
        })
    })
    await Card_Enter(context)
}