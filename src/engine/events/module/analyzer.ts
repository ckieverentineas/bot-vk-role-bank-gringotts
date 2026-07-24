import { Analyzer, User } from "@prisma/client"
import prisma from "./prisma_client"
import { randomInt } from "crypto"
import { chat_id, vk } from "../../.."
import { To_Vk_Id } from "../../core/helper"

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
                if (analyze_birthday_counter.birthday >= birthday[i].counter) {
                    const achive_check = await prisma.achievement.findFirst({ where: { uid: birthday[i].uid, id_user: id_user } })
                    if (!achive_check) {
                        const achive_add = await prisma.achievement.create({ data: { uid: birthday[i].uid, name: `🎁 ${birthday[i].name} - ${birthday[i].subname[randomInt(0, 3)]}`, id_user: id_user } })
                        if (achive_add) {
                            const xp = randomInt(1, 15)
                            await prisma.user.update({ where: { id: id_user }, data: { xp: { increment: xp } } })
                            await vk.api.messages.send({
                                peer_id: To_Vk_Id(user.idvk),
                                random_id: 0,
                                message: `🌟 Получено достижение:\n${achive_add.name}`
                            })
                            await vk.api.messages.send({
                                peer_id: chat_id,
                                random_id: 0,
                                message: `🌟 @id${user.idvk}(${user.name}) выполняет достижение:\n${achive_add.name} и получает на счет ${xp}🧙.`
                            })
                        }
                    }
                }
            }
        }
    }
}

export async function Analyzer_Beer_Counter(context: any) {
    const user: any = await prisma.user.findFirst({ where: { idvk: context.peerId } })
    const id_user = user.id
    await Analyzer_Init(id_user)
    const analyzer: Analyzer | null = await prisma.analyzer.findFirst({ where: { id_user: id_user } })
    const birthday: Achivied[] = [
        { uid: 16, name: "Новичок", subname: ["Лох", "Зеленый", "Размокший"], description: "Первое сливочное пиво", counter: 1 }, 
        { uid: 17, name: "Знаток", subname: ["Знаток", "Искушенный", "Опытный"], description: "Пять сливочных пив", counter: 5 },
        { uid: 18, name: "Эксперт", subname: ["Эксперт", "Мастер", "Продвинутый"], description: "Десять сливочных пив", counter: 10 },
        { uid: 19, name: "Маг", subname: ["Маг", "Чародей", "Волшебник"], description: "Пятнадцать сливочных пив", counter: 15 },
        { uid: 20, name: "Сварщик", subname: ["Сварщик", "Пивовар", "Мастер-Пивовар"], description: "Двадцать пять сливочных пив", counter: 20 },
        { uid: 21, name: "Хозяин пивоварни", subname: ["Хозяин пивоварни", "Магистр пивоварения", "Король Пивоваров"], description: "Пятьдесят сливочных пив", counter: 25 },
        { uid: 22, name: "Бармен", subname: ["Бармен", "Мастер-Бармен", "Король Барменов"], description: "Сто сливочных пив", counter: 30 },
        { uid: 23, name: "Почетный клиент", subname: ["Почетный клиент", "Любитель пива", "Пивной гурман"], description: "Двести сливочных пив", counter: 50 },
        { uid: 24, name: "Пивной магнат", subname: ["Пивной магнат", "Богатый пивовар", "Император Пива"], description: "Четыреста сливочных пив", counter: 60 },
        { uid: 25, name: "Пивной гуру", subname: ["Пивной гуру", "Мастер-Гурман", "Легенда Пива"], description: "Восемьсот сливочных пив", counter: 70 },
        { uid: 26, name: "Пивной магистр", subname: ["Пивной магистр", "Магистр Пивоварения", "Крылатый Пивовар"], description: "Тысяча двести сливочных пив", counter: 80 },
        { uid: 27, name: "Пивной король", subname: ["Пивной король", "Король Пивоварения", "Пивной Бог"], description: "Две тысячи пятьсот сливочных пив", counter: 90 },
        { uid: 28, name: "Пивной император", subname: ["Пивной император", "Император Пивоварения", "Всемогущий Пивовар"], description: "Пять тысяч сливочных пив", counter: 100 },
        { uid: 29, name: "Пивной бог", subname: ["Пивной бог", "Бог Пивоварения", "Всевышний Пивовар"], description: "Десять тысяч сливочных пив", counter: 120 },
        { uid: 30, name: "Пивной титан", subname: ["Пивной титан", "Титан Пивоварения", "Непобедимый Пивовар"], description: "Двадцать тысяч сливочных пив", counter: 150 },
    ]
    if (analyzer) {
        const analyze_birthday_counter: Analyzer | null = await prisma.analyzer.update({ where: { id: analyzer.id }, data: { beer: { increment: 1 } } })
        if (analyze_birthday_counter) { 
            console.log(`Analyzer module detected beer for user UID ${id_user}`)
            for (const i in birthday) {
                if (analyze_birthday_counter.beer >= birthday[i].counter) {
                    const achive_check = await prisma.achievement.findFirst({ where: { uid: birthday[i].uid, id_user: id_user } })
                    if (!achive_check) {
                        const achive_add = await prisma.achievement.create({ data: { uid: birthday[i].uid, name: `🍺 ${birthday[i].name} - ${birthday[i].subname[randomInt(0, 3)]}`, id_user: id_user } })
                        if (achive_add) {
                            const xp = randomInt(1, 15)
                            await prisma.user.update({ where: { id: id_user }, data: { xp: { increment: xp } } })
                            await vk.api.messages.send({
                                peer_id: To_Vk_Id(user.idvk),
                                random_id: 0,
                                message: `🌟 Получено достижение:\n${achive_add.name}`
                            })
                            await vk.api.messages.send({
                                peer_id: chat_id,
                                random_id: 0,
                                message: `🌟 @id${user.idvk}(${user.name}) выполняет достижение:\n${achive_add.name} и получает на счет ${xp}🧙.`
                            })
                        }
                    }
                }
            }
        }
    }
}

