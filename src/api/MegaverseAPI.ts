import pLimit from 'p-limit';
import { axiosWithRetry } from '../utils/requests.js';
import { capitalized } from '../utils/formats.js';
import axios from 'axios';

const BASE_URL = 'https://challenge.crossmint.io/api';
const limit = pLimit(1); // adjust based on rate limit of megaverse service API'

type Color = 'blue' | 'red' | 'purple' | 'white';

type Direction = 'up' | 'down' | 'left' | 'right';

type EntityDetail = {
  row: number;
  column: number;
  color?: Color;
  direction?: Direction;
}

type EntityUrlMap = Record<string, string>

const urlMap: EntityUrlMap = {
  polyanet: `${BASE_URL}/polyanets`,
  soloon: `${BASE_URL}/soloons`,
  cometh: `${BASE_URL}/comeths`
}

export class MegaverseAPI {
  constructor(private candidateId: string) { }

  private async createEntity(entityType: string, entityDetail: EntityDetail): Promise<void> {
    const { row, column, color, direction } = entityDetail;
    try {
      await axiosWithRetry({
        url: urlMap[entityType],
        method: 'POST',
        data: {
          row,
          column,
          candidateId: this.candidateId,
          ...(color && { color }),
          ...(direction && { direction })
        }
      })
      console.log(`${capitalized(entityType)} created at (${row}, ${column})`)
    } catch (error: any) {
      console.log(`Failed to create ${capitalized(entityType)} at (${row}, ${column})`);
    }
  }

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

  async buildMegaverse(): Promise<void> {
    // fetch goal map
    const response = await axios.get(`${BASE_URL}/map/${this.candidateId}/goal`);
    const goalMap = response.data?.goal;

    const promises: any[] = [];

    // iterate over the goal map and create entities based on the specification
    goalMap.forEach((row: Array<string>, rowIndex: number) => {
      row.forEach(async (cell, columnIndex: number) => {
        if (cell === 'SPACE') return; // Skip empty spaces

        const entityDetails = {
          row: rowIndex,
          column: columnIndex,
        };

        if (cell.includes('POLYANET')) {
          promises.push(limit(() => this.createEntity('polyanet', entityDetails)));
        } else if (cell.includes('SOLOON')) {
          const color = cell.split('_')[0].toLowerCase() as Color; // Extract color from format like "RED_SOLOON"
          promises.push(limit(() => this.createEntity('soloon', { ...entityDetails, color })));
        } else if (cell.includes('COMETH')) {
          const direction = cell.split('_')[0].toLowerCase() as Direction; // Extract direction from format like "LEFT_COMETH"
          promises.push(limit(() => this.createEntity('cometh', { ...entityDetails, direction })));
        }
      });
    });

    await Promise.all(promises);
  }
}
