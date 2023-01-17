import { PrismaClient } from "@prisma/client"
import { randomInt } from "crypto"
import { Attachment, Keyboard, KeyboardBuilder } from "vk-io"
import { answerTimeLimit, chat_id, root, vk } from "../.."
import { Image_Interface, Image_Random } from "./imagecpu"
import { readFileSync, promises as fsPromises } from 'fs'

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
    const data = await Book_Random_String('./src/book/title.txt')
    context.send(`📜 ${data}`, {
        keyboard: new KeyboardBuilder().callbackButton({
            label: '🔔 Дзинь',
            payload: {
                command: 'buy',
                item: 'coffee'
            }
        }).inline()
    })
    if (user_check.idvk == root && user_check.id_role === 2) {
        await context.send(`${messa}`,
            {
                keyboard: Keyboard.builder()
                .textButton({ label: 'карта', payload: { command: 'grif' }, color: 'secondary' })
                .textButton({ label: 'инвентарь', payload: { command: 'sliz' }, color: 'secondary' }).row()
                .textButton({ label: 'артефакты', payload: { command: 'coga' }, color: 'secondary' })
                .textButton({ label: 'админы', payload: { command: 'coga' }, color: 'secondary' }).row()
                .textButton({ label: 'Косой переулок', payload: { command: 'sliz' }, color: 'positive' })
                .textButton({ label: 'Услуги', payload: { command: 'sliz' }, color: 'primary' }).row()
                .textButton({ label: 'операции', payload: { command: 'sliz' }, color: 'negative' })
                .textButton({ label: 'права', payload: { command: 'sliz' }, color: 'negative' }).oneTime()
            }
        )
    }else if (user_check.id_role === 2) {
        await context.send(`${messa}`,
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
        await context.send(`${messa}`,
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
        const user_list: any = await prisma.user.findMany({ where: { private: false} })
        const location_list: any = {
            "Хогвартс": [ "Большой Зал", "Астрономическая Башня", "Гремучая Ива", "Часовая Башня", "Кухня", "Туалет Плаксы Миртл", "Кухня", "Зал Наказаний", "Внутренний Двор", "Запретный лес", "Правый коридор | Пятый этаж", "Деревянный мост", "Совятня", "Выручай-комната", "Комната Пивза", "Чердак", "Больничное крыло", "Вестибюль", "Опушка леса", "Библиотека Хогвартса", "Чёрное Озеро", "Лестничные пролёты", "Каменный Круг", "Кабинет Зельеварения", "Подземелья Хогвартса", "Прачечная", "Зал Славы", "Учебный Зал", "Теплицы", "Тайная Комната", "Кладбище", "Лодочный сарай", "Кабинет школьного психолога", "Коридор Одноглазой Ведьмы", "Комната 234-00", "Учительская", "Хижина Хагрида", "Коридоры", "Учительская"],
            "Бристон": [ 'Стрип-клуб "MurMur angels-club"', "Филиал Некромантии и Бесоизгнания", "Суд", "ЗаМУРчательное кафе", "Парк", "Больница", "Мракоборческий участок", "Заповедник", "Торговый центр", "Лавка зелий и артефактов", 'Бар "У Пьюси и Винтер"', "Магическая аптека", "Бухта Ингернах", "Филиал Гильдии Артефакторов", 'Отель "Меллоу Брук"', "Закрытая пиццерия", "Волшебный зверинец",],
            "Пиво из Хогсмида": [ 'Паб "Три метлы"', 'Трактир "Кабанья голова"']
        }
        const location_name : any = ["Хогвартс", "Бристон"]
        const selector = randomInt(0, location_name.length)
        const tara = randomInt(0, location_list[location_name[selector]].length)
        const rana = randomInt(0, user_list.length)
        const rana2 = randomInt(0, user_list.length)
        const reward: number = randomInt(5,50)
        const reward2: number = randomInt(1,5)
        const task_list: any = { "Большой зал": ["Попытаться украсть несколько свечек с потолка", "Оккупировать стол другого Факультета", "Подкинуть в тарелку с чужкой едой горстку соли", "Придумать план по захвату мира", "Придумать новый праздник и отметить его", "Создать семью яблок и банана" ],
                            "Астрономическая Башня": ["Спеть песню «И камнем вниз...»", "Скинуть водные бомбочки с башни", "Подумать, почему солнце назвали солнцем", "Поиграть в догони меня кирпич", "Проверить перила на прочность" ],
                            "Гремучая Ива": [ "Познакомиться с ветвями дерева", "Утроить бой с деревом", "Повесить конфеты на дерево", "Устроить показ мод", "Согреть иву с помощью шарфов" ],
                            "Часовая Башня": [ "Посчитать количество ударов часов за полдня", "Сочинить стихотворение", "Изучить механизм часов", "Зарисовать механизм часов", "Найти часового монстра" ],
                            "Кухня": ["Приготовить шарлотку", "Помочь эльфам", "Перемыть всю посуду", "Придумать новое оригинальное блюдо", "Составить мен для профессоров на день" ],
                            "Туалет Плаксы Миртл": [ "Познакомиться с местным призраком", "Выплакаться мисс Миртл", "Погадать на картах таро на свою судьбу", "Поиграть в карты с Миртл", "Узнать о судьбе призрака" ],
                            "Зал наказаний": [ "Испробовать на себе орудия пыток", "Найти местных духов", "Поговорить с холодной стеной", "Засунуть арбуз в гильотину" ],
                            "Внутренний двор": [ "Посчитать камни на тропинке", "Обнять каждого встречного", "Искупаться в Дом", "Выловить на фонтана все монетки", "Устроить день отдыха и позагорать" ],
                            "Запретный лес": [ "Проследить за незнакомцем", "Встретить заход солнца", "Устроить охоту на зайцев", "Нарисовать пейзаж вечернего леса", "Найти отличное место для колдографий" ],
                            "Правый коридор | Пятый этаж": [ "Нарисовать на полу портрет профессора Макгонагалд", "Поиграть в классики", "Покривляться и построить смешные рожицы" ],
                            "Деревянный мост": [ "Спрыгнуть с моста в воду", "Посидеть на перилах", "Поиграть в шашки", "Проверить мост на прочность", "Скатиться с моста на скейте" ],
                            "Совятня": [ "Написать письмо домой", "Покормить птиц", "Убрать помет", "Устроить тусу птицам", "Сшить совам одежду" ],
                            "Выручай-комната": [ "Устроить вечер сказок", "Построить дом из одеял и кресел", "Устроить бой подушками" ],
                            "Комната Пивза": [ "Прибраться в комнате", "Позаимствовать несколько книг у сэра Пивза", "Покормить хомяков сэра Пивза" ],
                            "Чердак": [ "Сделать генеральную уборку", "Найти старинные украшения", "Прорепетировать ответ на уроке зельеварения" ],
                            "Больничное крыло": [ "Перевязать порезанную руку", "Оставить для больных сладости", "Навестить мадам Помфри", "Нарисовать себе синяк под глазом" ],
                            "Вестибюль": [ "Поцеловать стену", "Прокатиться на роликах", "Станцевать лезгинку", "Сделать себе боевой раскрас" ],
                            "Опушка леса": [ "Устроить пикник с лесными духами", "Поиграть в мяч", "Съесть траву", "Поймать бабочек" ],
                            "Библиотека Хогвартса": [ "Принести мадам Пинс в подарок коробку конфет", "Заклеить порванные книги" , "Положить в одну из книг небольшой подарочек", "Оставить в одной из книг записку" ],
                            "Чёрное Озеро": [ "Пустить в дальнее плавание мягкую игрушку", "Запустить бумажные кораблики", "Поиграть в блинчики", "Поплескаться в воде", "Покрасоваться своими новыми плавками/купальником" ],
                            "Лестничные пролёты": [ "Споткнуться о ступеньку и разбить коленку", "Поговорить с картинами", "Прокатиться на лестницах по всему замку" ],
                            "Каменный Круг": [ "Сосчитать все камни в кругу", "Придумать легенду о каменном человеке", "Развести костер, чтобы согреться " ],
                            "Кабинет Зельеварения": [ "Оставить профессору Снейпу тетрадь с его карикатурой", "Взорвать котел", "Поменять банки с игридиентами местами" ],
                            "Подземелья Хогвартса": [ "Оставить послание змейкам", "Измазать пол искусственной кровью", "Посадить плюшевую игрушку на потухший факел" ],
                            "Прачечная": [ "Закинуть в стирку чужие белые вещи с розовыми носками", "Затопить замок", "Разлить амортенцию на пол", "Порвать чью-то только что стиранную футболку", "Нарисовать на всей одежде черным маркером лицо профессора Макгонагалл" ],
                            "Зал Славы": [ "Незаметно украсть один из кубков", "Поставить свою шуточную грамоту к остальным ", "Налить в кубок сок и распивать, поднимая тосты " ],
                            "Учебный Зал": [ "Выкинуть книгу в окно", "Поджечь шторы", "Удивить всех присутствующих в зале своими жонглёрскими способностями" ],
                            "Теплицы": [ "Спародировать мандрагору", "Посадить монетку в землю", "Закопать кусок пиццы в горшок", "Станцевать на столе танго" ],
                            "Тайная Комната": [ "Попрыгать по лужам", "Найти чьи-то кости", "Вообразить себя супергероем", "Вооружиться вилкой и пойти в бой с самим собой " ],
                            "Кладбище": [ "Проверить могилы ", "Выкопать маленькую могилку для своей психики", "Написать на входе в кладбище «тут был я»", "Вызвать конфетного гномика" ],
                            "Лодочный сарай": [ "Устроить гонки на лодках без воды", "Покрасить лодку в красный цвет", "Вырезать в лодке дно", "Перекрыть вход в сарай" ],
                            "Кабинет школьного психолога": [ "Оставить психологу под дверью открытку", "Сломать дверь в кабинет психолога ", "Зайти в кабинет психолога в одном халате", "Выпить весь чай" ],
                            "Коридор Одноглазой Ведьмы": [ "Найти потайной проход в Хогсмид", "Оставить коробку со значками с пятой точкой кота", "Украсть один из факелов и спрятать его" ],
                            "Комната 234-00": [ "Забрать трусы Филча, пока его нет", "Подменить миссис Норис", "Подложить Филчу под матрас горошину", "Кинуть на стол под мусор кусок мяса" ],
                            "Учительская": [ "Принести профессорам завтрак в кабинет", "Украсть работы по заклинаниям", "Случайно пролить кофе на работы третьего курса" ],
                            "Хижина Хагрида": [ "Сходить на чай к профессору Хагриду ", "Подарить профессору животное", "Пригласить профессора Хагрида на прогулку во внутренний двор" ],
                            "Коридоры": [ "Примерить на себе доспехи", "Пройтись по стене", "Расставить по всем коридорам зеркала", "Побегать босиком" ],
                            //Бристон
                            'Стрип-клуб "MurMur angels-club"': [ "Подача резюме на работу", "Подделка документов", "Кража конфеток с ресепшена" ],
                            "Филиал Некромантии и Бесоизгнания": [ "Воскрешение умершей бабочки", "Изгнание бесов из кошки", "Знакомство с возможным будущим местом работы" ],
                            "Суд": [ "Знакомство с возможным будущим местом работы ", "Суд над совой, которая съела последний бутерброд", "Суд над будильником, что не дал поспать" ],
                            "ЗаМУРчательное кафе": [ "Кошачья терапия", "Проверка заболевшего домашнего питомца", "Разложиться на стойке для заказов" ],
                            "Парк": [ "Устроить свадьбу для двух голубей", "Посрывать листья с деревьев и собрать из них букет", "Забрать лавочку и перетаскивать её за собой по всему парку" ],
                            "Больница": [ "Украсть вкусняшки с ресепшена", "Похищение анализов", "Шпионство в окна больницы за работниками", "Кража кресла с ресепшена" ],
                            "Мракоборческий участок": [ "Кража ключей от решёток", "Выбить окно в участке", "Вынес всех важных документов " ],
                            "Заповедник": [ "Кража редких животных", "Перелезть через забор к домику лесника", "Спилить несколько деревьев" ],
                            "Торговый центр": [ "Примерка новых луков", "Закупка продуктами", "Отдых в СПА", "Занятие в бассейне " ],
                            "Лавка зелий и артефактов": [ "Покупка зелья", "Консультация по поводу артефакта", "Разговор по душам с владельцем лавки" ],
                            'Бар "У Пьюси и Винтер"': [ "Отдых с коктельчиком", "Потратить минимум 10 галлеонов в баре", "Полакомиться стейком из Грифона" ],
                            "Магическая аптека": [ "Покупка лекарств от мигрени", "Покупка лекарств от болей в животе", "Покупка аскорбинок", "Покупка гемотогенок" ],
                            "Бухта Ингернах": [ "Продажа рыбы", "Покупка удочки", "Покупка круга для купания " ],
                            "Филиал Гильдии Артефакторов": [ "Консультация по поводу артефактов", "Знакомство с возможным местом работы", "Выпрашивание какого-нибудь артефакта" ],
                            'Отель "Меллоу Брук"': [ "Розыгрыш администратора", "Наслаждение свежим воздухом на террасе", "Обед в ресторане" ],
                            "Закрытая пиццерия": [ "Расспрос Джеффа о его матери", "Подкаты к присматривающему за заведением", "Просьба переночевать в пиццерии " ],
                            "Волшебный зверинец": [ "Покупка нового животного", "Заглянуть посмотреть на животных", "Выбор домашнего питомца" ],
                            //Паб
                            'Паб "Три метлы"': [ "Развести мадам Розмерту на свиное жаркое", "Напиться от горя сливочным пивом ", "Угостить незнакомца медовухой" ],
                            'Трактир "Кабанья голова"': [ "Оставить свой след на вывеске", "Выпить бокальчик смородинового Рома", "Залезть под стол и громко кукарекать" ]
        }
        const task = task_list[location_list[location_name[selector]][tara]][randomInt(0,task_list[location_list[location_name[selector]][tara]].length)] || "Задача отсутствует"
        await vk.api.messages.send({
            peer_id: chat_id,
            random_id: 0,
            message: `⌛ Обнаружен отрол: \n 👤@id${user_list[rana2].idvk}(${user_list[rana2].name}) \n 👥@id${user_list[rana].idvk}(${user_list[rana].name})  \n \n 🌐 ${location_name[selector]} \n 👣 ${location_list[location_name[selector]][tara]} \n ⚡ ${task} \n ✅ ${reward*2 + reward2*5} ПК+ \n🏆 ${reward2}💰 ${reward}🧙`
        })
        try {
            await vk.api.messages.send({
                user_id: user_list[rana2].idvk,
                random_id: 0,
                message: `⌛ Загружается новое событие...`
            })
            await vk.api.messages.send({
                user_id: user_list[rana2].idvk,
                random_id: 0,
                message: `👥 Как насчет поролить с 👤@id${user_list[rana].idvk}(${user_list[rana].name}): \n \n 🌐 ${location_name[selector]} \n 👣 ${location_list[location_name[selector]][tara]} \n ⚡ ${task} \n ✅ ${reward*2 + reward2*5} ПК+ \n🏆 ${reward2}💰 ${reward}🧙`
            })
        } catch (error) {
            console.log(`User ${user_list[rana].idvk} blocked chating with bank!`)
        }
        try {
            await vk.api.messages.send({
                user_id: user_list[rana].idvk,
                random_id: 0,
                message: `⌛ Загружается новое событие...`
            })
            await vk.api.messages.send({
                user_id: user_list[rana].idvk,
                random_id: 0,
                message: `👥 Как насчет поролить с 👤@id${user_list[rana2].idvk}(${user_list[rana2].name}): \n \n 🌐 ${location_name[selector]} \n 👣 ${location_list[location_name[selector]][tara]} \n ⚡ ${task} \n ✅ ${reward*2 + reward2*5} ПК+ \n🏆 ${reward2}💰 ${reward}🧙`
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
