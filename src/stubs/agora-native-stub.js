const React = require('react');

function NoopSurfaceView() {
  return null;
}

module.exports = {
  createAgoraRtcEngine: () => ({
    initialize: () => 0,
    enableAudio: () => 0,
    enableVideo: () => 0,
    setEnableSpeakerphone: () => 0,
    muteLocalAudioStream: () => 0,
    muteLocalVideoStream: () => 0,
    registerEventHandler: () => 0,
    unregisterEventHandler: () => 0,
    joinChannel: () => 0,
    leaveChannel: () => 0,
    release: () => 0,
    switchCamera: () => 0,
  }),
  RtcSurfaceView: NoopSurfaceView,
  RenderModeType: {
    RenderModeHidden: 1,
  },
};
