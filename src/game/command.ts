export interface Command<T = void> {
  id: string; // コマンドの一意な識別子
  label: string;
  action: (arg?: T) => void;
}
