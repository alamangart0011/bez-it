import { useEffect, useRef } from 'react';
import { playUiSound } from '../brand/audio.js';

export function useRoomSounds(roomId, participants = [], inVoice = false) {
  const prevRoomId = useRef(roomId);
  const prevCount = useRef(participants.length);
  const prevInVoice = useRef(inVoice);

  useEffect(() => {
    if (prevRoomId.current && prevRoomId.current !== roomId && roomId) {
      playUiSound('room-enter');
    }
    prevRoomId.current = roomId;
  }, [roomId]);

  useEffect(() => {
    if (!prevInVoice.current && inVoice) {
      playUiSound('voice-join');
    }
    prevInVoice.current = inVoice;
  }, [inVoice]);

  useEffect(() => {
    if (participants.length > prevCount.current) {
      playUiSound('member-join');
    }
    prevCount.current = participants.length;
  }, [participants.length]);
}
