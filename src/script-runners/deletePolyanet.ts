import { MegaverseAPI } from "../api/MegaverseAPI.js";
import * as dotenv from "dotenv";
import minimist from 'minimist';

dotenv.config();

const args = minimist(process.argv.slice(2));
const { row, column } = args;
console.log('args', args)
console.log('row', row)
console.log('column', column)

const candidateId = process.env.CANDIDATE_ID || '';

const megaverse = new MegaverseAPI(candidateId);
megaverse.deleteOneOrMorePolyanets(row, column).then(() => console.log('Polyanet(s) deletion successfull'));
