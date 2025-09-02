import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";

/**
 * Logs out the current Firebase user
 */
export const logout = async (): Promise<void> => {
    try {
        await signOut(auth);
        console.log("User logged out successfully ✅");
    } catch (error) {
        console.error("Logout failed ❌", error);
        throw error;
    }
};
