import { supabase } from "@/lib/supabase";

export const getUserData = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from("profiles")
            .select("id, username, full_name, bio, image, created_at")
            .eq("id", userId)
            .single();

        if (error) {
            console.error("Error fetching user data:", error);
            return { success: false, msg: error.message };
        }

        return { success: true, data };
    } catch (error) {
        console.error("Exception in getUserData:", error);
        return { success: false, msg: "Exception fetching user data" };
    }
};

export const searchUsers = async (query: string, currentUserId?: string) => {
    try {
        if (!query.trim()) return { success: true, data: [] };

        let dbQuery = supabase
            .from("profiles")
            .select("id, username, image")
            .ilike("username", `%${query}%`)
            .limit(20);

        if (currentUserId) {
            dbQuery = dbQuery.neq("id", currentUserId);
        }

        const { data, error } = await dbQuery;

        if (error) {
            console.error("Error searching users:", error);
            return { success: false, msg: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error) {
        console.error("Exception in searchUsers:", error);
        return { success: false, msg: "Exception searching users" };
    }
};

import { profileUpdateSchema, ProfileUpdateInput } from "@/lib/validations";

export const updateUserProfile = async (updates: ProfileUpdateInput) => {
    try {
        // Validate inputs
        const validated = profileUpdateSchema.safeParse(updates);
        if (!validated.success) {
            return {
                success: false,
                msg: validated.error.issues[0].message
            };
        }

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, msg: "Session not found. Please log in again." };
        }

        const { data, error } = await supabase
            .from("profiles")
            .update(updates)
            .eq("id", user.id)
            .select()
            .single();

        if (error) {
            console.error("Error updating profile:", error);
            return { success: false, msg: error.message };
        }

        return { success: true, data };
    } catch (error) {
        console.error("Exception in updateUserProfile:", error);
        return { success: false, msg: "Exception updating profile" };
    }
};
