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
        context.send(`
            Вы достали свою карточку, ${get_user.class} ${get_user.name}, ${get_user.spec}:
            💳UID: ${get_user.id}
            🪙Галлеоны: ${get_user.gold}
            🧙Магический опыт: ${get_user.xp}
            📈Уровень: ${get_user.lvl}

        `)
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
                    context.send(`
                        🏦Открыта следующая карточка: ${get_user.class} ${get_user.name}, ${get_user.spec}:
                        
                        💳UID: ${get_user.id}
                        🪙Галлеоны: ${get_user.gold}
                        🧙Магический опыт: ${get_user.xp}
                        📈Уровень: ${get_user.lvl}
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
                label: '🔙',
                payload: {
                    command: 'back'
                },
                color: 'secondary'
            })
            .oneTime().inline()
            }
        )
        async function Gold_Up(id: number, count: number) {
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
        async function Gold_Down(id: number, count: number) {
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
        async function Xp_Up(id: number, count: number) {
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
        async function Xp_Down(id: number, count: number) {
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
                context.send(`Вы хотите снять ${count} 🪙галлеонов c счета ${user_get.name}, но счет этого ${user_get.spec} ${user_get.xp}. Уверены, что хотите сделать баланс: ${user_get.xp-count}`)
            }
        }
        async function Back(id: number, count: number) {
            context.send(`Операция отменена пользователем.`)
        }
        if (ans.payload && ans.payload.command != 'back') {
            let money_check = false
            while (money_check == false) {
                const gold = await context.question(`
                    Введите количество для операции ${ans.text}:
                `)
                if (gold.text) {
                    const config = {
                        'gold_up': Gold_Up,
                        'gold_down': Gold_Down,
                        'xp_up': Xp_Up,
                        'xp_down': Xp_Down,
                        'back': Back
                    }
                    const answergot = await config[ans.payload.command](Number(datas[0].id), Number(gold.text))
                    money_check = true
                    
                } else {
                    context.send(`Невозможно сие!`)
                }
            }
        } else {
            context.send(`Операция отменена пользователем.`)
        }
        
        
        prisma.$disconnect()
    })
}