function resolveAudioConstraints(deviceId = '') {
  const supported = navigator.mediaDevices?.getSupportedConstraints?.() || {};
  const audio = {
    deviceId: deviceId || undefined,
    echoCancellation: supported.echoCancellation ? true : undefined,
    noiseSuppression: supported.noiseSuppression ? true : undefined,
    autoGainControl: supported.autoGainControl ? true : undefined,
    channelCount: supported.channelCount ? 1 : undefined
  };
  return Object.fromEntries(Object.entries(audio).filter(([, value]) => value !== undefined));
}

function createRemoteStream(existing, event) {
  const stream = existing || new MediaStream();
  for (const track of event.streams?.[0]?.getTracks?.() || []) {
    if (!stream.getTracks().some((item) => item.id === track.id)) stream.addTrack(track);
  }
  if (!event.streams?.length && event.track && !stream.getTracks().some((item) => item.id === event.track.id)) {
    stream.addTrack(event.track);
  }
  return stream;
}

export class PeerMeshController {
  constructor({ socket, roomId, currentUserId, rtcConfig, onRemoteStream, onPeerEvent, onLog, onLocalScreenStream, onLocalAudioStream }) {
    this.socket = socket;
    this.roomId = roomId;
    this.currentUserId = currentUserId;
    this.rtcConfig = rtcConfig || { iceServers: [] };
    this.onRemoteStream = onRemoteStream || (() => {});
    this.onPeerEvent = onPeerEvent || (() => {});
    this.onLog = onLog || (() => {});
    this.onLocalScreenStream = onLocalScreenStream || (() => {});
    this.onLocalAudioStream = onLocalAudioStream || (() => {});
    this.peers = new Map();
    this.remoteStreams = new Map();
    this.localAudioStream = null;
    this.localScreenStream = null;
    this.boundHandlers = [];
    this.joined = false;
  }

  log(message) {
    this.onLog(message);
  }

  attachSocket(event, handler) {
    this.boundHandlers.push([event, handler]);
    this.socket.on(event, handler);
  }

  async join() {
    if (this.joined) return;
    this.joined = true;

    this.attachSocket('room:peer-joined', ({ roomId, userId }) => {
      if (roomId !== this.roomId || !userId || userId === this.currentUserId) return;
      this.ensurePeer(userId);
      this.onPeerEvent(userId, { joined: true });
      this.log(`peer-joined:${userId}`);
    });

    this.attachSocket('room:peer-left', ({ roomId, userId }) => {
      if (roomId !== this.roomId || !userId || userId === this.currentUserId) return;
      this.closePeer(userId);
      this.onPeerEvent(userId, { joined: false, screenActive: false, muted: true });
      this.log(`peer-left:${userId}`);
    });

    this.attachSocket('rtc:signal', async (payload) => {
      if (payload.roomId !== this.roomId || payload.fromUserId === this.currentUserId) return;
      await this.handleSignal(payload.fromUserId, payload);
    });

    this.attachSocket('rtc:screen-state', ({ roomId, userId, active }) => {
      if (roomId !== this.roomId || userId === this.currentUserId) return;
      this.onPeerEvent(userId, { screenActive: Boolean(active) });
    });

    this.attachSocket('rtc:voice-state', ({ roomId, userId, muted }) => {
      if (roomId !== this.roomId || userId === this.currentUserId) return;
      this.onPeerEvent(userId, { muted: Boolean(muted) });
    });

    const peers = await new Promise((resolve) => {
      this.socket.emit('room:join', { roomId: this.roomId }, (ack) => resolve(ack?.peers || []));
    });

    for (const peer of peers) {
      if (!peer?.userId || peer.userId === this.currentUserId) continue;
      await this.makeOffer(peer.userId);
    }
  }

