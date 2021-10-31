import { GData } from "alclient";
import { Socket } from "socket.io-client";
export declare function startServer(port: number, g: GData): void;
export declare function addSocket(tabName: string, characterSocket: Socket): void;
