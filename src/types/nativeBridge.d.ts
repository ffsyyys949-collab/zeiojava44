export interface ZeNativeBridgeInterface {
  requestNotificationPermission?: () => void;
  connectVpn?: (serverCode: string, serverIp: string, port: number, killSwitch: boolean) => void;
  disconnectVpn?: () => void;
  openApp?: (packageName: string) => boolean;
  setUserSession?: (userId: string, userName: string, serverOrigin: string) => void;
  showChatNotification?: (chatId: string, senderName: string, messageText: string, senderPhoto: string) => void;
  updateMusicNotification?: (
    title: string,
    artist: string,
    coverUrl: string,
    audioUrl: string,
    isPlaying: boolean
  ) => void;
  stopMusicNotification?: () => void;
}

declare global {
  interface Window {
    ZeNative?: ZeNativeBridgeInterface;
    __zeOpenChatById?: (chatId: string) => void;
    __zeMusicControl?: (action: 'play' | 'pause' | 'toggle' | 'next' | 'prev' | 'stop') => void;
  }
}
