import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

const DEFAULT_MAX_RETRY_COUNT = 3;
const INITIAL_DELAY = 1000;

interface AxiosConfig extends AxiosRequestConfig {
    maxRetryCount?: number;
    initialDelay?: number;
}
export const axiosWithRetry = (config: AxiosConfig) => {
    let retryAttempt = 0;
    const attemptRequest = async (): Promise<AxiosResponse> => {
        try {
            return await axios(config);
        } catch (error: any) {
            const { maxRetryCount = DEFAULT_MAX_RETRY_COUNT, initialDelay = INITIAL_DELAY } = config;
            // console.log('axios error', error.toJSON ? error.toJSON() : error)
            // Determine if we should retry
            const shouldRetry = retryAttempt < maxRetryCount &&
                (error.response?.status === 429 || /* TODO do not retry for 404, 400, 500 etc */
                    error.code === 'ECONNRESET' ||
                    error.message.includes('socket hang up'));
            if (shouldRetry) {
                retryAttempt++;
                const backoffDelay = initialDelay * Math.pow(2, retryAttempt) + Math.random() * 100;
                console.log(`Retry attempt ${retryAttempt}; waiting for ${backoffDelay}ms before retrying...`);
                await new Promise(resolve => setTimeout(resolve, backoffDelay)); // pause until backoffDelay
                return attemptRequest();
            } else {
                throw error;
            }
        }
    }

    return attemptRequest();
}