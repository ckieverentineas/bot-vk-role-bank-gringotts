import { VK, Keyboard } from 'vk-io';
import { HearManager } from '@vk-io/hear';
import {
    QuestionManager
} from 'vk-io-question';
import { registerUserRoutes } from './engine/player'
import { InitGameRoutes } from './engine/init';
import { Keyboard_Index, Logger, Patch_Question_Context, Question_Is_Back, Question_Is_Cancel, Worker_Checker } from './engine/core/helper';
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import prisma from './engine/events/module/prisma_client';
import { Exit, Main_Menu_Init } from './engine/events/contoller';
import { Admin_Enter, Artefact_Enter, Birthday_Enter, Card_Enter, Card_Private, Inventory_Enter, Rank_Enter, Statistics_Enter, Storage_Enter} from './engine/events/module/info';
import { Operation_Enter, Right_Enter } from './engine/events/module/tool';
import { Service_Beer_Open, Service_Beer_Premium_Open, Service_Cancel, Service_Convert_Galleon, Service_Convert_Galleon_Change, Service_Convert_Magic_Experience, Service_Convert_Magic_Experience_Change, Service_Enter, Service_Level_Up, Service_Level_Up_Change, Service_Quest_Open, Service_Underwear_Open } from './engine/events/module/service';
import { Shop_Bought, Shop_Buy, Shop_Cancel, Shop_Category_Enter, Shop_Enter, Shop_Enter_Multi } from './engine/events/module/shop/engine';
import { Start_Worker_API_Bot } from './api';
dotenv.config()

export const token: string = String(process.env.token)
export const root: number = Number(process.env.root) //root user
export const chat_id: number = Number(process.env.chat_id) //chat for logs
export let group_id: number = Number(process.env.group_id) || 0 //clear chat group
export const timer_text = { answerTimeLimit: 600_000 } // ожидать десять минут
export const timer_text_oper = { answerTimeLimit: 600_000 } // ожидать десять минут
export const answerTimeLimit = 600_000 // ожидать десять минут
export const starting_date = new Date(); // время работы бота
//авторизация
export let vk = new VK({ token: token, pollingGroupId: group_id || undefined, apiLimit: 20 });

async function Group_Id_Get(): Promise<number> {
	const envGroupId = group_id

	try {
		const detector = new VK({ token: token, apiLimit: 1 });
		const response = await detector.api.groups.getById({});
		const detectedGroupId = Number(response.groups?.[0]?.id)
		if (Number.isSafeInteger(detectedGroupId) && detectedGroupId > 0) {
			if (Number.isSafeInteger(envGroupId) && envGroupId > 0 && envGroupId !== detectedGroupId) {
				console.warn(`group_id from .env (${envGroupId}) differs from token group id (${detectedGroupId}); using token group id.`)
			}
			return detectedGroupId
		}
	} catch (error) {
		console.log(`Group id autodetect failed: ${error}`)
	}

	if (Number.isSafeInteger(envGroupId) && envGroupId > 0) {
		return envGroupId
	}

	throw new Error('Cannot resolve VK group id. Set group_id in .env or check token permissions.')
}

