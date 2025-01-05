import { Category, Inventory, Item, User } from "@prisma/client"
import prisma from "./prisma_client"
import { KeyboardBuilder } from "vk-io"
import { Image_Interface, Image_Random } from "../../core/imagecpu"
import { chat_id, vk } from "../../.."
/*
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

export async function Shop_Enter(context: any) {
    if (context.eventPayload.item == "id") {
        const input = context.eventPayload.value
        const user: User | null = await prisma.user.findFirst({ where: { idvk: context.peerId } })
        if (user) {
            let text = `⌛ Вы оказались в ${input.name}. Ваш баланс: ${user.gold}`
            const data: Item[] = await prisma.item.findMany({ where: { id_category: Number(input.id) } })
            const inventory: Inventory[] = await prisma.inventory.findMany({ where: { id_user: user.id } })
            const item_render = []
            let counter_pict = 0
            let bonus = context.eventPayload.current
            for (let j = bonus; j < data.length; j++) { counter_pict++; if (counter_pict > 3) { continue } item_render.push({ name: data[j].name, price: `${data[j].price}G` }) }
            const attached = await Image_Interface(item_render, context)
            let keyboard = new KeyboardBuilder()
            let counter = 0
            for (let i = bonus; i < data.length; i++) {
                counter++
                if (counter > 3) {continue}
                const checker = await Searcher(inventory, data[i].id)
                if (checker && data[i].type != 'unlimited') {
                    const text = `✅${data[i].name}`
                    keyboard.callbackButton({ label: text.slice(0,40), payload: { command: "shop_bought", item: "id", value: input, current: bonus, item_sub: "item", value_sub: data[i] }, color: 'positive' }).row()
                } else {
                    const text = `🛒${data[i].price}💰 - ${data[i].name}`
                    keyboard.callbackButton({ label: text.slice(0,40), payload: { command: "shop_buy", item: "id", value: input, current: bonus, item_sub: "item", value_sub: data[i] }, color: 'secondary' }).row()
                }
            }
            if (data.length >= 3 && bonus >= 3) {
                keyboard.callbackButton({ label: '<', payload: { command: 'shop_enter', item: "id", value: context.eventPayload.value, current: context.eventPayload.current-3 }, color: 'secondary' })
            }
            if (data.length >= 3 && bonus+3 < data.length) {
                keyboard.callbackButton({ label: '>', payload: { command: 'shop_enter', item: "id", value: context.eventPayload.value, current: context.eventPayload.current+3 }, color: 'secondary' })
            }
            keyboard.callbackButton({ label: '🚫', payload: { command: 'shop_cancel' }, color: 'secondary' })
            .callbackButton({ label: '✅', payload: { command: 'system_call' }, color: 'secondary' }).row().inline().oneTime()
            await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${text}`, keyboard: keyboard, attachment: attached?.toString()})
            if (context?.eventPayload?.command == "shop_enter") {
                await vk.api.messages.sendMessageEventAnswer({
                    event_id: context.eventId,
                    user_id: context.userId,
                    peer_id: context.peerId,
                    event_data: JSON.stringify({
                        type: "show_snackbar",
                        text: `🔔 Вы в ${input.name}, куда пойдем?`
                    })
                })
            }
        }
    }
}
export async function Shop_Bought(context: any) {
    if (context.eventPayload.command == "shop_bought" && context.eventPayload.item_sub == "item") {
        const input = context.eventPayload.value_sub
        if (context?.eventPayload?.command == "shop_bought") {
            await vk.api.messages.sendMessageEventAnswer({
                event_id: context.eventId,
                user_id: context.userId,
                peer_id: context.peerId,
                event_data: JSON.stringify({
                    type: "show_snackbar",
                    text: `🔔 Вы уже купили ${input.name}`
                })
            })
        }
    }
}
export async function Shop_Buy(context: any) {
    if (context.eventPayload.command == "shop_buy" && context.eventPayload.item_sub == "item") {
        const input = context.eventPayload.value_sub
        const user: any = await prisma.user.findFirst({ where: { idvk: context.peerId } })
        const item_inventory:any = await prisma.inventory.findFirst({ where: { id_item: input.id, id_user: user.id } })
        if ((!item_inventory || input.type == 'unlimited') && user.gold >= input.price) {
            const item = await prisma.item.findFirst({ where: { id: input.id }})
            const money = await prisma.user.update({ data: { gold: user.gold - input.price }, where: { id: user.id } })
            const inventory = await prisma.inventory.create({ data: { id_user: user.id, id_item: input.id } })
            console.log(`User ${context.peerId} bought new item ${input.id}`)
            await vk.api.messages.send({
                peer_id: chat_id,
                random_id: 0,
                message: `🛍 @id${user.idvk}(${user.name}) покупает ${item?.name}`
            })
            if (context?.eventPayload?.command == "shop_buy") {
                await vk.api.messages.sendMessageEventAnswer({
                    event_id: context.eventId,
                    user_id: context.userId,
                    peer_id: context.peerId,
                    event_data: JSON.stringify({
                        type: "show_snackbar",
                        text: `🔔 Доставлено ${item?.name}. Списано: ${input.price}💰`
                    })
                })
            }
            await Shop_Enter(context)
        } else {
            console.log(`User ${context.peerId} can't buy new item ${input.id}`)
            if (context?.eventPayload?.command == "shop_buy") {
                const ii = !item_inventory || input.type == 'unlimited' ? `💡 У вас  недостаточно средств для покупки ${input.name}!!` : `💡 У вас уже есть ${input.name}!`
                await vk.api.messages.sendMessageEventAnswer({
                    event_id: context.eventId,
                    user_id: context.userId,
                    peer_id: context.peerId,
                    event_data: JSON.stringify({
                        type: "show_snackbar",
                        text: ii
                    })
                })
            }
        }       
    }
}
export async function Shop_Cancel(context: any) {
    await Shop_Category_Enter(context)
    await vk.api.messages.sendMessageEventAnswer({
        event_id: context.eventId,
        user_id: context.userId,
        peer_id: context.peerId,
        event_data: JSON.stringify({
            type: "show_snackbar",
            text: `🔔 Возврат в Косой переулок.`
        })
    })
}
export async function Shop_Category_Enter(context: any) {
    const attached = await Image_Random(context, "shop")
    console.log(`User ${context.peerId} enter in shopping`)
    const category: Category[] = await prisma.category.findMany({})
    let text = '✉ Гоблин сопроводил вас в Косой переулок или, по крайней мере, дал карту...'
    if (category.length == 0) {
        text += `\n ✉ Магазинов еще нет`
    } 
    const keyboard = new KeyboardBuilder()
    for(const i in category) {
        keyboard.callbackButton({ label: `⚓ ${category[i].name}`, payload: { command: "shop_enter", item: "id", value: category[i], current: 0 }, color: 'primary' }).row()
    }
    keyboard.callbackButton({ label: '🚫', payload: { command: 'system_call' }, color: 'secondary' }).inline().oneTime()
    await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${text}`, keyboard: keyboard, attachment: attached?.toString()})
    if (context?.eventPayload?.command == "shop_category_enter") {
        await vk.api.messages.sendMessageEventAnswer({
            event_id: context.eventId,
            user_id: context.userId,
            peer_id: context.peerId,
            event_data: JSON.stringify({
                type: "show_snackbar",
                text: `🔔 Вы в Косом переулке, куда пойдем?`
            })
        })
    }
}
*/