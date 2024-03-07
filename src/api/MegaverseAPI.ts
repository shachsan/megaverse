import pLimit from 'p-limit';
import { axiosWithRetry } from '../utils/requests.js';

const BASE_URL = 'https://challenge.crossmint.io/api';
const candidateId = 'bf58bc2a-6e06-4339-bb66-81f30e6ba461';
const limit = pLimit(1); // adjust based on rate limit of megaverse service API'

class MegaverseAPI {
  constructor(private candidateId: string) { }

  createPolyanet(row: number, column: number): void {
    try {
      axiosWithRetry({
        url: `${BASE_URL}/polyanets`,
        method: 'POST',
        data: {
          row,
          column,
          candidateId: this.candidateId
        }
      })
      console.log(`Polyanet created at (${row}, ${column})`);
    } catch (error: any) {
      console.log(
        `Failed to create Polyanet at (${row}, ${column}): ${error.response?.data || error.message
        }`
      );
    }
  }

  async createXShape(): Promise<void> {
    const size = 11;
    const promises = [];

    for (let row = 2; row < size - 2; row++) {
      for (let column = 2; column < size - 2; column++) {
        if (row === column || size - 1 - row === column) {
          promises.push(limit(() => this.createPolyanet(row, column)));
        }
      }
    }

    await Promise.all(promises);
  }
}

const api = new MegaverseAPI(candidateId);
api.createXShape().then(() => console.log('X-shape of Polyanet created'));
