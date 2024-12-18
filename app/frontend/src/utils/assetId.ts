import { getMintedAssetId } from "fuels";
import { usdsContractAddress } from "../../../lib";

export const usdsAssetId = getMintedAssetId(usdsContractAddress, "0x0000000000000000000000000000000000000000000000000000000000000000");
