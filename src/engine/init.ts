import { PrismaClient } from "@prisma/client";
import { HearManager } from "@vk-io/hear";
import { randomInt } from "crypto";
import { Keyboard, KeyboardBuilder } from "vk-io";
import { IQuestionMessageContext } from "vk-io-question";

const prisma = new PrismaClient()

export function InitGameRoutes(hearManager: HearManager<IQuestionMessageContext>): void {
	/*hearManager.hear(/init/, async (context) => {
		//user
		const user_type = await prisma.userType.createMany({
			data: [
				{
					name: 'student',
					description: 'ученик Хогвартса',
					label: 'студент'
				},
				{
					name: 'professor',
					description: 'профессор Хогвартса',
					label: 'Профессор'
				}
			],
			skipDuplicates: true
		})
		user_type ? console.log('Success init UserType on server') : console.log('Fail init UserType on server')
	
		const facult = await prisma.facult.createMany({
			data: [
				{
					name: 'hufflepuff',
					description: 'Пуфендуй, факультет Трудолюбивых, верных, честных учеников.',
					label: 'Пуффендуй'
				},
				{
					name: 'ravenclaw',
					description: 'Когтевран, факультет умных, мудрых, остроумных, творческих, с чувством юмора учеников.',
					label: 'Когтевран'
				},
				{
					name: 'slytherin',
					description: 'Слизерин, факультет хитрых, решительных, амбициозных, находчивых, жаждущих власти учеников.',
					label: 'Слизерин'
				},
				{
					name: 'gryffindor',
					description: 'Гриффиндор, факультет храбрых, благородных, ученкиов чести',
					label: 'Гриффиндор'
				}
			],
			skipDuplicates: true
		})
		console.log((facult ? "Success" : "Fail") + " init Facults")

		context.send('Игра инициализированна успешно.')
	})*/
}