import { supabase } from "@/lib/supabase";

export const getUserData = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
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
            .select("*")
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