export async function Analyzer_Beer_Premium_Counter(context: any) {
    const user: any = await prisma.user.findFirst({ where: { idvk: context.peerId } })
    const id_user = user.id
    await Analyzer_Init(id_user)
    const analyzer: Analyzer | null = await prisma.analyzer.findFirst({ where: { id_user: id_user } })
    const birthday: Achivied[] = [
        { uid: 31, name: "Скрытый почитатель", subname: ["Новичок в секте Бамбуко", "Начинающий поклонник", "Скрытый ценитель"], description: "Первое бамбуковое пиво", counter: 1 }, 
        { uid: 32, name: "Утонченный вкус", subname: ["Искушенный вкус", "Утонченный гурман", "Разборчивый ценитель"], description: "Пять бамбуковых пив", counter: 5 },
        { uid: 33, name: "Таинственный коллекционер", subname: ["Владыка тайного подполья", "Хранитель тайных запасов", "Обладатель тайных знаний"], description: "Десять бамбуковых пив", counter: 10 },
        { uid: 34, name: "Покровитель традиций", subname: ["Хранитель древних рецептов", "Покровитель наследия", "Преданный поклонник старинных рецептов"], description: "Пятнадцать бамбуковых пив", counter: 15 },
        { uid: 35, name: "Отважный исследователь", subname: ["Искатель новых гастрономических границ", "Путешественник в мире вкусов", "Любопытный искатель новых вкусов"], description: "Двадцать пять бамбуковых пив", counter: 20 },
        { uid: 36, name: "Маг-алхимик", subname: ["Волшебник вкусовых качеств", "Мастер создания волшебных напитков", "Волшебник вкусов"], description: "Сорок бамбуковых пив", counter: 25 },
        { uid: 37, name: "Мечтатель", subname: ["Искатель крутого аромата", "Фантазер", "Искатель идеального вкуса"], description: "Пятьдесят бамбуковых пив", counter: 30 },
        { uid: 38, name: "Эксперт-сомелье", subname: ["Мастер оценки", "Арбитр вкусов и ароматов", "Эксперт по подбору пива к блюдам"], description: "Семьдесят пять бамбуковых пив", counter: 50 },
        { uid: 39, name: "Гурман-эстет", subname: ["Критик вкуса и дизайна", "Изыскатель эстетических особенностей", "Изыскатель вкусовых качеств"], description: "Сто бамбуковых пив", counter: 60 },
        { uid: 40, name: "Мастер-создатель", subname: ["Мастер создания уникальных вкусовых композиций", "Профессионал варения пива", "Эксперт в пивоварении"], description: "Сто двадцать пять бамбуковых пив", counter: 70 },
        { uid: 41, name: "Эксперт вкуса", subname: ["Пивной герой", "Знаток вкусовых качеств", "Мастер-эксперт в пивоварении"], description: "Сто пятьдесят бамбуковых пив", counter: 80 },
        { uid: 42, name: "Легенда пивоварения", subname: ["Повелитель вкусового мира", "Мастер-бог пивоварения", "Легендарный мастер-пивовар"], description: "Двести бамбуковых пив", counter: 90 },
        { uid: 43, name: "Бог пивоварения", subname: ["Божественный пивовар", "Одержимый пивом", "Властелин мирового пивоварения"], description: "Триста бамбуковых пив", counter: 100 },
        { uid: 44, name: "Всемогущий пивовар", subname: ["Альтернативный нагибатор", "Владыка пивогалактики", "Непобедимый властелин пивоварения"], description: "Пятьсот бамбуковых пив", counter: 120 },
        { uid: 45, name: "Властелин Бамбуко", subname: ["Несравненный маэстро варения пива", "Бессмертный король Бамбуко", "Несокрушимый повелитель пивоварения"], description: "Тысяча бамбуковых пив", counter: 150 },
    ]
    if (analyzer) {
        const analyze_birthday_counter: Analyzer | null = await prisma.analyzer.update({ where: { id: analyzer.id }, data: { beer_premiun: { increment: 1 } } })
        if (analyze_birthday_counter) { 
            console.log(`Analyzer module detected beer bambuke premium for user UID ${id_user}`)
            for (const i in birthday) {
                if (analyze_birthday_counter.beer_premiun >= birthday[i].counter) {
                    const achive_check = await prisma.achievement.findFirst({ where: { uid: birthday[i].uid, id_user: id_user } })
                    if (!achive_check) {
                        const achive_add = await prisma.achievement.create({ data: { uid: birthday[i].uid, name: `🍵 ${birthday[i].name} - ${birthday[i].subname[randomInt(0, 3)]}`, id_user: id_user } })
                        if (achive_add) {
                            const xp = randomInt(1, 15)
                            await prisma.user.update({ where: { id: id_user }, data: { xp: { increment: xp } } })
                            await vk.api.messages.send({
                                peer_id: To_Vk_Id(user.idvk),
                                random_id: 0,
                                message: `🌟 Получено достижение:\n${achive_add.name}`
                            })
                            await vk.api.messages.send({
                                peer_id: chat_id,
                                random_id: 0,
                                message: `🌟 @id${user.idvk}(${user.name}) выполняет достижение:\n${achive_add.name} и получает на счет ${xp}🧙.`
                            })
                        }
                    }
                }
            }
        }
    }
}

