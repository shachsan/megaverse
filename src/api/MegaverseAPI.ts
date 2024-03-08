import pLimit from 'p-limit';
import { axiosWithRetry } from '../utils/requests.js';
import { capitalized } from '../utils/formats.js';
import axios from 'axios';

const BASE_URL = 'https://challenge.crossmint.io/api';
const limit = pLimit(1); // adjust based on rate limit of megaverse service API'

type Color = 'blue' | 'red' | 'purple' | 'white';

type Direction = 'up' | 'down' | 'left' | 'right';

export enum EntityName {
  polyanet = 'polyanet',
  soloon = 'soloon',
  cometh = 'cometh'
}

type EntityDetail = {
  row: number;
  column: number;
  color?: Color;
  direction?: Direction;
}

type EntityAttributesFromGoalMapCell = {
  entityName?: EntityName;
  color?: Color;
  direction?: Direction;
}

type EntityUrlMap = Record<EntityName, string>

const urlMap: EntityUrlMap = {
  polyanet: `${BASE_URL}/polyanets`,
  soloon: `${BASE_URL}/soloons`,
  cometh: `${BASE_URL}/comeths`
}

export class MegaverseAPI {
  constructor(private candidateId: string) { }

  private async createEntity(entityType: EntityName, entityDetail: EntityDetail): Promise<void> {
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
      }, { entityType })
      console.log(`${capitalized(entityType)} created at (${row}, ${column})`)
    } catch (error: any) {
      console.log(`Failed to create ${capitalized(entityType)} at (${row}, ${column}); error is non-retryable or maximum retry is reached`, error);
      throw error;
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
          promises.push(limit(() => this.createEntity(EntityName.polyanet, { row, column })));
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

  private getEntityDetails(cell: string): EntityAttributesFromGoalMapCell {
    if (cell.includes('POLYANET')) {
      return { entityName: EntityName.polyanet }
    } else if (cell.includes('SOLOON')) {
      const color = cell.split('_')[0].toLowerCase() as Color; // Extract color from Soloon format "RED_SOLOON"
      return { entityName: EntityName.soloon, color }
    } else if (cell.includes('COMETH')) {
      const direction = cell.split('_')[0].toLowerCase() as Direction; // Extract direction from Cometh format "LEFT_COMETH"
      return { entityName: EntityName.cometh, direction }
    }
    return {};
  }

  async buildMegaverse(): Promise<void> {
    try {
      // fetch goal map
      const response = await axios.get(`${BASE_URL}/map/${this.candidateId}/goal`);
      const goalMap = response.data?.goal;

      const promises: Promise<void>[] = [];

      // iterate over the goal map and create entities based on each map's cell
      goalMap.forEach((row: Array<string>, rowIndex: number) => {
        row.forEach(async (cell, columnIndex: number) => {
          const { entityName, color, direction } = this.getEntityDetails(cell);
          if (!entityName) return; // skip empty spaces

          promises.push(limit(() => this.createEntity(entityName, { row: rowIndex, column: columnIndex, color, direction })));
        });
      });

      await Promise.all(promises);
    } catch (error: any) {
      throw error;
    }
  }
}
