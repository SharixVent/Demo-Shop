import PocketBase from "pocketbase";

const pbUrl = import.meta.env.VITE_POCKETBASE_URL;
export const pb = new PocketBase(pbUrl);
pb.autoCancellation(false);