  async startAudio(deviceId = '') {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: resolveAudioConstraints(deviceId), video: false });
    if (this.localAudioStream) {
      this.localAudioStream.getTracks().forEach((track) => track.stop());
    }
    this.localAudioStream = stream;
    this.onLocalAudioStream(stream);
    for (const remoteUserId of this.peers.keys()) {
      await this.syncTracks(remoteUserId);
    }
    this.socket.emit('rtc:voice-state', { roomId: this.roomId, muted: false });
    this.log('audio:start');
    return stream;
  }

  async stopAudio() {
    if (this.localAudioStream) {
      this.localAudioStream.getTracks().forEach((track) => track.stop());
      this.localAudioStream = null;
    }
    this.onLocalAudioStream(null);
    for (const remoteUserId of this.peers.keys()) {
      await this.syncTracks(remoteUserId);
    }
    this.socket.emit('rtc:voice-state', { roomId: this.roomId, muted: true });
    this.log('audio:stop');
  }

  async startScreen({ width = 1920, height = 1080, frameRate = 30 } = {}) {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: { ideal: frameRate, max: 60 } },
      audio: false
    });
    const [videoTrack] = stream.getVideoTracks();
    if (videoTrack?.applyConstraints) {
      await videoTrack.applyConstraints({ width: { ideal: width }, height: { ideal: height }, frameRate: { ideal: frameRate, max: 60 } }).catch(() => undefined);
    }
    videoTrack.onended = () => {
      this.stopScreen().catch(() => undefined);
    };
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach((track) => track.stop());
    }
    this.localScreenStream = stream;
    this.onLocalScreenStream(stream);
    for (const remoteUserId of this.peers.keys()) {
      await this.syncTracks(remoteUserId);
    }
    this.socket.emit('rtc:screen-state', { roomId: this.roomId, active: true });
    this.log(`screen:start:${width}x${height}@${frameRate}`);
    return stream;
  }

  async stopScreen() {
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach((track) => track.stop());
      this.localScreenStream = null;
    }
    this.onLocalScreenStream(null);
    for (const remoteUserId of this.peers.keys()) {
      await this.syncTracks(remoteUserId);
    }
    this.socket.emit('rtc:screen-state', { roomId: this.roomId, active: false });
    this.log('screen:stop');
  }

  ensurePeer(remoteUserId) {
    if (this.peers.has(remoteUserId)) return this.peers.get(remoteUserId);

    const pc = new RTCPeerConnection({ iceServers: this.rtcConfig.iceServers || [] });
    const state = {
      remoteUserId,
      polite: String(this.currentUserId).localeCompare(String(remoteUserId)) > 0,
      makingOffer: false,
      ignoreOffer: false,
      isSettingRemoteAnswerPending: false,
      pc
    };

    pc.onicecandidate = ({ candidate }) => {
      if (!candidate) return;
      this.socket.emit('rtc:signal', {
        roomId: this.roomId,
        toUserId: remoteUserId,
        candidate,
        media: 'mesh'
      });
    };

    pc.ontrack = (event) => {
      const current = this.remoteStreams.get(remoteUserId);
      const stream = createRemoteStream(current, event);
      this.remoteStreams.set(remoteUserId, stream);
      this.onRemoteStream(remoteUserId, stream);
    };

    pc.onconnectionstatechange = () => {
      if (['failed', 'closed'].includes(pc.connectionState)) {
        this.closePeer(remoteUserId);
      }
    };

    pc.onnegotiationneeded = async () => {
      try {
        state.makingOffer = true;
        await this.syncTracks(remoteUserId);
        await pc.setLocalDescription();
        this.socket.emit('rtc:signal', {
          roomId: this.roomId,
          toUserId: remoteUserId,
          description: pc.localDescription,
          media: 'mesh'
        });
      } catch {
        this.log(`negotiation:error:${remoteUserId}`);
      } finally {
        state.makingOffer = false;
      }
    };

    this.peers.set(remoteUserId, state);
    return state;
  }

  async syncTracks(remoteUserId) {
    const state = this.ensurePeer(remoteUserId);
    const pc = state.pc;

    const localAudioTrack = this.localAudioStream?.getAudioTracks?.()[0] || null;
    const localScreenTrack = this.localScreenStream?.getVideoTracks?.()[0] || null;

    await this.syncSender(pc, 'audio', localAudioTrack, this.localAudioStream);
    await this.syncSender(pc, 'video', localScreenTrack, this.localScreenStream);
  }

  async syncSender(pc, kind, track, stream) {
    const sender = pc.getSenders().find((item) => item.track?.kind === kind || (!item.track && item.__corpchatKind === kind));
    if (track) {
      if (sender) {
        sender.__corpchatKind = kind;
        await sender.replaceTrack(track);
      } else {
        const created = pc.addTrack(track, stream);
        created.__corpchatKind = kind;
      }
      return;
    }

    if (sender) {
      sender.__corpchatKind = kind;
      await sender.replaceTrack(null).catch(() => undefined);
    }
  }

  async makeOffer(remoteUserId) {
    const state = this.ensurePeer(remoteUserId);
    await this.syncTracks(remoteUserId);
    if (state.pc.signalingState === 'stable') {
      try {
        state.makingOffer = true;
        await state.pc.setLocalDescription();
        this.socket.emit('rtc:signal', {
          roomId: this.roomId,
          toUserId: remoteUserId,
          description: state.pc.localDescription,
          media: 'mesh'
        });
      } finally {
        state.makingOffer = false;
      }
    }
  }

  async handleSignal(remoteUserId, { description, candidate }) {
    const state = this.ensurePeer(remoteUserId);
    const pc = state.pc;

    try {
      if (description) {
        const readyForOffer = !state.makingOffer && (pc.signalingState === 'stable' || state.isSettingRemoteAnswerPending);
        const offerCollision = description.type === 'offer' && !readyForOffer;
        state.ignoreOffer = !state.polite && offerCollision;
        if (state.ignoreOffer) return;

        state.isSettingRemoteAnswerPending = description.type === 'answer';
        await pc.setRemoteDescription(description);
        state.isSettingRemoteAnswerPending = false;

        if (description.type === 'offer') {
          await this.syncTracks(remoteUserId);
          await pc.setLocalDescription();
          this.socket.emit('rtc:signal', {
            roomId: this.roomId,
            toUserId: remoteUserId,
            description: pc.localDescription,
            media: 'mesh'
          });
        }
      } else if (candidate) {
        try {
          await pc.addIceCandidate(candidate);
        } catch (error) {
          if (!state.ignoreOffer) throw error;
        }
      }
    } catch {
      this.log(`signal:error:${remoteUserId}`);
    }
  }

  closePeer(remoteUserId) {
    const state = this.peers.get(remoteUserId);
    if (!state) return;
    state.pc.ontrack = null;
    state.pc.onicecandidate = null;
    state.pc.onnegotiationneeded = null;
    state.pc.close();
    this.peers.delete(remoteUserId);
    this.remoteStreams.delete(remoteUserId);
  }

  destroy() {
    for (const [event, handler] of this.boundHandlers) {
      this.socket.off(event, handler);
    }
    this.boundHandlers = [];
    for (const remoteUserId of Array.from(this.peers.keys())) {
      this.closePeer(remoteUserId);
    }
    if (this.joined) {
      this.socket.emit('room:leave', { roomId: this.roomId });
      this.joined = false;
    }
    if (this.localAudioStream) {
      this.localAudioStream.getTracks().forEach((track) => track.stop());
      this.localAudioStream = null;
      this.onLocalAudioStream(null);
    }
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach((track) => track.stop());
      this.localScreenStream = null;
      this.onLocalScreenStream(null);
    }
  }
}
