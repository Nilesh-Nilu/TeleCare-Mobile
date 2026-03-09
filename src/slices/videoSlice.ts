import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CallType, IncomingCall } from '../types';

interface VideoState {
  roomId: string | null;
  token: string | null;
  appId: string | null;
  uid: number;
  callType: CallType;
  isConnecting: boolean;
  isConnected: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeakerOn: boolean;
  callDuration: number;
  networkQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  remoteUids: string[];
  isChatOpen: boolean;
  chatMessages: Array<{ id: string; senderId: string; message: string; timestamp: string }>;
  incomingCall: IncomingCall | null;
}

const initialState: VideoState = {
  roomId: null, token: null, appId: null, uid: 0,
  callType: 'VOICE',
  isConnecting: false, isConnected: false, isMuted: false,
  isVideoOff: false, isSpeakerOn: true, callDuration: 0,
  networkQuality: 'unknown', remoteUids: [], isChatOpen: false, chatMessages: [],
  incomingCall: null,
};

const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    setRoom(state, action: PayloadAction<{ roomId: string; token: string; appId: string; uid: number; callType?: CallType }>) {
      state.roomId = action.payload.roomId;
      state.token = action.payload.token;
      state.appId = action.payload.appId;
      state.uid = action.payload.uid;
      if (action.payload.callType) state.callType = action.payload.callType;
    },
    setCallType(state, action: PayloadAction<CallType>) { state.callType = action.payload; },
    setConnecting(state, action: PayloadAction<boolean>) { state.isConnecting = action.payload; },
    setConnected(state, action: PayloadAction<boolean>) { state.isConnected = action.payload; state.isConnecting = false; },
    toggleMute(state) { state.isMuted = !state.isMuted; },
    toggleVideo(state) { state.isVideoOff = !state.isVideoOff; },
    toggleSpeaker(state) { state.isSpeakerOn = !state.isSpeakerOn; },
    setCallDuration(state, action: PayloadAction<number>) { state.callDuration = action.payload; },
    setNetworkQuality(state, action: PayloadAction<VideoState['networkQuality']>) { state.networkQuality = action.payload; },
    addRemoteUid(state, action: PayloadAction<string>) {
      if (!state.remoteUids.includes(action.payload)) state.remoteUids.push(action.payload);
    },
    removeRemoteUid(state, action: PayloadAction<string>) { state.remoteUids = state.remoteUids.filter((uid) => uid !== action.payload); },
    toggleChat(state) { state.isChatOpen = !state.isChatOpen; },
    addChatMessage(state, action: PayloadAction<VideoState['chatMessages'][0]>) { state.chatMessages.push(action.payload); },
    setIncomingCall(state, action: PayloadAction<IncomingCall | null>) { state.incomingCall = action.payload; },
    resetVideo() { return initialState; },
  },
});

export const {
  setRoom, setCallType, setConnecting, setConnected, toggleMute, toggleVideo,
  toggleSpeaker, setCallDuration, setNetworkQuality, addRemoteUid,
  removeRemoteUid, toggleChat, addChatMessage, setIncomingCall, resetVideo,
} = videoSlice.actions;
export default videoSlice.reducer;
