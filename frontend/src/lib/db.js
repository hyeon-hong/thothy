import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

export async function saveUserAgent(userId, agentId) {
    const { data, error } = await supabase
        .from('staffs')
        .upsert({
            user_id: userId,
            agent_id: agentId
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving user agent:', error);
        throw error;
    }

    return data;
}

export async function getUserAgents(userId) {
    const { data, error } = await supabase
        .from('staffs')
        .select(`
            *,
            agents:agent_id (*)
        `)
        .eq('user_id', userId);

    if (error) {
        console.error('Error getting user agents:', error);
        throw error;
    }

    return data.map(ua => ({
        ...ua,
        agent: ua.agents
    }));
}

export async function removeUserAgent(userId, agentId) {
    const { error } = await supabase
        .from('staffs')
        .delete()
        .match({
            user_id: userId,
            agent_id: agentId
        });

    if (error) {
        console.error('Error removing user agent:', error);
        throw error;
    }
}

export async function createOrUpdateUser(userData) {
    const { data, error } = await supabase
        .from('users')
        .upsert({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            picture: userData.picture
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating/updating user:', error);
        throw error;
    }

    return data;
} 