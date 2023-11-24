export enum MessageType {
  Done,
  Progress,
}

export interface Message {
  type: MessageType;
  data: any;
}