export async function Analyzer_Underwear_Counter(context: any) {
    const user: any = await prisma.user.findFirst({ where: { idvk: context.peerId } })
    const id_user = user.id
    await Analyzer_Init(id_user)
    const analyzer: Analyzer | null = await prisma.analyzer.findFirst({ where: { id_user: id_user } })
    const birthday: Achivied[] = [
        { uid: 46, name: "Дай деняг", subname: ["Какая честь?", "Моя прелесть...", "За Ардон!"], description: "Закладывайте свои трусы в банку и получайте опыт. Достигните указанного количества закладок, чтобы получить достижение.", counter: 1 },
        { uid: 47, name: "Меховые трусы", subname: ["Трусы из меха гиппогрифа", "Трусы из меха змея", "Трусы из меха дракона"], description: "Закладывайте в банку трусы, сделанные из меха магических существ. Достигните указанного количества закладок, чтобы получить достижение.", counter: 5 },
        { uid: 48, name: "Трусы-амулеты", subname: ["Трусы-подсумок", "Трусы-рюкзак", "Трусы-хранилище"], description: "Закладывайте в банку трусы с магическими карманами, чтобы получить опыт. Достигните указанного количества закладок, чтобы получить достижение.", counter: 10 },
        { uid: 49, name: "Трусы-летающие коврики", subname: ["Трусы-метлы", "Трусы-крылья", "Трусы-летучие животные"], description: "Закладывайте в банку трусы, сделанные из материалов, которые позволяют летать. Достигните указанного количества закладок, чтобы получить достижение.", counter: 15 },
        { uid: 50, name: "Трусы-защитники", subname: ["Трусы-броня", "Трусы-щит", "Трусы-магический щит"], description: "Закладывайте в банку трусы, сделанные из материалов, которые обеспечивают защиту. Достигните указанного количества закладок, чтобы получить достижение.", counter: 20 },
        { uid: 51, name: "Трусы-исцелители", subname: ["Трусы-лекарство", "Трусы-амброзия", "Трусы-эликсир жизни"], description: "Закладывайте в банку трусы, обладающие целебными свойствами. Достигните указанного количества закладок, чтобы получить достижение.", counter: 25 },
        { uid: 52, name: "Трусы-переводчики", subname: ["Трусы-словарь", "Трусы-переводчик", "Трусы-магический переводчик"], description: "Закладывайте в банку трусы, которые позволяют понимать и говорить на разных языках. Достигните указанного количества закладок, чтобы получить достижение.", counter: 30 },
        { uid: 53, name: "Трусы-проекционисты", subname: ["Трусы-кинопроектор", "Трусы-голографический проектор", "Трусы-магический проектор"], description: "Закладывайте в банку трусы, которые позволяют создавать голограммы и проекции. Достигните указанного количества закладок, чтобы получить достижение.", counter: 50 },
        { uid: 54, name: "Трусы-телепорты", subname: ["Трусы-телепорт", "Трусы-портал", "Трусы-магический переход"], description: "Закладывайте в банку трусы, которые позволяют перемещаться на большие расстояния. Достигните указанного количества закладок, чтобы получить достижение.", counter: 60 },
        { uid: 55, name: "Трусы-маскировщики", subname: ["Трусы-камуфляж", "Трусы-переменная маскировка", "Трусы-магический камуфляж"], description: "Закладывайте в банку трусы, которые позволяют скрываться и маскироваться. Достигните указанного количества закладок, чтобы получить достижение.", counter: 70 },
        { uid: 56, name: "Трусы-перезарядки", subname: ["Трусы-перезарядка", "Трусы-магическая батарея", "Трусы-энергетический резервуар"], description: "Закладывайте в банку трусы, которые позволяют быстро восстанавливать магическую энергию. Достигните указанного количества закладок, чтобы получить достижение.", counter: 80 },
        { uid: 57, name: "Трусы-взломщики", subname: ["Трусы-взломщик", "Трусы-взломщик замков", "Трусы-магический взломщик"], description: "Закладывайте в банку трусы, которые позволяют взламывать различные защитные механизмы. Достигните указанного количества закладок, чтобы получить достижение.", counter: 90 },
        { uid: 58, name: "Трусы-магниты", subname: ["Трусы-магнит", "Трусы-магнитный щит", "Трусы-магнитный торнадо"], description: "Закладывайте в банку трусы, которые притягивают к себе различные предметы. Достигните указанного количества закладок, чтобы получить достижение.", counter: 100 },
        { uid: 59, name: "Трусы-трансформеры", subname: ["Трусы-перевоплощение", "Трусы-трансформер", "Трусы-магический трансформер"], description: "Закладывайте в банку трусы, которые позволяют менять свой облик. Достигните указанного количества закладок, чтобы получить достижение.", counter: 120 },
        { uid: 60, name: "Трусы-генераторы", subname: ["Трусы-генератор", "Трусы-магический генератор", "Трусы-энергетический генератор"], description: "Закладывайте в банку трусы, которые позволяют создавать энергию. Достигните указанного количества закладок, чтобы получить достижение.", counter: 150 }
    ]
    if (analyzer) {
        const analyze_birthday_counter: Analyzer | null = await prisma.analyzer.update({ where: { id: analyzer.id }, data: { underwear: { increment: 1 } } })
        if (analyze_birthday_counter) { 
            console.log(`Analyzer module detected underwear for user UID ${id_user}`)
            for (const i in birthday) {
                if (analyze_birthday_counter.underwear >= birthday[i].counter) {
                    const achive_check = await prisma.achievement.findFirst({ where: { uid: birthday[i].uid, id_user: id_user } })
                    if (!achive_check) {
                        const achive_add = await prisma.achievement.create({ data: { uid: birthday[i].uid, name: `👙 ${birthday[i].name} - ${birthday[i].subname[randomInt(0, 3)]}`, id_user: id_user } })
                        if (achive_add) {
                            const xp = randomInt(1, 15)
                            await prisma.user.update({ where: { id: id_user }, data: { xp: { increment: xp } } })
                            await vk.api.messages.send({
                                peer_id: To_Vk_Id(user.idvk),
                                random_id: 0,
                                message: `🌟 Получено достижение:\n${achive_add.name}`
                            })
                            await vk.api.messages.send({
                                peer_id: chat_id,
                                random_id: 0,
                                message: `🌟 @id${user.idvk}(${user.name}) выполняет достижение:\n${achive_add.name} и получает на счет ${xp}🧙.`
                            })
                        }
                    }
                }
            }
        }
    }
}

