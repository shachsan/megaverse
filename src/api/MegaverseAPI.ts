import pLimit from 'p-limit';
import { axiosWithRetry } from '../utils/requests.js';

const BASE_URL = 'https://challenge.crossmint.io/api';
const limit = pLimit(1); // adjust based on rate limit of megaverse service API'

export class MegaverseAPI {
  constructor(private candidateId: string) { }

  private async createPolyanet(row: number, column: number): Promise<void> {
    try {
      await axiosWithRetry({
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

  private async deletePolyanet(row: number, column: number): Promise<void> {
    try {
      await axiosWithRetry({
        url: `${BASE_URL}/polyanets`,
        method: 'DELETE',
        data: {
          row,
          column,
          candidateId: this.candidateId
        }
      })
      console.log(`Polyanet deleted at (${row}, ${column})`);
    } catch (error: any) {
      console.log(
        `Failed to delete Polyanet at (${row}, ${column}): ${error.response?.data || error.message
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

  async deleteOneOrMorePolyanets(row?: number, column?: number): Promise<void> {
    const size = 11;
    const promises = [];
    if (row && column) {
      this.deletePolyanet(row, column);
      return;
    } else {
      return;
    }

    for (let row = 2; row < size - 2; row++) {
      for (let column = 2; column < size - 2; column++) {
        if (row === column || size - 1 - row === column) {
          promises.push(limit(() => this.deletePolyanet(row, column)));
        }
      }
    }

    await Promise.all(promises);
  }
}
