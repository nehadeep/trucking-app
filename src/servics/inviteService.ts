// src/services/inviteService.ts
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebaseConfig";

const functions = getFunctions(app);

export const sendInvite = async (
    email: string,
    companyName: string,
    inviteLink: string,
    customMessage: string
) => {
    const sendInviteEmail = httpsCallable(functions, "sendInviteEmail");
    const result: any = await sendInviteEmail({
        email,
        companyName,
        inviteLink,
        customMessage,
    });

    if (result.data.success) {
        return true;
    } else {
        throw new Error(result.data.error);
    }
};
