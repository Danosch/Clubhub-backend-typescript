/**
 * Describes an application error returned by the API.
 */
export interface ErrorPayload {
    errorCode: string;
    title: string;
    details: string;
    messageParameters: Record<string, string>;
    sourcePointer: string | null;
}