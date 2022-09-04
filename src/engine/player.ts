import { PrismaClient } from "@prisma/client";
import { HearManager } from "@vk-io/hear";
import { randomInt } from "crypto";
import { send } from "process";
import { Attachment, Keyboard, KeyboardBuilder } from "vk-io";
import { IQuestionMessageContext } from "vk-io-question";
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import { vk } from '../index';

const prisma = new PrismaClient()

export function registerUserRoutes(hearManager: HearManager<IQuestionMessageContext>): void {
	hearManager.hear(/0/, async (context) => {
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
    })
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
            🪙Галлеоны: ${get_user.gold}
            🧙Магический опыт: ${get_user.xp}
            📈Уровень: ${get_user.lvl}
            🔮Количество артефактов: ${artefact_counter}
        `)
        prisma.$disconnect()
    })
    hearManager.hear(/артефакты/, async (context) => {
        const get_user:any = await prisma.user.findFirst({
            where: {
                idvk: context.senderId
            }
        })
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
            artefact.forEach(element => {
                context.send(`
                    Название: ${element.name}
                    ${element.label}:  ${element.type}
                    Подробнее о артефатке:  ${element.description}
                `)
            });
        } else {
            context.send(`У Вас еще нет артефактов =(`)
        }
        
        prisma.$disconnect()
    })
    hearManager.hear(/магазин/, async (context) => {
        const get_user:any = await prisma.user.findFirst({
            where: {
                idvk: context.senderId
            }
        })
        context.send(`
            Зайдя в переулок и взглянув на прилавок, вы вспомнили что на вашем счету 🪙${get_user.gold} галлеонов
        `)
        prisma.$disconnect()
    })
    hearManager.hear(/операции/, async (context) => {
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
                console.log(uid.text)
                console.log(get_user)
                if (get_user) {
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
                        🪙Галлеоны: ${get_user.gold}
                        🧙Магический опыт: ${get_user.xp}
                        📈Уровень: ${get_user.lvl}
                        🔮Количество артефактов: ${artefact_counter}
                    `)
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
                label: '+🪙',
                payload: {
                    command: 'gold_up'
                },
                color: 'secondary'
            })
            .textButton({
                label: '-🪙',
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
            .row()
            .textButton({
                label: '🔙',
                payload: {
                    command: 'back'
                },
                color: 'secondary'
            })
            .oneTime().inline()
            }
        )
        async function Gold_Up(id: number) {
            const count: number = await Ipnut_Gold() 
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
                message: `🏦Вам начислено ${count}🪙галлеонов. \nВаш счёт: ${money_put.gold}🪙`
            })
            context.send(`🏦Операция завершена успешно`)
            console.log(`User ${user_get.idvk} got ${count} gold. Him/Her bank now ${money_put.gold}`)
        }
        async function Gold_Down(id: number) {
            const count: number = await Ipnut_Gold() 
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
                    message: `🏦С вас снятно ${count}🪙галлеонов. \nВаш счёт: ${money_put.gold}🪙`
                })
                context.send(`🏦Операция завершена успешно`)
                console.log(`User ${user_get.idvk} lost ${count} gold. Him/Her bank now ${money_put.gold}`)
            } else {
                context.send(`Вы хотите снять ${count} 🪙галлеонов c счета ${user_get.name}, но счет этого ${user_get.spec} ${user_get.gold}. Уверены, что хотите сделать баланс: ${user_get.gold-count}`)
            }
        }
        async function Xp_Up(id: number) {
            const count: number = await Ipnut_Gold() 
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
                message: `🏦Вам начислено ${count}🧙магического опыта. \nВаш МО: ${money_put.xp}🧙`
            })
            context.send(`🏦Операция завершена успешно`)
            console.log(`User ${user_get.idvk} got ${count} MO. Him/Her XP now ${money_put.xp}`)
        }
        async function Xp_Down(id: number) {
            const count: number = await Ipnut_Gold() 
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
                    message: `🏦С вас снятно ${count}🧙магического опыта. \nВаш МО: ${money_put.xp}🧙`
                })
                context.send(`🏦Операция завершена успешно`)
                console.log(`User ${user_get.idvk} lost ${count} MO. Him/Her XP now ${money_put.xp}`)
            } else {
                context.send(`Вы хотите снять ${count} 🧙магического опыта c счета ${user_get.name}, но счет этого ${user_get.spec} ${user_get.xp}. Уверены, что хотите сделать баланс: ${user_get.xp-count}`)
            }
        }
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
            context.send(`🏦Операция завершена успешно`)
        }
        async function Back(id: number, count: number) {
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
        if (ans.payload && ans.payload.command != 'back') {
            const config = {
                'gold_up': Gold_Up,
                'gold_down': Gold_Down,
                'xp_up': Xp_Up,
                'xp_down': Xp_Down,
                'back': Back,
                'artefact_add': Artefact_Add
            }
            const answergot = await config[ans.payload.command](Number(datas[0].id))
        } else {
            context.send(`Операция отменена пользователем.`)
        }
        
        
        prisma.$disconnect()
    })
}