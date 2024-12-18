import { createConfig } from 'fuels';
import dotenv from 'dotenv';
import { providerUrl } from './lib';

dotenv.config({
	path: ['.env.local', '.env'],
});

// If your node is running on a port other than 4000, you can set it here
const fuelCorePort = +(process.env.VITE_FUEL_NODE_PORT as string) || 4000;

export default createConfig({
	workspace: '../contracts', // Path to your Sway workspace
	output: './scripts/types', // Where your generated types will be saved
	fuelCorePort,
	providerUrl,
});
