interface Navigator {
    connection?: NetworkInformation;
  }
  
  interface NetworkInformation extends EventTarget {
    downlink: number;
    effectiveType: string;
    rtt: number;
    saveData: boolean;
    type: string;
    onchange: ((this: NetworkInformation, ev: Event) => any) | null;
  }