async function Bootstrap() {
	group_id = await Group_Id_Get()
	vk = new VK({ token: token, pollingGroupId: group_id, apiLimit: 20 });
	//инициализация
	const questionManager = new QuestionManager();
	const hearManager = new HearManager<any>();

/*prisma.$use(async (params, next) => {
	console.log('This is middleware!')
	// Modify or interrogate params here
	console.log(params)
	return next(params)
})*/

//настройка
vk.updates.use(questionManager.middleware);
vk.updates.use(async (context: any, next: any) => {
	Patch_Question_Context(context)
	return await next()
});
vk.updates.on('message_new', hearManager.middleware);

//регистрация роутов из других классов
InitGameRoutes(hearManager)
registerUserRoutes(hearManager)

//миддлевар для предварительной обработки сообщений
vk.updates.on('message_new', async (context: any, next: any) => {
	if (context.peerType === 'chat' && context.peerId !== context.senderId) {
		try { 
			await vk.api.messages.delete({'peer_id': context.peerId, 'delete_for_all': 1, 'cmids': context.conversationMessageId, 'group_id': group_id})
			console.log(`User ${context.senderId} sent message and deleted`)
			//await vk.api.messages.send({ peer_id: chat_id, random_id: 0, message: `✅🚫 @id${context.senderId} ${context.text}`})  
		} catch (error) { 
			console.log(`User ${context.senderId} sent message and can't deleted`)
			//await vk.api.messages.send({ peer_id: chat_id, random_id: 0, message: `⛔🚫 @id${context.senderId} ${context.text}`}) 
		}  
		return
	}
	//проверяем есть ли пользователь в базах данных
	const user_check = await prisma.user.findFirst({ where: { idvk: context.senderId } })
	//если пользователя нет, то начинаем регистрацию
	if (!user_check) {
		const registrationState = {
			consent: null as any,
			visit: null as any,
			name: null as string | null,
			class: null as string | null,
			spec: null as string | null
		}
		let step: 'consent' | 'visit' | 'name' | 'class' | 'spec' = 'consent'
		while (true) {
			if (step === 'consent') {
				const answer = await context.question(`⌛ Как только вы открыли дверь банка Гринготтс 🏦, из ниоткуда перед вами предстали два гоблина и надменно сказали: \n\n— Видимо, вы здесь впервые. Прежде чем войти, распишитесь здесь о своем согласии на обработку персональных данных. \n\nВ тот же миг в ваших руках магическим образом появился пергамент. \n\n💡 Предупреждение: любые вопросы в банковской системе ограничены 10 минутами на ваши ответы в процессе обслуживания!`,
					{	
						keyboard: Keyboard.builder()
						.textButton({ label: '✏', payload: { command: 'Согласиться' }, color: 'positive' }).row()
						.textButton({ label: '👣', payload: { command: 'Отказаться' }, color: 'negative' }).oneTime(),
						answerTimeLimit
					}
				);
				if (Question_Is_Cancel(answer)) { return }
				if (Question_Is_Back(answer)) { await context.send(`💡 Это первый шаг регистрации. Откат назад невозможен.`); continue }
				if (answer.isTimeout) { return await context.send(`⏰ Время ожидания подтверждения согласия истекло!`) }
				if (!/да|yes|Согласиться|конечно|✏/i.test(answer.text|| '{}')) {
					await context.send('⌛ Вы отказались дать свое согласие, а живым отсюда никто не уходил, вас упаковали!');
					return;
				}
				registrationState.consent = answer
				step = 'visit'
				continue
			}

			if (step === 'visit') {
				const visit = await context.question(`⌛ Поставив свою подпись, вы, стараясь не смотреть косо на гоблинов, вошли в здание банка, подошли к стойке, где за информационной системой сидела полная гоблинша с бородавкой на носу.`,
					{ 	
						keyboard: Keyboard.builder()
						.textButton({ label: 'Подойти и поздороваться', payload: { command: 'Согласиться' }, color: 'positive' }).row()
						.textButton({ label: 'Ждать, пока она закончит', payload: { command: 'Отказаться' }, color: 'negative' }).oneTime().inline(),
						answerTimeLimit
					}
				);
				if (Question_Is_Cancel(visit)) { return }
				if (Question_Is_Back(visit)) { step = 'consent'; continue }
				if (visit.isTimeout) { return await context.send(`⏰ Время ожидания активности истекло!`) }
				registrationState.visit = visit
				step = 'name'
				continue
			}

			if (step === 'name') {
				const name = await context.question( `🧷 Приветствую в банке Гринготтс🏦! Назовите ваше имя и фамилию. \n\n❗ Внимание! Предоставление заведомо ложных данных преследуются законом!`, timer_text)
				if (Question_Is_Cancel(name)) { return }
				if (Question_Is_Back(name)) { step = 'visit'; continue }
				if (name.isTimeout) { return await context.send(`⏰ Время ожидания ввода имени истекло!`) }
				if (name.text.length <= 64) {
					registrationState.name = `${name.text}`
					if (name.text.length > 32) { await context.send(`⚠ Ваши ФИО не влезают на стандартный бланк 32 символа! Гоблин может использовать бланк повышенной ширины, но нужно доплатить 1G за каждый не поместившийся символ.`) }
					step = 'class'
				} else { await context.send(`⛔ Ваши ФИО не влезают на бланк повышенной ширины 64 символа, и вообще, запрещены магическим законодательством! Выплатите штраф в 30G или мы будем вынуждены позвать стражей порядка для отправки вас в Азкабан.`) }
				continue
			}

			if (step === 'class') {
				const answer1 = await context.question(`🧷 Укажите ваше положение в Хогвартс Онлайн`,
					{	
						keyboard: Keyboard.builder()
						.textButton({ label: 'Ученик', payload: { command: 'student' }, color: 'secondary' })
						.textButton({ label: 'Профессор', payload: { command: 'professor' }, color: 'secondary' })
						.textButton({ label: 'Житель', payload: { command: 'citizen' }, color: 'secondary' })
						.oneTime().inline(), answerTimeLimit
					}
				)
				if (Question_Is_Cancel(answer1)) { return }
				if (Question_Is_Back(answer1)) { step = 'name'; continue }
				if (answer1.isTimeout) { return await context.send(`⏰ Время ожидания выбора положения истекло!`) }
				if (!answer1.payload) {
					await context.send(`💡 Жмите только по кнопкам с иконками!`)
				} else {
					registrationState.class = `${answer1.text}`
					step = 'spec'
				}
				continue
			}

			if (step === 'spec') {
				if (registrationState.class === 'Ученик') {
					const faculty = await context.question(`🧷 Выберите ваш факультет:`,
						{
							keyboard: Keyboard.builder()
							.textButton({ label: 'Гриффиндор', payload: { command: 'gryffindor' }, color: 'secondary' })
							.textButton({ label: 'Когтевран', payload: { command: 'ravenclaw' }, color: 'secondary' }).row()
							.textButton({ label: 'Пуффендуй', payload: { command: 'hufflepuff' }, color: 'secondary' })
							.textButton({ label: 'Слизерин', payload: { command: 'slytherin' }, color: 'secondary' }).row()
							.oneTime().inline(),
							answerTimeLimit
						}
					)
					if (Question_Is_Cancel(faculty)) { return }
					if (Question_Is_Back(faculty)) { step = 'class'; continue }
					if (faculty.isTimeout) { return await context.send(`⏰ Время ожидания выбора факультета истекло!`) }
					if (faculty.payload) {
						const facultyNames: any = {
							'gryffindor': 'Гриффиндор',
							'ravenclaw': 'Когтевран',
							'hufflepuff': 'Пуффендуй',
							'slytherin': 'Слизерин'
						}
						registrationState.spec = facultyNames[faculty.payload.command] || faculty.text
						break
					} else {
						await context.send(`💡 Пожалуйста, выберите факультет с помощью кнопок!`)
					}
				} else {
					const name = await context.question(`🧷 Укажите вашу специализацию в Хогвартс Онлайн. Если вы профессор или житель, введите должность.`, timer_text)
					if (Question_Is_Cancel(name)) { return }
					if (Question_Is_Back(name)) { step = 'class'; continue }
					if (name.isTimeout) { return await context.send(`⏰ Время ожидания выбора специализации истекло!`) }
					if (name.text.length <= 30) {
						registrationState.spec = `${name.text}`
						break
					} else {
						await context.send(`💡 Введите до 30 символов включительно!`)
					}
				}
			}
		}

		const save = await prisma.user.create({
			data: {
				idvk: context.senderId,
				name: String(registrationState.name),
				class: String(registrationState.class),
				spec: String(registrationState.spec),
				id_role: 1,
				gold: 65
			}
		})
		await context.send(`⌛ Благодарю за сотрудничество ${save.class} ${save.name}, ${save.spec}. \n⚖ Вы получили банковскую карту UID: ${save.id}. \n🏦 Вам зачислено ${save.gold} галлеонов`)
		console.log(`Success save user idvk: ${context.senderId}`)
		await context.send(`‼ Список обязательных для покупки вещей: \n1. Волшебная палочка \n2. Сова, кошка или жаба \n3. Комплект учебников на первых порах вам хватит стандартного набора \n \nПосетите Косой переулок и приобретите их первым делом!`)
		const check_bbox = await prisma.blackBox.findFirst({ where: { idvk: context.senderId } })
		const ans_selector = `⁉ ${save.class} @id${save.idvk}(${save.name}) ${save.spec} ${!check_bbox ? "легально" : "НЕЛЕГАЛЬНО"} получает банковскую карту UID: ${save.id}!`
		await vk.api.messages.send({
			peer_id: chat_id,
			random_id: 0,
			message: ans_selector
		})
		await Keyboard_Index(context, `💡 Подсказка: Когда все операции вы успешно завершили, напишите !банк без квадратных скобочек, а затем нажмите кнопку ✅Подтвердить авторизацию!`)
		return await next();
	} else {
		await Keyboard_Index(context, `⌛ Загрузка, пожалуйста, подождите...`)
	}
	return await next();
})
vk.updates.on('message_event', async (context: any, next: any) => { 
	const config: any = {
		"system_call": Main_Menu_Init,
		"card_enter": Card_Enter,
		"card_private": Card_Private,
		"birthday_enter": Birthday_Enter,
		"exit": Exit,
		"artefact_enter": Artefact_Enter,
		"inventory_enter": Inventory_Enter,
		"admin_enter": Admin_Enter,
		"service_enter": Service_Enter,
		"service_cancel": Service_Cancel,
		"service_convert_galleon": Service_Convert_Galleon,
		"service_convert_galleon_change": Service_Convert_Galleon_Change,
		"service_convert_magic_experience": Service_Convert_Magic_Experience,
		"service_convert_magic_experience_change": Service_Convert_Magic_Experience_Change,
		"service_level_up": Service_Level_Up,
		"service_level_up_change": Service_Level_Up_Change,
		"shop_category_enter": Shop_Category_Enter,
		"shop_enter": Shop_Enter,
		"shop_enter_multi": Shop_Enter_Multi,
		"shop_cancel": Shop_Cancel,
		"shop_bought": Shop_Bought,
		"shop_buy": Shop_Buy,
		"operation_enter": Operation_Enter, // заглушки
		"right_enter": Right_Enter, // заглушки
		"service_beer_open": Service_Beer_Open,
		"service_beer_premium_open": Service_Beer_Premium_Open,
		"service_quest_open": Service_Quest_Open,
		"service_underwear_open": Service_Underwear_Open,
		"statistics_enter": Statistics_Enter,
		"rank_enter": Rank_Enter,
		'storage_enter': Storage_Enter
	}
	try {
		await config[context.eventPayload.command](context)
	} catch (e) {
		console.log(`Ошибка события ${e}`)
	}
	return await next();
})

	await vk.updates.start()
	await Logger(`running succes with group_id ${group_id}`)
	await Start_Worker_API_Bot()
	setInterval(Worker_Checker, 86400000);
}

Bootstrap().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
process.on('warning', e => console.warn(e.stack))