export async function Analyzer_Quest_Counter(context: any) {
    const user: any = await prisma.user.findFirst({ where: { idvk: context.peerId } })
    const id_user = user.id
    await Analyzer_Init(id_user)
    const analyzer: Analyzer | null = await prisma.analyzer.findFirst({ where: { id_user: id_user } })
    const birthday: Achivied[] = [
        { uid: 61, name: "Заработайте свои первые галеоны", subname: ["Начальный уровень", "Базовый уровень", "Продвинутый уровень"], description: "Выполните ежедневный квест в банке гринготтс и получите свои первые галеоны. Достигните указанного количества галеонов, чтобы получить достижение.", counter: 1 },
        { uid: 62, name: "Банковский инвестор", subname: ["Надежный инвестор", "Опытный инвестор", "Профессиональный инвестор"], description: "Выполняйте ежедневные квесты в банке гринготтс и вкладывайте свои галеоны в различные финансовые инструменты. Достигните указанного объема вложений, чтобы получить достижение.", counter: 5 },
        { uid: 63, name: "Магический трейдер", subname: ["Начинающий трейдер", "Опытный трейдер", "Профессиональный трейдер"], description: "Покупайте и продавайте магические предметы на аукционе банка гринготтс. Достигните указанного объема продаж и покупок, чтобы получить достижение.", counter: 10 },
        { uid: 64, name: "Банковский маг", subname: ["Ученик магии банкинга", "Эксперт в магии банкинга", "Маг-маэстро банкинга"], description: "Изучайте магические способности банкинга и применяйте их в своих ежедневных квестах. Достигните указанного уровня мастерства, чтобы получить достижение.", counter: 15 },
        { uid: 65, name: "Золотые запасы", subname: ["Золотой запас", "Серебряный запас", "Бронзовый запас"], description: "Сохраняйте свои галеоны в банке гринготтс и получайте проценты на свои вклады. Достигните указанного объема накоплений, чтобы получить достижение.", counter: 20 },
        { uid: 66, name: "Банковский меценат", subname: ["Начинающий меценат", "Опытный меценат", "Профессиональный меценат"], description: "Спонсируйте магические проекты и исследования, вложив свои галеоны в нужные фонды. Достигните указанного объема вложений, чтобы получить достижение.", counter: 25 },
        { uid: 67, name: "Банковский гений", subname: ["Начинающий гений", "Опытный гений", "Магический гений"], description: "Станьте экспертом в области банкинга и применяйте свои знания в своих ежедневных квестах. Достигните указанного уровня мастерства, чтобы получить достижение.", counter: 30 },
        { uid: 68, name: "Банковский босс", subname: ["Начальный босс", "Опытный босс", "Профессиональный босс"], description: "Станьте лидером в области банкинга и управляйте своими финансами с максимальной эффективностью. Достигните указанного уровня мастерства, чтобы получить достижение.", counter: 50 },
        { uid: 69, name: "Галеоны-магнат", subname: ["Начинающий магнат", "Опытный магнат", "Магнат-миллионер"], description: "Станьте настоящим магнатом и заработайте миллионы галеонов. Достигните указанного объема накоплений, чтобы получить достижение.", counter: 60 },
        { uid: 70, name: "Банковский император", subname: ["Начинающий император", "Опытный император", "Магический император"], description: "Станьте владельцем магической империи и управляйте несколькими банками гринготтс. Достигните указанного уровня мастерства, чтобы получить достижение.", counter: 70 },
        { uid: 71, name: "Банковский титан", subname: ["Начинающий титан", "Опытный титан", "Магический титан"], description: "Станьте настоящим титаном банкинга и управляйте огромными объемами капиталов. Достигните указанного объема накоплений, чтобы получить достижение.", counter: 80 },
        { uid: 72, name: "Банковский бог", subname: ["Начинающий бог", "Опытный бог", "Магический бог"], description: "Станьте настоящим богом банкинга и обладателем несметных богатств. Достигните указанного объема накоплений, чтобы получить достижение.", counter: 90 },
        { uid: 73, name: "Банковский король", subname: ["Начинающий король", "Опытный король", "Магический король"], description: "Станьте настоящим королем банкинга и управляйте всеми финансовыми потоками Хогвартса. Достигните указанного уровня мастерства, чтобы получить достижение.", counter: 100 },
        { uid: 74, name: "Банковский бессмертный", subname: ["Начинающий бессмертный", "Опытный бессмертный", "Магический бессмертный"], description: "Станьте бессмертным в мире банкинга и продолжайте накапливать богатства без ограничений времени. Достигните указанного уровня мастерства, чтобы получить достижение.", counter: 120 },
        { uid: 75, name: "Банковский легенда", subname: ["Начинающая легенда", "Опытная легенда", "Магическая легенда"], description: "Станьте настоящей легендой мира банкинга и управляйте всеми финансовыми потоками во всей Великой Британии. Достигните указанного уровня мастерства, чтобы получить достижение.", counter: 150 }
    ]
    if (analyzer) {
        const analyze_birthday_counter: Analyzer | null = await prisma.analyzer.update({ where: { id: analyzer.id }, data: { quest: { increment: 1 } } })
        if (analyze_birthday_counter) { 
            console.log(`Analyzer module detected quest for user UID ${id_user}`)
            for (const i in birthday) {
                if (analyze_birthday_counter.quest >= birthday[i].counter) {
                    const achive_check = await prisma.achievement.findFirst({ where: { uid: birthday[i].uid, id_user: id_user } })
                    if (!achive_check) {
                        const achive_add = await prisma.achievement.create({ data: { uid: birthday[i].uid, name: `📅 ${birthday[i].name} - ${birthday[i].subname[randomInt(0, 3)]}`, id_user: id_user } })
                        if (achive_add) {
                            const xp = randomInt(1, 15)
                            await prisma.user.update({ where: { id: id_user }, data: { xp: { increment: xp } } })
                            await vk.api.messages.send({
                                peer_id: To_Vk_Id(user.idvk),
                                random_id: 0,
                                message: `🌟 Получено достижение:\n${achive_add.name}`
                            })
                            await vk.api.messages.send({
                                peer_id: chat_id,
                                random_id: 0,
                                message: `🌟 @id${user.idvk}(${user.name}) выполняет достижение:\n${achive_add.name} и получает на счет ${xp}🧙.`
                            })
                        }
                    }
                }
            }
        }
    }
}

