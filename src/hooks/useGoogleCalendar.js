import { useState, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

export const useGoogleCalendar = () => {
    const [accessToken, setAccessToken] = useState(null);
    const [isAuthorized, setIsAuthorized] = useState(false);

    const login = useGoogleLogin({
        onSuccess: (codeResponse) => {
            setAccessToken(codeResponse.access_token);
            setIsAuthorized(true);
        },
        scope: 'https://www.googleapis.com/auth/calendar',
        onError: (error) => console.log('Login Failed:', error)
    });

    const listEvents = useCallback(async (timeMin, timeMax) => {
        if (!accessToken) return [];

        try {
            const query = new URLSearchParams({
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                singleEvents: 'true',
                orderBy: 'startTime'
            });

            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${query}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch events');

            const data = await response.json();
            return data.items || [];
        } catch (error) {
            console.error(error);
            return [];
        }
    }, [accessToken]);

    const createEvent = useCallback(async (event) => {
        if (!accessToken) return null;

        try {
            const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            });

            if (!response.ok) throw new Error('Failed to create event');
            return await response.json();
        } catch (error) {
            console.error(error);
            return null;
        }
    }, [accessToken]);

    return {
        login,
        isAuthorized,
        listEvents,
        createEvent
    };
};
