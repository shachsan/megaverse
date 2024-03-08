import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { EntityName } from "../api/MegaverseAPI.js";

const DEFAULT_MAX_RETRY_COUNT = 3;
const INITIAL_DELAY = 1000;

interface RetryConfig {
    entityType?: EntityName;
    maxRetryCount?: number;
    initialDelay?: number;
}
export const axiosWithRetry = (config: AxiosRequestConfig, retryConfig?: RetryConfig) => {
    let retryAttempt = 0;
    const attemptRequest = async (): Promise<AxiosResponse> => {
        try {
            return await axios(config);
        } catch (error: any) {
            const status = error.response?.status || error.status;
            const { maxRetryCount = DEFAULT_MAX_RETRY_COUNT, initialDelay = INITIAL_DELAY, entityType = '' } = retryConfig || {};
            const { row, column } = config.data;
            // console.log('axiosError', error.toJSON())

            // Determine if we should retry
            const statusToSkipRetry = [400, 401, 403, 404, 501, 505];
            const isRetryableStatusCode = !statusToSkipRetry.includes(status);
            const shouldRetry = retryAttempt < maxRetryCount && isRetryableStatusCode;
            if (shouldRetry) {
                retryAttempt++;
                const backoffDelay = Math.ceil(initialDelay * Math.pow(2, retryAttempt) + Math.random() * 100);
                console.log(`Failed creation of entity: ${entityType} at (${row}, ${column}); Retry attempt ${retryAttempt}; waiting for ${backoffDelay}ms before retrying...`);
                await new Promise(resolve => setTimeout(resolve, backoffDelay)); // pause until backoffDelay
                return attemptRequest();
            } else {
                throw error;
            }
        }
    }

    return attemptRequest();
}