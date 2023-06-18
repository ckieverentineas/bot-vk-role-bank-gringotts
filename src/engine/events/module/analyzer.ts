import { Analyzer, User } from "@prisma/client"
import prisma from "./prisma_client"
import { randomInt } from "crypto"
import { chat_id, vk } from "../../.."

export async function Analyzer_Init(id_user: number) {
    const analyzer: Analyzer | null = await prisma.analyzer.findFirst({ where: { id_user: id_user } })
    if (!analyzer) {
        const analyze_init: Analyzer | null = await prisma.analyzer.create({ data: { id_user: id_user } })
        if (analyze_init) { console.log(`Analyzer module activation for user UID ${id_user}`) }
    }
}

interface Achivied {
    uid: number,
    name: string,
    subname: String[]
    description: string,
    counter: number
}

export async function Analyzer_Birthday_Counter(context: any) {
    const user: any = await prisma.user.findFirst({ where: { idvk: context.peerId } })
    const id_user = user.id
    await Analyzer_Init(id_user)
    const analyzer: Analyzer | null = await prisma.analyzer.findFirst({ where: { id_user: id_user } })
    const birthday: Achivied[] = [
        { uid: 1, name: "Ученик", subname: ["Новичок", "Маленький Маг", "Ботаник"], description: "Награда по достижению 1 года в ролевой", counter: 1 }, 
        { uid: 2, name: "Первокурсник", subname: ["Молодой Чародей", "Надежда Хогвартса", "Избранник"], description: "Награда по достижению 2 года в ролевой", counter: 2 },
        { uid: 3, name: "Второкурсник", subname: ["Блестящий Ученик", "Одаренный Маг", "Мастер Иллюзий"], description: "Награда по достижению 3 года в ролевой", counter: 3 },
        { uid: 4, name: "Третьекурсник", subname: ["Талантливый Волшебник", "Мастер Чародейства", "Охотник на Сокровища"], description: "Награда по достижению 4 года в ролевой", counter: 4 },
        { uid: 5, name: "Четвертокурсник", subname: ["Покровитель Знаний", "Мастер Заклинаний", "Владыка Интриг"], description: "Награда по достижению 5 года в ролевой", counter: 5 },
        { uid: 6, name: "Пятёркокурсник", subname: ["Герой Хогвартса", "Магистр Трансфигурации", "Чародей-Исследователь"], description: "Награда по достижению 6 года в ролевой", counter: 6 },
        { uid: 7, name: "Шестикурсник", subname: ["Маг Совершенства", "Повелитель Элементов", "Мастер Артефактов"], description: "Награда по достижению 7 года в ролевой", counter: 7 },
        { uid: 8, name: "Седьмикурсник", subname: ["Герой Войны", "Магистр Яда", "Воитель Света"], description: "Награда по достижению 8 года в ролевой", counter: 8 },
        { uid: 9, name: "Абсолютный Чемпион Хогвартса", subname: ["Неукротимый Лидер", "Повелитель Тьмы", "Маг Великого Уровня"], description: "Награда по достижению 9 года в ролевой", counter: 9 },
        { uid: 10, name: "Магистр Закона", subname: ["Воплощение Справедливости", "Чемпион Ордена Феникса", "Покровитель Мира"], description: "Награда по достижению 10 года в ролевой", counter: 10 },
        { uid: 11, name: "Владыка Заклинаний", subname: ["Магистр Огня", "Повелитель Времени", "Покровитель Магии"], description: "Награда по достижению 11 года в ролевой", counter: 11 },
        { uid: 12, name: "Маг-Странник", subname: ["Покоритель Бездны", "Владыка Ночи", "Мастер Тайн"], description: "Награда по достижению 12 года в ролевой", counter: 12 },
        { uid: 13, name: "Хранитель Равновесия", subname: ["Магистр Баланса", "Владыка Стихий", "Покровитель Природы"], description: "Награда по достижению 13 года в ролевой", counter: 13 },
        { uid: 14, name: "Герой Легенды", subname: ["Мастер Легендарных Искусств", "Повелитель Миров", "Чемпион Хаоса"], description: "Награда по достижению 14 года в ролевой", counter: 14 },
        { uid: 15, name: "Волшебный Король", subname: ["Легендарный Маг", "Правитель Волшебного Мира", "Властелин Тайн"], description: "Награда по достижению 15 года в ролевой", counter: 15 },
    ]
    if (analyzer) {
        const analyze_birthday_counter: Analyzer | null = await prisma.analyzer.update({ where: { id: analyzer.id }, data: { birthday: { increment: 1 } } })
        if (analyze_birthday_counter) { 
            console.log(`Analyzer module detected birthday for user UID ${id_user}`)
            for (const i in birthday) {
                if (analyze_birthday_counter.birthday == birthday[i].counter) {
                    const achive_check = await prisma.achievement.findFirst({ where: { uid: birthday[i].uid } })
                    if (!achive_check) {
                        const achive_add = await prisma.achievement.create({ data: { uid: birthday[i].uid, name: `${birthday[i].name} - ${birthday[i].subname[randomInt(0, 3)]}`, id_user: id_user } })
                        if (achive_add) {
                            const xp = randomInt(1, 15)
                            await prisma.user.update({ where: { id: id_user }, data: { xp: { increment: xp } } })
                            await vk.api.messages.send({
                                peer_id: user.idvk,
                                random_id: 0,
                                message: `🌟 Получено достижение: ${achive_add.name}.`
                            })
                            await vk.api.messages.send({
                                peer_id: chat_id,
                                random_id: 0,
                                message: `🌟 @id${user.idvk}(${user.name}) выполняет достижение ${achive_add.name} и получает на счет ${xp}🧙.`
                            })
                        }
                    }
                }
            }
        }
    }
}