export async function Analyzer_Convert_MO_Counter(context: any) {
    const user: any = await prisma.user.findFirst({ where: { idvk: context.peerId } })
    const id_user = user.id
    await Analyzer_Init(id_user)
    const analyzer: Analyzer | null = await prisma.analyzer.findFirst({ where: { id_user: id_user } })
    const birthday: Achivied[] = [
        { uid: 76, name: "Новичок в конвертации", subname: ["Малоопытный", "Опытный", "Профессионал"], description: "Конвертируйте свой первый магический опыт в галеоны. Достигните указанного количества галеонов, чтобы получить достижение.", counter: 1 },
        { uid: 77, name: "Магический обменник", subname: ["Надежный обменник", "Опытный обменник", "Профессиональный обменник"], description: "Конвертируйте свой магический опыт в галеоны на регулярной основе. Достигните указанного количества конвертаций, чтобы получить достижение.", counter: 5 },
        { uid: 78, name: "Магический экономист", subname: ["Начальный уровень", "Базовый уровень", "Продвинутый уровень"], description: "Увеличивайте свой доход в игре, конвертируя больше магического опыта в галеоны. Достигните указанного количества галеонов, чтобы получить достижение.", counter: 10 },
        { uid: 79, name: "Магический магнат", subname: ["Начинающий магнат", "Опытный магнат", "Профессиональный магнат"], description: "Станьте богатым и влиятельным в игре, конвертируя огромные объемы магического опыта в галеоны. Достигните указанного объема накоплений, чтобы получить достижение.", counter: 15 },
        { uid: 80, name: "Магический миллионер", subname: ["Начинающий миллионер", "Опытный миллионер", "Профессиональный миллионер"], description: "Заработайте миллионы галеонов, конвертируя магический опыт в галеоны. Достигните указанного объема накоплений, чтобы получить достижение.", counter: 20 },
        { uid: 81, name: "Магический магнат-инвестор", subname: ["Начинающий магнат-инвестор", "Опытный магнат-инвестор", "Профессиональный магнат-инвестор"], description: "Инвестируйте свои галеоны и получайте еще больше магического опыта для конвертации. Достигните указанного объема вложений, чтобы получить достижение.", counter: 25 },
        { uid: 82, name: "Магический банкир", subname: ["Начинающий банкир", "Опытный банкир", "Профессиональный банкир"], description: "Управляйте своими финансами в игре как профессионал, конвертируя магический опыт и инвестируя свои галеоны. Достигните указанного уровня мастерства, чтобы получить достижение.", counter: 30 },
        { uid: 83, name: "Магический магнат-бизнесмен", subname: ["Начинающий магнат-бизнесмен", "Опытный магнат-бизнесмен", "Профессиональный магнат-бизнесмен"], description: "Откройте свой собственный бизнес в игре и зарабатывайте миллионы галеонов, конвертируя магический опыт в галеоны. Достигните указанного уровня бизнес-мастерства, чтобы получить достижение.", counter: 50 },
        { uid: 84, name: "Магический магнат-магистр", subname: ["Начинающий магнат-магистр", "Опытный магнат-магистр", "Профессиональный магнат-магистр"], description: "Станьте магистром в конвертации магического опыта в галеоны, заработайте огромное количество галеонов и получите уникальные награды. Достигните указанного уровня мастерства, чтобы получить достижение.", counter: 60 },
        { uid: 85, name: "Магический магнат-император", subname: ["Начинающий магнат-император", "Опытный магнат-император", "Профессиональный магнат-император"], description: "Станьте императором в конвертации магического опыта в галеоны, заработайте невероятные богатства и получите самые редкие и ценные награды. Достигните указанного уровня мастерства, чтобы получить достижение.", counter: 70 },
        { uid: 86, name: "Магический магистр-волшебник", subname: ["Начинающий магистр-волшебник", "Опытный магистр-волшебник", "Профессиональный магистр-волшебник"], description: "Станьте магистром в конвертации магического опыта в галеоны и волшебства, достигнув высокого уровня мастерства. Достигните указанного уровня мастерства, чтобы получить достижение.", counter: 80 },
        { uid: 87, name: "Магический магистр-алхимик", subname: ["Начинающий магистр-алхимик", "Опытный магистр-алхимик", "Профессиональный магистр-алхимик"], description: "Станьте магистром в алхимии и конвертации магического опыта в галеоны, достигнув высокого уровня мастерства. Достигните указанного уровня мастерства, чтобы получить достижение.", counter: 90 },
        { uid: 88, name: "Магический магистр-чародей", subname: ["Начинающий магистр-чародей", "Опытный магистр-чародей", "Профессиональный магистр-чародей"], description: "Станьте магистром в чародействе и конвертации магического опыта в галеоны, достигнув высокого уровня мастерства. Достигните указанного уровня мастерства, чтобы получить достижение.", counter: 100 },
        { uid: 89, name: "Магический властелин", subname: ["Начинающий властелин", "Опытный властелин", "Профессиональный властелин"], description: "Станьте властелином в конвертации магического опыта в галеоны, достигнув высшего уровня мастерства. Достигните указанного уровня мастерства, чтобы получить достижение.", counter: 120 },
        { uid: 90, name: "Магический богатырь", subname: ["Начинающий богатырь", "Опытный богатырь", "Профессиональный богатырь"], description: "Станьте легендарным в конвертации магического опыта в галеоны, достигнув невероятного уровня мастерства. Достигните указанного уровня мастерства, чтобы получить достижение.", counter: 150 }
    ]
    if (analyzer) {
        const analyze_birthday_counter: Analyzer | null = await prisma.analyzer.update({ where: { id: analyzer.id }, data: { convert_mo: { increment: 1 } } })
        if (analyze_birthday_counter) { 
            console.log(`Analyzer module detected convert MO for user UID ${id_user}`)
            for (const i in birthday) {
                if (analyze_birthday_counter.convert_mo >= birthday[i].counter) {
                    const achive_check = await prisma.achievement.findFirst({ where: { uid: birthday[i].uid, id_user: id_user } })
                    if (!achive_check) {
                        const achive_add = await prisma.achievement.create({ data: { uid: birthday[i].uid, name: `✨ ${birthday[i].name} - ${birthday[i].subname[randomInt(0, 3)]}`, id_user: id_user } })
                        if (achive_add) {
                            const xp = randomInt(1, 15)
                            await prisma.user.update({ where: { id: id_user }, data: { xp: { increment: xp } } })
                            await vk.api.messages.send({
                                peer_id: To_Vk_Id(user.idvk),
                                random_id: 0,
                                message: `🌟 Получено достижение:\n${achive_add.name}`
                            })
                            await vk.api.messages.send({
                                peer_id: chat_id,
                                random_id: 0,
                                message: `🌟 @id${user.idvk}(${user.name}) выполняет достижение:\n${achive_add.name} и получает на счет ${xp}🧙.`
                            })
                        }
                    }
                }
            }
        }
    }
}

