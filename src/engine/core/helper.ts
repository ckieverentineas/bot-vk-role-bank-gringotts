import { PrismaClient } from "@prisma/client"
import { randomInt } from "crypto"
import { Attachment, Keyboard } from "vk-io"
import { chat_id, root, vk } from "../.."

const prisma = new PrismaClient()

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
        
        skill = await context.question(`${weapon_list}`,
                                            {
                                                keyboard: keyboard.inline()
                                            }
        )
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

export async function Keyboard_Index(context: any, messa: any) {
    const user_check: any = await prisma.user.findFirst({
        where: {
            idvk: context.senderId
        }
    })
    if (user_check.idvk == root && user_check.id_role === 2) {
        context.send(`${messa}`,
            {
                keyboard: Keyboard.builder()
                .textButton({
                    label: 'карта',
                    payload: {
                        command: 'grif'
                    },
                    color: 'secondary'
                })
                .textButton({
                    label: 'инвентарь',
                    payload: {
                        command: 'sliz'
                    },
                    color: 'secondary'
                }).row()
                .textButton({
                    label: 'артефакты',
                    payload: {
                        command: 'coga'
                    },
                    color: 'secondary'
                })
                .textButton({
                    label: 'админы',
                    payload: {
                        command: 'coga'
                    },
                    color: 'secondary'
                }).row()
                .textButton({
                    label: 'Косой переулок',
                    payload: {
                        command: 'sliz'
                    },
                    color: 'positive'
                })
                .textButton({
                    label: 'Услуги',
                    payload: {
                        command: 'sliz'
                    },
                    color: 'primary'
                }).row()
                .textButton({
                    label: 'операции',
                    payload: {
                        command: 'sliz'
                    },
                    color: 'negative'
                })
                .textButton({
                    label: 'права',
                    payload: {
                        command: 'sliz'
                    },
                    color: 'negative'
                }).oneTime()
            }
        )
    }else if (user_check.id_role === 2) {
        context.send(`${messa}`,
            {
                keyboard: Keyboard.builder()
                .textButton({
                    label: 'карта',
                    payload: {
                        command: 'grif'
                    },
                    color: 'secondary'
                })
                .textButton({
                    label: 'инвентарь',
                    payload: {
                        command: 'sliz'
                    },
                    color: 'secondary'
                }).row()
                .textButton({
                    label: 'артефакты',
                    payload: {
                        command: 'coga'
                    },
                    color: 'secondary'
                })
                .textButton({
                    label: 'админы',
                    payload: {
                        command: 'coga'
                    },
                    color: 'secondary'
                }).row()
                .textButton({
                    label: 'Косой переулок',
                    payload: {
                        command: 'sliz'
                    },
                    color: 'positive'
                })
                .textButton({
                    label: 'Услуги',
                    payload: {
                        command: 'sliz'
                    },
                    color: 'primary'
                }).row()
                .textButton({
                    label: 'операции',
                    payload: {
                        command: 'sliz'
                    },
                    color: 'negative'
                }).oneTime()
            }
        )
    } 
    if (user_check.id_role === 1) {
        context.send(`${messa}`,
            {
                keyboard: Keyboard.builder()
                .textButton({
                    label: 'карта',
                    payload: {
                        command: 'grif'
                    },
                    color: 'secondary'
                }).row()
                .textButton({
                    label: 'инвентарь',
                    payload: {
                        command: 'sliz'
                    },
                    color: 'secondary'
                }).row()
                .textButton({
                    label: 'артефакты',
                    payload: {
                        command: 'coga'
                    },
                    color: 'secondary'
                }).row()
                .textButton({
                    label: 'Косой переулок',
                    payload: {
                        command: 'sliz'
                    },
                    color: 'positive'
                }).textButton({
                    label: 'Услуги',
                    payload: {
                        command: 'sliz'
                    },
                    color: 'primary'
                }).oneTime()
            }
        )
    }
    if (randomInt(0, 100) < 5) {
        const user_list: any = await prisma.user.findMany({})
        const location_list: any = {
            "Хогвартс": [ "Большой Зал", "Астрономическая Башня", "Гремучая Ива", "Часовая Башня", "Кухня", "Туалет Плаксы Миртл", "Кухня", "Зал Наказаний", "Внутренний Двор", "Запретный лес", "Правый коридор | Пятый этаж", "Деревянный мост", "Совятня", "Выручай-комната", "Комната Пивза", "Чердак", "Больничное крыло", "Вестибюль", "Опушка леса", "Библиотека Хогвартса", "Чёрное Озеро", "Лестничные пролёты", "Каменный Круг", "Кабинет Зельеварения", "Подземелья Хогвартса", "Прачечная", "Зал Славы", "Учебный Зал", "Теплицы", "Тайная Комната", "Кладбище", "Лодочный сарай", "Кабинет школьного психолога", "Коридор Одноглазой Ведьмы", "Комната 234-00", "Учительская", "Хижина Хагрида", "Коридоры", "Учительская"],
            "Бристон": [ 'Стрип-клуб "MurMur angels-club"', "Филиал Некромантии и Бесоизгнания", "Суд", "ЗаМУРчательное кафе", "Парк", "Больница", "Мракоборческий участок", "Заповедник", "Торговый центр", "Лавка зелий и артефактов", 'Бар "У Пьюси и Винтер"', "Магическая аптека", "Бухта Ингернах", "Филиал Гильдии Артефакторов", 'Отель "Меллоу Брук"', "Закрытая пиццерия", "Волшебный зверинец",],
            "Пиво из Хогсмида": [ 'Паб "Три метлы"', 'Трактир "Кабанья голова"']
        }
        const location_name : any = ["Хогвартс", "Бристон", "Пиво из Хогсмида"]
        const selector = randomInt(0, location_name.length)
        const tara = randomInt(0, location_list[location_name[selector]].length)
        const rana = randomInt(0, user_list.length)
        await context.send(`⌛ Загружается новое событие...`)
        const reward: number = randomInt(1,16)
        await context.send(`
            👥Как насчет поролить с @id${user_list[rana].idvk}(${user_list[rana].name}):
            🌐Место: ${location_name[selector]}
            👣Локация: ${location_list[location_name[selector]][tara]}
            ⚡Тема: Свободный стиль
            🏆Награда: ${reward}🧙
        `)
        await vk.api.messages.send({
            peer_id: chat_id,
            random_id: 0,
            message: `⌛ Создано предложение для отрола 👤@id${user_check.idvk}(${user_check.name}) c 👥@id${user_list[rana].idvk}(${user_list[rana].name}) в 🌐"${location_name[selector]}" на 👣"${location_list[location_name[selector]][tara]}" по теме ⚡"Свободный стиль" за 🏆"${reward}🧙"`
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
                message: `
                    👥Как насчет поролить с @id${user_check.idvk}(${user_check.name}):
                    🌐Место: ${location_name[selector]}
                    👣Локация: ${location_list[location_name[selector]][tara]}
                    ⚡Тема: Свободный стиль
                    🏆Награда: ${reward}🧙
                `
            })
        } catch (error) {
            console.log(`User ${user_list[rana].idvk} blocked chating with bank!`)
        }
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
	let modif = 0
	const lim = 3 
    while (stopper == false) {
        let i = modif
        let counter = 0
        const inventory: any = await prisma.inventory.findMany({    where: {    id_user: user.id    }   })
        while (i < data.length && counter <lim) {
            const checker = await Searcher(inventory, data[i].id)
            let keyboard = Keyboard.builder()
            if (checker && data[i].type != 'unlimited') {
                keyboard
                .textButton({   label: 'Куплено',
                                payload: {  command: `null`, operation: 'cant byuing'  },
                                color: 'positive'                           })
                .oneTime().inline() 
            } else {
                keyboard
                .textButton({   label: 'Купить',
                                payload: {  command: `${i}`, operation: 'byuing'  },
                                color: 'secondary'                          })
                .oneTime().inline()                                                                                
            }
            context.question(`🛍 ${data[i].name} ${data[i].price}💰`, { keyboard: keyboard } )
            counter++
            i++
        }
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
                
                .oneTime() }
        )
        if (push.payload) {
            if (push.payload.operation == 'byuing') {
                const user: any = await prisma.user.findFirst({ where: { idvk: context.senderId } })
                const item_buy:any = data[push.payload.command]
                const item_inventory:any = await prisma.inventory.findFirst({ where: { id_item: item_buy.id, id_user: user.id } })
                if ((!item_inventory || item_buy.type == 'unlimited') && user.gold >= item_buy.price) {
                    const money = await prisma.user.update({ data: { gold: user.gold - item_buy.price }, where: { id: user.id } })
                    context.send(`⚙ С вашего счета списано ${item_buy.price}💰, остаток: ${money.gold}💰`)
                    const inventory = await prisma.inventory.create({ data: { id_user: user.id, id_item: item_buy.id } })
                    console.log(`User ${context.senderId} bought new item ${item_buy.id}`)
                    await vk.api.messages.send({
                        peer_id: chat_id,
                        random_id: 0,
                        message: `🛍 @id${user.idvk}(${user.name}) покупает "${item_buy.name}" в "${category.name}" Косого переулка`
                    })
                    context.send(`⚙ Ваша покупка доставлена: ${item_buy.name}`)
                } else {
                    console.log(`User ${context.senderId} can't buy new item ${item_buy.id}`)
                    !item_inventory ? context.send(`💡 У вас  недостаточно средств для покупки ${item_buy.name}!!`) : context.send(`💡 У вас уже есть ${item_buy.name}!`)
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
    await context.send({ attachment: await vk.upload.messagePhoto({ source: { value: './src/art/shop.jpg' } }) });
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
        const skill = await context.question(
            `✉ ${mesa}\n${weapon_list}`,
            { keyboard: keyboard.inline() }
        )
        if (!skill.payload) {
            context.send('💡 Жмите по inline кнопкам!')
        } else {
            if (skill.payload.command == 'back') {
                context.send('💡 Шоппинг успешно отменено')
                modif = 0
                return false
            }
            if (skill.payload.command == 'left') {
                modif-limit >= 0 && modif < weapon_type.length ? modif-=limit : context.send('💡 Позади ничего нет!')
                continue
            }
            if (skill.payload.command == 'right') {
                modif+limit < weapon_type.length ? modif+=limit: context.send('💡 Впереди ничего нет')
                continue
            }
            checker = true
            return skill.payload.command
        }
    }
}