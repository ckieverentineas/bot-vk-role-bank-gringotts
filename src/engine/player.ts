import { PrismaClient } from "@prisma/client";
import { HearManager } from "@vk-io/hear";
import { randomInt } from "crypto";
import { send } from "process";
import { Attachment, Keyboard, KeyboardBuilder, PhotoAttachment } from "vk-io";
import { IQuestionMessageContext } from "vk-io-question";
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import { root, vk } from '../index';
import { Accessed, Keyboard_Index } from "./core/helper";
const prisma = new PrismaClient()

export function registerUserRoutes(hearManager: HearManager<IQuestionMessageContext>): void {
	/*hearManager.hear(/deleted/, async (context) => {
        const get_user:any = await prisma.user.findFirst({
            where: {
                idvk: context.senderId
            }
        })
        const delatt = await prisma.user.delete({
            where: {
                id: get_user?.id
            }
        })
        if (delatt) {
            context.send(`Вас удалили ${get_user.name}. Возвращайтесь к нам снова!`)
            console.log(`Deleted ${get_user.name}`)
        }
        prisma.$disconnect()
    })*/
    hearManager.hear(/карта/, async (context) => {
        const get_user:any = await prisma.user.findFirst({
            where: {
                idvk: context.senderId
            }
        })
        const artefact_counter = await prisma.artefact.count({
            where: {
                id_user: get_user.id
            }
        })
        context.send(`
            Вы достали свою карточку, ${get_user.class} ${get_user.name}, ${get_user.spec}:
            💳UID: ${get_user.id}
            💰Галлеоны: ${get_user.gold}
            🧙Магический опыт: ${get_user.xp}
            📈Уровень: ${get_user.lvl}
            🔮Количество артефактов: ${artefact_counter}
        `)
        prisma.$disconnect()
        console.log(`User ${get_user.idvk} see card`)
        await Keyboard_Index(context, `Карточку посмотрели, что дальше?`)
    })
    hearManager.hear(/артефакты/, async (context) => {
        const get_user:any = await prisma.user.findFirst({
            where: {
                idvk: context.senderId
            }
        })
        await context.sendPhotos({
            value: './src/art/artefact.jpg',
        });
        context.send(`
            Ваши артефакты, ${get_user.class} ${get_user.name}, ${get_user.spec}:
            `
        )
        const artefact = await prisma.artefact.findMany({
            where: {
                id_user: get_user.id
            }
        })
        if (artefact.length > 0) {
            artefact.forEach(async element => {
                context.send(`
                    Название: ${element.name}
                    ${element.label}:  ${element.type}
                    Подробнее о артефакте:  ${element.description}
                `)
            });
        } else {
            context.send(`У Вас еще нет артефактов =(`)
        }
        prisma.$disconnect()
        console.log(`User ${get_user.idvk} see artefacts`)
        await Keyboard_Index(context, `Артефактов много не бывает, как насчет еще чего-нибудь?`)
    })
    hearManager.hear(/Косой переулок/, async (context) => {
        if (context.senderId == root) {
            console.log(`Admin ${context.senderId} enter in shopping`)
            const category:any = await prisma.category.findMany({})
            if (category.length == 0) {
                const ans: any = await context.question(`
                        Магазинов еще нет
                    `,
                    {
                        keyboard: Keyboard.builder()
                        .textButton({
                            label: 'Добавить магазин',
                            payload: {
                                command: 'new_shop'
                            },
                            color: 'secondary'
                        })
                        .oneTime().inline()
                    }
                )
                if (ans.payload.command == 'new_shop') {
                    const shop = await context.question(`
                        Введите название магазина:
                    `)
                    const shop_create = await prisma.category.create({
                        data: {
                            name: shop.text
                        }
                    })
                    console.log(`User ${context.senderId} open new shop`)
                    context.send(`Вы открыли следующий магазин ${shop_create.name}`)
                }
            } else {
                let keyboard = Keyboard.builder()
                category.forEach(async element => {
                    keyboard.textButton({
                        label: element.name,
                        payload: {
                            command: `${element.id}`
                        }
                    })
                    .textButton({
                        label: "Удалить",
                        payload: {
                            command: `${element.id}`
                        }
                    }).row()
                })
                const ans: any = await context.question(`
                        Куда пойдем?
                    `,
                    {
                        keyboard: keyboard
                        .textButton({
                            label: 'Добавить магазин',
                            payload: {
                                command: 'new_shop'
                            },
                            color: 'secondary'
                        })
                        .oneTime().inline()
                    }
                )
                if (ans.text == "Удалить") {
                    const shop_delete = await prisma.category.delete({
                        where: {
                            id: Number(ans.payload.command)
                        }
                    })
                    console.log(`User ${context.senderId} close shop`)
                    context.send(`Удален магазин ${shop_delete.name}`)
                }
                if (ans.payload?.command == 'new_shop') {
                    const shop = await context.question(`
                        Введите название магазина:
                    `)
                    const shop_create = await prisma.category.create({
                        data: {
                            name: shop.text
                        }
                    })
                    console.log(`User ${context.senderId} open new shop`)
                    context.send(`Вы открыли следующий магазин ${shop_create.name}`)
                }
                if (category.find(i => i.name == ans.text)) {
                    context.send(`Вы оказались в ${ans.text}`)
                    const item: any= await prisma.item.findMany({
                        where: {
                            id_category: Number(ans.payload.command)
                        }
                    })
                    if (item.length == 0) {
                        context.send(`К сожалению приалвки пока что пусты=/`)
                    } else {
                        item.forEach(async element => {
                            const buer: any= context.send(`${element.name} ${element.price}💰`,
                                {
                                    keyboard: Keyboard.builder()
                                    .textButton({
                                        label: 'Купить',
                                        payload: {
                                            command: `${element.name}`
                                        },
                                        color: 'secondary'
                                    })
                                    .textButton({
                                        label: 'Редактировать',
                                        payload: {
                                            command: `${element.name}`
                                        },
                                        color: 'secondary'
                                    })
                                    .oneTime().inline()
                                }
                            )
                        })
                    }
                    const ans_item: any = await context.question(`
                            Что будем делать?
                        `,
                        {
                            keyboard: Keyboard.builder()
                            .textButton({
                                label: 'Добавить товар',
                                payload: {
                                    command: 'new_item'
                                },
                                color: 'secondary'
                            })
                            .textButton({
                                label: 'Перейти к покупкам',
                                payload: {
                                    command: 'continue'
                                },
                                color: 'secondary'
                            })
                            .oneTime().inline()
                        }
                    )
                    if (ans_item.payload?.command == 'new_item') {
                        const item_name = await context.question(`
                            Введите название предмета:
                        `)
                        const item_price = await context.question(`
                            Введите его ценность:
                        `)
                        const item_create = await prisma.item.create({
                            data: {
                                name: item_name.text,
                                price: Number(item_price.text),
                                id_category: Number(ans.payload.command),
                                type: "Не ограничено покупок"
                            }
                        })
                        console.log(`User ${context.senderId} added new item ${item_create.id}`)
                        context.send(`Для магазина ${ans.text} добавлен новый товар ${item_name.text} стоимостью ${item_price.text} галлеонов`)
                    }
                    if (ans_item.payload.command == 'continue') {
                        context.send(`Нажимайте кнопку купить у желаемого товара`)
                    }
                }
            }
        } else {
            console.log(`User ${context.senderId} enter in shopping`)
            const category:any = await prisma.category.findMany({})
            if (category.length == 0) {
                const ans: any = await context.send(`Магазинов еще нет`)
            } else {
                let keyboard = Keyboard.builder()
                category.forEach(async element => {
                    keyboard.textButton({
                        label: element.name,
                        payload: {
                            command: `${element.id}`
                        }
                    }).row()
                })
                await context.sendPhotos({
                    value: './src/art/shop.jpg',
                });
                const ans: any = await context.question(`
                        Куда пойдем?
                    `,
                    {
                        keyboard: keyboard
                        .oneTime().inline()
                    }
                    
                )
                if (category.find(i => i.name == ans.text)) {
                    context.send(`Вы оказались в ${ans.text}`)
                    const item: any= await prisma.item.findMany({
                        where: {
                            id_category: Number(ans.payload.command)
                        }
                    })
                    if (item.length == 0) {
                        context.send(`К сожалению приалвки пока что пусты=/`)
                    } else {
                        item.forEach(async element => {
                            const buer: any= context.send(`${element.name} ${element.price}💰`,
                                {
                                    keyboard: Keyboard.builder()
                                    .textButton({
                                        label: 'Купить',
                                        payload: {
                                            command: `${element.name}`
                                        },
                                        color: 'secondary'
                                    })
                                    .oneTime().inline()
                                }
                            )
                        })
                    }
                }
            }
        }
        prisma.$disconnect()
        await Keyboard_Index(context, `Счастливых покупок, жмите кнопку "Купить" на понравившихся товарах`)
    })
    hearManager.hear(/Купить/, async (context) => {
        if (context.messagePayload == null) {
            return
        }
        const user: any = await prisma.user.findFirst({
            where: {
                idvk: context.senderId
            }
        })
        const item_buy:any = await prisma.item.findFirst({
            where: {
                name: context.messagePayload.command,
            }
        })
        const item_inventory:any = await prisma.inventory.findFirst({
            where: {
                id_item: item_buy.id,
                id_user: user.id
            }
        })
        
        if (!item_inventory && user.gold >= item_buy.price) {
            const money = await prisma.user.update({
                data: {
                    gold: user.gold - item_buy.price
                },
                where: {
                    id: user.id
                }
            })
            context.send(`С вашего счета списано ${item_buy.price}💰, остаток: ${money.gold}💰`)
            const inventory = await prisma.inventory.create({
                data: {
                    id_user: user.id,
                    id_item: item_buy.id
                }
            })
            console.log(`User ${context.senderId} bought new item ${item_buy.id}`)
            context.send(`Ваша покупка доставлена: ${context.messagePayload.command}`)
        } else {
            console.log(`User ${context.senderId} can't buy new item ${item_buy.id}`)
            context.send(`У вас уже есть ${context.messagePayload.command}! или же недостаточно средств!`)
        }
        await Keyboard_Index(context, `Может еще что-нибудь приобрести?`)
    })
    hearManager.hear(/Редактировать/, async (context) => {
        if (context.messagePayload == null && context.senderId != root) {
            return
        }
        const item_buy:any = await prisma.item.findFirst({
            where: {
                name: context.messagePayload.command,
            }
        })
        if (item_buy) {
            const name = await context.question(`Предмет: ${item_buy.name}.\nВведите новое имя для товара:`)
            const item_update = await prisma.item.update({
                where: {
                    id: item_buy.id
                },
                data: {
                    name
                }
            })
            console.log(`Admin ${context.senderId} edit name item ${item_buy.id}`)
            context.send(`Имя предмета ${item_buy.name} изменено на ${item_update.name}`)
        } else {
            console.log(`Admin ${context.senderId} can't edit name item ${item_buy.id}`)
            context.send(`Имя предмета не удалось поменять`)
        }
        await Keyboard_Index(context, `Может еще что-нибудь отредактировать?`)
    })
    hearManager.hear(/операции/, async (context) => {
        if (await Accessed(context) != 2) {
            return
        }
        let name_check = false
		let datas: any = []
		while (name_check == false) {
			const uid = await context.question(`
                Введите 💳UID банковского счета получателя:
			`)
			if (uid.text) {
                const get_user = await prisma.user.findFirst({
                    where: {
                        id: Number(uid.text)
                    }
                })
                if (get_user) {
                    console.log(`Admin ${context.senderId} opened ${get_user.idvk} card UID: ${get_user.id}`)
                    name_check = true
				    datas.push({id: `${uid.text}`})
                    const artefact_counter = await prisma.artefact.count({
                        where: {
                            id_user: Number(uid.text)
                        }
                    })
                    context.send(`
                        🏦Открыта следующая карточка: ${get_user.class} ${get_user.name}, ${get_user.spec}:
                        
                        💳UID: ${get_user.id}
                        💰Галлеоны: ${get_user.gold}
                        🧙Магический опыт: ${get_user.xp}
                        📈Уровень: ${get_user.lvl}
                        🔮Количество артефактов: ${artefact_counter}
                    `)
                    const inventory = await prisma.inventory.findMany({
                        where: {
                            id_user: get_user?.id
                        }
                    })
                    let cart = ''
                    let counter = 0
                    if (inventory.length == 0) {
                        context.send(`Покупки пока не совершались`)
                    } else {
                        const promise = new Promise(async (resolve, reject) => {
                            inventory.forEach(async element => {
                                const item = await prisma.item.findFirst({
                                    where: {
                                        id: element.id_item 
                                    }
                                })
                                cart += `${item?.name} \n`
                                counter++
                                if(inventory.length == counter){
                                    resolve('Все прошло отлично!');
                                }
                            })
                        });
                        promise.then(
                            (data) => {
                                console.log(`Admin ${context.senderId} see inventory from user: ${get_user.idvk}`)
                                context.send(`Были совершены следующие покупки: \n ${cart}`)
                            },
                            (error) => {
                            console.log(error); // вывести ошибку
                            }
                        );
                    }
                }
			} else {
				context.send(`Нет такого банковского счета!`)
			}
		}

        const ans: any = await context.question(`
                Доступны следующие операции с 💳UID: ${datas[0].id}
            `,
            {
            keyboard: Keyboard.builder()
            .textButton({
                label: '+💰',
                payload: {
                    command: 'gold_up'
                },
                color: 'secondary'
            })
            .textButton({
                label: '-💰',
                payload: {
                    command: 'gold_down'
                },
                color: 'secondary'
            })
            .row()
            .textButton({
                label: '+🧙',
                payload: {
                    command: 'xp_up'
                },
                color: 'secondary'
            })
            .textButton({
                label: '-🧙',
                payload: {
                    command: 'xp_down'
                },
                color: 'secondary'
            })
            .row()
            .textButton({
                label: '➕🔮',
                payload: {
                    command: 'artefact_add'
                },
                color: 'secondary'
            })
            .textButton({
                label: '👁🔮',
                payload: {
                    command: 'artefact_show'
                },
                color: 'secondary'
            })
            .row()
            .textButton({
                label: '🔙',
                payload: {
                    command: 'back'
                },
                color: 'secondary'
            })
            .textButton({
                label: '☠',
                payload: {
                    command: 'user_delete'
                },
                color: 'secondary'
            })
            .oneTime().inline()
            }
        )
        async function Gold_Up(id: number) {
            const count: number = await Ipnut_Gold() 
            const messa: string = await Ipnut_Message()
            const user_get: any = await prisma.user.findFirst({
                where: {
                    id
                }
            })
            const money_put = await prisma.user.update({
                where: {
                    id: user_get.id
                },
                data: {
                    gold: user_get.gold + count
                }
            })
            await vk.api.messages.send({
                user_id: user_get.idvk,
                random_id: 0,
                message: `🏦Вам начислено ${count}💰. \nВаш счёт: ${money_put.gold}💰 \n Уведомление: ${messa}`
            })
            context.send(`🏦Операция завершена успешно`)
            console.log(`User ${user_get.idvk} got ${count} gold. Him/Her bank now ${money_put.gold}`)
        }
        async function Gold_Down(id: number) {
            const count: number = await Ipnut_Gold() 
            const messa: string = await Ipnut_Message()
            const user_get: any = await prisma.user.findFirst({
                where: {
                    id
                }
            })
            if (user_get.gold-count >= 0) {
                const money_put = await prisma.user.update({
                    where: {
                        id: user_get.id
                    },
                    data: {
                        gold: user_get.gold - count
                    }
                })
                await vk.api.messages.send({
                    user_id: user_get.idvk,
                    random_id: 0,
                    message: `🏦С вас снято ${count}💰. \nВаш счёт: ${money_put.gold}💰 \n Уведомление: ${messa}`
                })
                context.send(`🏦Операция завершена успешно`)
                console.log(`User ${user_get.idvk} lost ${count} gold. Him/Her bank now ${money_put.gold}`)
            } else {
                const confirmq = await context.question(`Вы хотите снять ${count} 💰галлеонов c счета ${user_get.name}, но счет этого ${user_get.spec} ${user_get.gold}. Уверены, что хотите сделать баланс: ${user_get.gold-count}`,
                {
                    keyboard: Keyboard.builder()
                    .textButton({
                        label: 'Да',
                        payload: {
                            command: 'confirm'
                        },
                        color: 'secondary'
                    })
                    .textButton({
                        label: 'Нет',
                        payload: {
                            command: 'gold_down'
                        },
                        color: 'secondary'
                    })
                    .oneTime().inline()
                    }
                )
                if (confirmq.payload.command === 'confirm') {
                    const money_put = await prisma.user.update({
                        where: {
                            id: user_get.id
                        },
                        data: {
                            gold: user_get.gold - count
                        }
                    })
                    await vk.api.messages.send({
                        user_id: user_get.idvk,
                        random_id: 0,
                        message: `🏦С вас снято ${count}💰. \nВаш счёт: ${money_put.gold}💰 \n Уведомление: ${messa}`
                    })
                    context.send(`🏦Операция завершена успешно`)
                    console.log(`User ${user_get.idvk} lost ${count} gold. Him/Her bank now ${money_put.gold}`)
                } else {
                    context.send(`Нужно быть жестче! Греби бабло`)
                }
            }
        }
        async function Xp_Up(id: number) {
            const count: number = await Ipnut_Gold() 
            const messa: string = await Ipnut_Message()
            const user_get: any = await prisma.user.findFirst({
                where: {
                    id
                }
            })
            const money_put = await prisma.user.update({
                where: {
                    id: user_get.id
                },
                data: {
                    xp: user_get.xp + count
                }
            })
            await vk.api.messages.send({
                user_id: user_get.idvk,
                random_id: 0,
                message: `🏦Вам начислено ${count}🧙. \nВаш МО: ${money_put.xp}🧙 \n Уведомление: ${messa}`
            })
            context.send(`🏦Операция завершена успешно`)
            console.log(`User ${user_get.idvk} got ${count} MO. Him/Her XP now ${money_put.xp}`)
        }
        async function Xp_Down(id: number) {
            const count: number = await Ipnut_Gold() 
            const messa: string = await Ipnut_Message()
            const user_get: any = await prisma.user.findFirst({
                where: {
                    id
                }
            })
            if (user_get.xp-count >= 0) {
                const money_put = await prisma.user.update({
                    where: {
                        id: user_get.id
                    },
                    data: {
                        xp: user_get.xp - count
                    }
                })
                await vk.api.messages.send({
                    user_id: user_get.idvk,
                    random_id: 0,
                    message: `🏦С вас снято ${count}🧙. \nВаш МО: ${money_put.xp}🧙  \n Уведомление: ${messa}`
                })
                context.send(`🏦Операция завершена успешно`)
                console.log(`User ${user_get.idvk} lost ${count} MO. Him/Her XP now ${money_put.xp}`)
            } else {
                context.send(`Вы хотите снять ${count} 🧙магического опыта c счета ${user_get.name}, но счет этого ${user_get.spec} ${user_get.xp}. Уверены, что хотите сделать баланс: ${user_get.xp-count}`)
            }
        }
        async function Artefact_Show(id: number) { 
            const artefact = await prisma.artefact.findMany({
                where: {
                    id_user: id
                }
            })
            if (artefact.length > 0) {
                artefact.forEach(async element => {
                    context.send(`
                            Название: ${element.name}
                            ${element.label}:  ${element.type}
                            Подробнее о артефакте:  ${element.description}
                        `,
                        {
                            keyboard: Keyboard.builder()
                            .textButton({
                                label: 'Удалить🔮',
                                payload: {
                                    command: `${element.id}`
                                },
                                color: 'secondary'
                            })
                            .oneTime().inline()
                        }
                    )
                });
            } else {
                context.send(`Артефакты отсутствуют =(`)
            }
            console.log(`Admin ${context.senderId} see artefacts from user UID: ${id}`)
        }
        hearManager.hear(/Удалить🔮/, async (context) => {
            if (context.messagePayload == null) {
                return
            }
            const art_get: any = await prisma.artefact.findFirst({
                where: {
                    id: Number(context.messagePayload.command)
                }
            })
            if (art_get) {
                const art_del = await prisma.artefact.delete({
                    where: {
                        id: Number(context.messagePayload.command)
                    }
                })
                context.send(`Удален артефакт ${art_del.name}`)
                const user_find = await prisma.user.findFirst({
                    where: {
                        id: art_del.id_user
                    }
                })
                if (user_find) {
                    await vk.api.messages.send({
                        user_id: user_find.idvk,
                        random_id: 0,
                        message: `Ваш артефакт ${art_del.name} изьял ОМОН!`
                    })
                }
                console.log(`Admin ${context.senderId} destroy artefact from user UID: ${user_find?.idvk}`)
            }
            await Keyboard_Index(context, 'Был артефакт, нееет артефакта!')
        })
        async function Artefact_Add(id: number, count: number) {
            let datas = []
            let trigger = false
            while (trigger == false) {
                const name: any = await context.question(`
                    🏦Внимание запущена процедура генерации Артефакта для банковского счёта 💳:${id}
                    Укажите для нового 🔮артефакта название:
                `)
                if (name.text.length <= 30) {
                    trigger = true
                    datas.push({name: `${name.text}`})
                } else {
                    context.send(`Ввведите до 30 символов включительно!`)
                }
            }

            trigger = false
            while (trigger == false) {
                const type: any = await context.question(`
                        Укажите для нового 🔮артефакта тип применения:
                        🕐 - одноразовое; ♾ - многоразовое.
                    `,
                    {
                        keyboard: Keyboard.builder()
                        .textButton({
                            label: '🕐',
                            payload: {
                                command: 'Одноразовый'
                            },
                            color: 'secondary'
                        })
                        .textButton({
                            label: '♾',
                            payload: {
                                command: 'Многоразовый'
                            },
                            color: 'secondary'
                        }).oneTime().inline()
                    }
                )
                if (type.payload) {
                    trigger = true
                    datas.push({label: `${type.text}`})
                    datas.push({type: `${type.payload.command}`})
                } else {
                    context.send(`Может лучше по кнопочкам жать?`)
                }
            }

            trigger = false
            while (trigger == false) {
                const description: any = await context.question(`
                    Укажите для нового 🔮артефакта ссылку на картинку самого артефакта из альбома группы Хогвартс Онлайн:
                `)
                if (description.text.length <= 1000) {
                    trigger = true
                    datas.push({description: `${description.text}`})
                } else {
                    context.send(`Ввведите до 1000 символов включительно!`)
                }
            }
            const target: any = await prisma.user.findFirst({
                where: {
                    id
                },
                select: {
                    idvk: true
                }
            })
            const artefact_create = await prisma.artefact.create({
                data: {
                    id_user: id,
                    name: datas[0].name,
                    label: datas[1].label,
                    type: datas[2].type,
                    description: datas[3].description
                }
            })
            await vk.api.messages.send({
                user_id: target.idvk,
                random_id: 0,
                message: `🏦Поздравляем! Вы получили новый 🔮: ${artefact_create.name}
                    ${artefact_create.label}: ${artefact_create.type}
                `
            })
            console.log(`Admin ${context.senderId} create artefact for user: ${target.idvk}`)
            context.send(`🏦Операция завершена успешно`)
        }
        async function Back(id: number, count: number) {
            console.log(`Admin ${context.senderId} canceled operation for user UID: ${id}`)
            context.send(`Операция отменена пользователем.`)
        }
        async function Ipnut_Gold() {
            let golden = 0
            let money_check = false
            while (money_check == false) {
                const gold = await context.question(`
                    Введите количество для операции ${ans.text}:
                `)
                if (gold.text) {
                    money_check = true
                    golden = Number(gold.text)
                } 
            }
            return golden
        }
        async function Ipnut_Message() {
            let golden = ''
            let money_check = false
            while (money_check == false) {
                const gold = await context.question(`
                    Введите уведомление пользователю ${ans.text}:
                `)
                if (gold.text) {
                    money_check = true
                    golden = gold.text
                } 
            }
            return golden
        }
        async function User_delete(id: number) {
            const user_get: any = await prisma.user.findFirst({
                where: {
                    id: id
                }
            })
            if (user_get) {
                const user_del = await prisma.user.delete({
                    where: {
                        id: id
                    }
                })
                context.send(`Удален пользователь ${user_del.name}`)
                if (user_del) {
                    await vk.api.messages.send({
                        user_id: user_del.idvk,
                        random_id: 0,
                        message: `Ваша карточка 💳UID: ${user_del.id} больше не действительна. Спасибо, что пользовались банком Гринготтс 🏦, ${user_del.name}. Возвращайтесь к нам снова!`
                    })
                }
                console.log(`Admin ${context.senderId} deleted user: ${user_del.idvk}`)
            }
        }
        if (ans.payload && ans.payload.command != 'back') {
            const config = {
                'gold_up': Gold_Up,
                'gold_down': Gold_Down,
                'xp_up': Xp_Up,
                'xp_down': Xp_Down,
                'back': Back,
                'artefact_add': Artefact_Add,
                'artefact_show': Artefact_Show,
                'user_delete': User_delete
            }
            const answergot = await config[ans.payload.command](Number(datas[0].id))
        } else {
            context.send(`Операция отменена пользователем.`)
        }
        await Keyboard_Index(context, `Как насчет еще одной операции? Может позвать доктора?`)
        prisma.$disconnect()
    })
    hearManager.hear(/инвентарь/, async (context) => {
        const get_user:any = await prisma.user.findFirst({
            where: {
                idvk: context.senderId
            }
        })
        const inventory = await prisma.inventory.findMany({
            where: {
                id_user: get_user.id
            }
        })
        let cart = ''
        let counter = 0
        await context.sendPhotos({
            value: './src/art/inventory.jpg',
        });
        if (inventory.length == 0) {
            context.send(`Вы еще ничего не приобрели:(`)
        } else {
            const promise = new Promise(async (resolve, reject) => {
                inventory.forEach(async element => {
                    const item = await prisma.item.findFirst({
                        where: {
                            id: element.id_item 
                        }
                    })
                    cart += `${item?.name} \n`
                    counter++
                    if(inventory.length == counter){
                        resolve('Все прошло отлично!');
                    }
                })
            });
            promise.then(
                (data) => {
                    context.send(`Вы приобрели следующее: \n ${cart}`)
                },
                (error) => {
                console.log(error); // вывести ошибку
                }
            );
        }
        prisma.$disconnect()
        console.log(`User ${context.senderId} see self inventory`)
        await Keyboard_Index(context, `Что ж, имущества много не бывает, но как насчет подзаработать еще галлеонов?`)
    })

    hearManager.hear(/админка/, async (context: any) => {
        if (context.senderId == root) {
            const user:any = await prisma.user.findFirst({
                where: {
                    idvk: Number(context.senderId)
                }
            })
            const lvlup = await prisma.user.update({
                where: {
                    id: user.id
                },
                data: {
                    id_role: 2
                }
            })
            if (lvlup) {
                context.send(`Рут права получены`)
            } else {
                context.send(`Ошибка`)
            }
        }
        console.log(`Super user ${context.senderId} got root`)
        await Keyboard_Index(context, `Захват мира снова в теме!`)
    })
    hearManager.hear(/права/, async (context: any) => {
        if (context.senderId == root) {
            const uid = await context.question(`
                Введите 💳UID банковского счета получателя:
			`)
			if (uid.text) {
                const get_user = await prisma.user.findFirst({
                    where: {
                        id: Number(uid.text)
                    }
                })
                if (get_user) {
                    const artefact_counter = await prisma.artefact.count({
                        where: {
                            id_user: Number(uid.text)
                        }
                    })
                    const role: any = await prisma.role.findFirst({
                        where: {
                            id: get_user.id_role
                        }
                    })
                    context.send(`
                        🏦Открыта следующая карточка: ${get_user.class} ${get_user.name}, ${get_user.spec}:
                        
                        💳UID: ${get_user.id}
                        💰Галлеоны: ${get_user.gold}
                        🧙Магический опыт: ${get_user.xp}
                        📈Уровень: ${get_user.lvl}
                        🔮Количество артефактов: ${artefact_counter}

                        Права пользователя: ${role.name}
                    `)
                    const answer1 = await context.question(`
                        Что будем делать?
                        `,
                        {
                            keyboard: Keyboard.builder()
                            .textButton({
                                label: 'Дать админку',
                                payload: {
                                    command: 'access'
                                },
                                color: 'secondary'
                            })
                            .textButton({
                                label: 'Снять админку',
                                payload: {
                                    command: 'denied'
                                },
                                color: 'secondary'
                            }).row()
                            .textButton({
                                label: 'Ничего не делать',
                                payload: {
                                    command: 'cancel'
                                },
                                color: 'secondary'
                            })
                            .oneTime().inline()
                        }
                    )
                    if (!answer1.payload) {
                        context.send(`Жмите только по кнопкам с иконками!`)
                    } else {
                        if (answer1.payload.command === 'access') {
                            const lvlup = await prisma.user.update({
                                where: {
                                    id: get_user.id
                                },
                                data: {
                                    id_role: 2
                                }
                            })
                            if (lvlup) {
                                context.send(`Администратором становится ${get_user.name}`)
                                await vk.api.messages.send({
                                    user_id: get_user.idvk,
                                    random_id: 0,
                                    message: `Вас назначили администратором`
                                })
                                console.log(`Admin ${context.senderId} set status admin for ${get_user.idvk}`)
                            } else {
                                context.send(`Ошибка`)
                            }
                        }
                        if (answer1.payload.command === 'denied') {
                            const lvlup = await prisma.user.update({
                                where: {
                                    id: get_user.id
                                },
                                data: {
                                    id_role: 1
                                }
                            })
                            if (lvlup) {
                                context.send(`Обычным пользователем становится ${get_user.name}`)
                                await vk.api.messages.send({
                                    user_id: get_user.idvk,
                                    random_id: 0,
                                    message: `Вас понизили до обычного пользователя`
                                })
                                console.log(`Admin ${context.senderId} drop status admin for ${get_user.idvk}`)
                            } else {
                                context.send(`Ошибка`)
                            }
                        }
                        if (answer1.payload.command === 'cancel') {
                            context.send(`Тоже вариант`)
                        }
                    }
                }
			} else {
				context.send(`Нет такого банковского счета!`)
			}
        }
        prisma.$disconnect
        await Keyboard_Index(context, `Повышение в должности, не всегда понижение!`)
    })
    hearManager.hear(/админы/, async (context: any) => {
        const user = await prisma.user.findFirst({
            where: {
                idvk: context.senderId
            }
        })
        if (user?.id_role == 2) {
            const users = await prisma.user.findMany({
                where: {
                    id_role: 2
                }
            })
            context.send(`${JSON.stringify(users)}`)
        }
        console.log(`Admin ${context.senderId} see list administrators`)
        await Keyboard_Index(context, `Им бы еще черные очки, и точно люди в черном!`)
    })
}

    