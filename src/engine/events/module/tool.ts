import { vk } from "../../..";

export async function User_Info(context: any) {
    let [userData]= await vk.api.users.get({user_id: context.senderId});
    return userData
}