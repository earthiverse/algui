import { GData } from "alclient";
import { Socket } from "socket.io-client";
import { MapData } from "../definitions/server";
export declare function startServer(port: number, g: GData): void;
export declare function addSocket(tabName: string, characterSocket: Socket, initialPosition?: MapData): void;
