  export interface PlayerData {
    coc: any;
    cr: any;
    lol: any;
  }
  export  interface LobbyPlayer {
    id: string;
    displayName: string;
    data: PlayerData;
  }