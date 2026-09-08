import { Response } from "express";

export function sendBadRequest(res: Response, message: string) {
    return res.status(400).json({ message });
}

export function sendNotFound(res: Response, message: string) {
    return res.status(404).json({ message });
}

export function sendUnauthorized(res: Response, message: string) {
    return res.status(401).json({ message });
}

export function sendForbidden(res: Response, message: string) {
    return res.status(403).json({ message });
}

export function sendInternalServerError(res: Response, message: string) {
    return res.status(500).json({ message });
}

export function sendSuccessResponse(res: Response, message: string, data?: any) {
    return res.status(200).json({ message, data });
}

export function sendCreatedResponse(res: Response, message: string, data?: any) {
    return res.status(201).json({ message, data });
}