import axios from 'axios';
import pLimit from 'p-limit';

const BASE_URL = 'https://challenge.crossmint.io/api';
const candidateId = 'bf58bc2a-6e06-4339-bb66-81f30e6ba461';
const limit = pLimit(6); // adjust based on rate limit of megaverse service API'

class MegaverseAPI {
  constructor(private candidateId: string) {}

  async createPolyanet(row: number, column: number): Promise<void> {
    try {
      await axios.post(`${BASE_URL}/polyanets`, {
        row,
        column,
        candidateId: this.candidateId,
      });
      console.log(`Polyanet created at (${row}, ${column})`);
    } catch (error: any) {
      console.log(
        `Failed to create Polyanet at (${row}, ${column}): ${
          error.response?.data || error.message
        }`
      );
    }
  }

  async createXShape(): Promise<void> {
    const size = 11;
    const promises = [];

    for (let row = 2; row < size; row++) {
      for (let column = 2; column < size; column++) {
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