/*
export async function Analyzer_THERE_Counter(context: any) {
    const user: any = await prisma.user.findFirst({ where: { idvk: context.peerId } })
    const id_user = user.id
    await Analyzer_Init(id_user)
    const analyzer: Analyzer | null = await prisma.analyzer.findFirst({ where: { id_user: id_user } })
    const birthday: Achivied[] = [
        { uid: 0, name: "", subname: [], description: "", counter: 0 }, 
        { uid: 0, name: "", subname: [], description: "", counter: 0 },
        { uid: 0, name: "", subname: [], description: "", counter: 0 },
        { uid: 0, name: "", subname: [], description: "", counter: 0 },
        { uid: 0, name: "", subname: [], description: "", counter: 0 },
        { uid: 0, name: "", subname: [], description: "", counter: 0 },
        { uid: 0, name: "", subname: [], description: "", counter: 0 },
        { uid: 0, name: "", subname: [], description: "", counter: 0 },
        { uid: 0, name: "", subname: [], description: "", counter: 0 },
        { uid: 0, name: "", subname: [], description: "", counter: 0 },
        { uid: 0, name: "", subname: [], description: "", counter: 0 },
        { uid: 0, name: "", subname: [], description: "", counter: 0 },
        { uid: 0, name: "", subname: [], description: "", counter: 0 },
        { uid: 0, name: "", subname: [], description: "", counter: 0 },
        { uid: 0, name: "", subname: [], description: "", counter: 0 },
    ]
    if (analyzer) {
        const analyze_birthday_counter: Analyzer | null = await prisma.analyzer.update({ where: { id: analyzer.id }, data: { THERE: { increment: 1 } } })
        if (analyze_birthday_counter) { 
            console.log(`Analyzer module detected beer bambuke premium for user UID ${id_user}`)
            for (const i in birthday) {
                if (analyze_birthday_counter.THERE >= birthday[i].counter) {
                    const achive_check = await prisma.achievement.findFirst({ where: { uid: birthday[i].uid, id_user: id_user } })
                    if (!achive_check) {
                        const achive_add = await prisma.achievement.create({ data: { uid: birthday[i].uid, name: `THERE ${birthday[i].name} - ${birthday[i].subname[randomInt(0, 3)]}`, id_user: id_user } })
                        if (achive_add) {
                            const xp = randomInt(1, 15)
                            await prisma.user.update({ where: { id: id_user }, data: { xp: { increment: xp } } })
                            await vk.api.messages.send({
                                peer_id: To_Vk_Id(user.idvk),
                                random_id: 0,
                                message: `🌟 Получено достижение:\n${achive_add.name}`
                            })
                            await vk.api.messages.send({
                                peer_id: chat_id,
                                random_id: 0,
                                message: `🌟 @id${user.idvk}(${user.name}) выполняет достижение:\n${achive_add.name} и получает на счет ${xp}🧙.`
                            })
                        }
                    }
                }
            }
        }
    }
}
*/
