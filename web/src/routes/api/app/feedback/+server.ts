import { appProxy } from '$lib/server/app-api'

// A member's feedback from the store app, with the app's recent log for the tech team (see PHP's cgpayFeedback).
export const POST = appProxy('feedback', ['token', 'message', 'log', 'version', 'platform'], true)
