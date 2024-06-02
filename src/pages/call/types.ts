import { CallMember } from "@/lib/call/types";

export enum LayoutType {
  Main,
  Grid,
}

export interface Member extends CallMember {
  name: string;
  avatar?: string;
}
