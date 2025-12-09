'use server';

import {auth} from "@/lib/better-auth/auth";
import {inngest} from "@/lib/inngest/client";
import {headers} from "next/headers";

// List of trusted email providers
const TRUSTED_EMAIL_PROVIDERS = [
    'gmail.com',
    'yahoo.com',
    'outlook.com',
    'hotmail.com',
    'icloud.com',
    'protonmail.com',
    'aol.com',
    'zoho.com',
    'mail.com',
    'live.com',
    'msn.com',
];

function isValidEmailProvider(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;

    return TRUSTED_EMAIL_PROVIDERS.includes(domain);
}

export const signUpWithEmail = async ({
                                          email,
                                          password,
                                          fullName,
                                          country,
                                          investmentGoals,
                                          riskTolerance,
                                          preferredIndustry
                                      }: SignUpFormData) => {
    try {
        // Validate email format
        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        if (!emailRegex.test(email)) {
            return {
                success: false,
                error: 'Please enter a valid email address'
            };
        }

        // Validate email provider
        if (!isValidEmailProvider(email)) {
            return {
                success: false,
                error: 'Please use a valid email provider (Gmail, Yahoo, Outlook, etc.)'
            };
        }

        // Validate password strength
        if (password.length < 8) {
            return {
                success: false,
                error: 'Password must be at least 8 characters'
            };
        }

        const response = await auth.api.signUpEmail({
            body: {email, password, name: fullName},
        })

        if (response) {
            await inngest.send({
                name: 'app/user.created',
                data: {
                    email,
                    name: fullName,
                    country,
                    investmentGoals,
                    riskTolerance,
                    preferredIndustry
                }
            })
        }
        return {success: true, data: response};
    } catch (e) {
        console.log('Sign Up Failed', e);
        return {success: false, error: 'Sign Up Failed'};
    }
}

export const signInWithEmail = async ({
                                          email,
                                          password,
                                      }: SignInFormData) => {
    try {
        const response = await auth.api.signInEmail({
            body: {email, password},
        })
        return {success: true, data: response};
    } catch (e: any) {
        console.log('Sign In Failed', e);
        const status = e?.status ?? e?.statusCode;
        const message: string | undefined =
            e?.message || e?.body?.message;

        // Wrong email or password
        if (status === 401 || status === 'UNAUTHORIZED') {
            return {
                success: false,
                error:
                    "Account not found or incorrect password. Please sign up if you don't have an account.",
            };
        }

        return {success: false, error: message || 'Sign In Failed'};
    }
}

export const signOut = async () => {
    try {
        await auth.api.signOut({headers: await headers()});
    } catch (e) {
        console.log('Sign Out Failed', e);
        return {success: false, error: 'Sign Out Failed'};
    }
}