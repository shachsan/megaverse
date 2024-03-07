import { MegaverseAPI } from "../api/MegaverseAPI.js";
import * as dotenv from "dotenv";

dotenv.config();

const candidateId = process.env.CANDIDATE_ID || '';

const megaverse = new MegaverseAPI(candidateId);
megaverse.createXShape().then(() => console.log('X-shape of Polyanet created'));;