// src/hooks/useScreenShare.ts

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { socket } from '@/utils/socket';
import { Member } from '@/types/room';

const peerConnections = new Map<string, RTCPeerConnection>();

const pcConfig = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export function useScreenShare(roomId: string, members: Member[]) {
  const [isSharing, setIsSharing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localScreenRef = useRef<MediaStream | null>(null);
  // ✨ 1. Add a ref to queue candidates
  const candidateQueue = useRef(new Map<string, RTCIceCandidateInit[]>());

  const createPeerConnection = useCallback(async (viewerSocketId: string, stream: MediaStream) => {
    try {
      console.log(`Creating peer connection for viewer: ${viewerSocketId}`);
      const pc = new RTCPeerConnection(pcConfig);
      peerConnections.set(viewerSocketId, pc);

pc.oniceconnectionstatechange = () => {
  console.log(`SHARER's ICE Connection State for ${viewerSocketId}: ${pc.iceConnectionState}`);
};
pc.onconnectionstatechange = () => {
  console.log(`SHARER's Connection State for ${viewerSocketId}: ${pc.connectionState}`);
};      

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc-ice-candidate', {
            candidate: event.candidate,
            targetSocketId: viewerSocketId,
          });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log(`Sending offer to ${viewerSocketId}`);
      socket.emit('webrtc-offer', { offer, viewerSocketId: viewerSocketId });
    } catch (error) {
      console.error(`Failed to create peer connection for ${viewerSocketId}`, error);
    }
  }, []);

  const stopSharing = useCallback(() => {
    localScreenRef.current?.getTracks().forEach((track) => track.stop());
    localScreenRef.current = null;
    setLocalStream(null);
    setIsSharing(false);
    socket.emit('stop-screen-share', { roomId });

    peerConnections.forEach((pc) => pc.close());
    peerConnections.clear();
  }, [roomId]);

  const startSharing = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });

      localScreenRef.current = stream;
      setLocalStream(stream);
      setIsSharing(true);
      socket.emit('start-screen-share', { roomId });

      const viewers = members.filter((m) => m.socketId !== socket.id);
      for (const viewer of viewers) {
        createPeerConnection(viewer.socketId, stream);
      }

      stream.getVideoTracks()[0].onended = () => stopSharing();
    } catch (error) {
      console.error('Error starting screen share:', error);
      stopSharing();
    }
  }, [roomId, members, stopSharing, createPeerConnection]);

  useEffect(() => {
    const handleInitiatePeer = ({ newPeerSocketId }: { newPeerSocketId: string }) => {
      console.log(`Sharer received request to initiate peer connection with ${newPeerSocketId}`);
      if (localScreenRef.current) {
        createPeerConnection(newPeerSocketId, localScreenRef.current);
      }
    };

    const handleScreenShareStarted = ({ sharerId }: { sharerId: string }) => {
      console.log(`VIEWER: Received screenShareStarted from ${sharerId}`);
      setIsViewing(true);
    };

    const handleWebRTCOffer = async ({ offer, sharerSocketId }: { offer: RTCSessionDescriptionInit, sharerSocketId: string }) => {
      console.log(`VIEWER: Received webrtc-offer from ${sharerSocketId}`);
      const pc = new RTCPeerConnection(pcConfig);
      peerConnections.set(sharerSocketId, pc);

pc.oniceconnectionstatechange = () => {
  console.log(`VIEWER's ICE Connection State from ${sharerSocketId}: ${pc.iceConnectionState}`);
};
pc.onconnectionstatechange = () => {
  console.log(`VIEWER's Connection State from ${sharerSocketId}: ${pc.connectionState}`);
};

      const remoteStream = new MediaStream();
      pc.ontrack = (event) => {
        console.log('VIEWER: Received track from peer!', event.track);
        remoteStream.addTrack(event.track);
      };
      setScreenStream(remoteStream);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc-ice-candidate', {
            candidate: event.candidate,
            targetSocketId: sharerSocketId,
          });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // ✨ 3. Process any queued candidates now that the connection is ready
      if (candidateQueue.current.has(sharerSocketId)) {
        console.log(`Processing ${candidateQueue.current.get(sharerSocketId)!.length} queued candidates.`);
        for (const candidate of candidateQueue.current.get(sharerSocketId)!) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        candidateQueue.current.delete(sharerSocketId);
      }
      
      console.log(`VIEWER: Sending webrtc-answer to ${sharerSocketId}`);
      socket.emit('webrtc-answer', { answer, sharerSocketId });
    };

    const handleWebRTCAnswer = async ({ answer, viewerSocketId }: { answer: RTCSessionDescriptionInit, viewerSocketId: string }) => {
      console.log(`SHARER: Received webrtc-answer from ${viewerSocketId}`);
      const pc = peerConnections.get(viewerSocketId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleWebRTCIceCandidate = async ({ candidate, sourceSocketId }: { candidate: RTCIceCandidateInit, sourceSocketId: string }) => {
      console.log(`Received ICE candidate from ${sourceSocketId}`);
      const pc = peerConnections.get(sourceSocketId);

      // ✨ 2. If pc doesn't exist yet, queue the candidate. Otherwise, add it.
      if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        console.log('Peer connection not ready. Queuing candidate.');
        if (!candidateQueue.current.has(sourceSocketId)) {
            candidateQueue.current.set(sourceSocketId, []);
        }
        candidateQueue.current.get(sourceSocketId)!.push(candidate);
      }
    };
    
    const handleScreenShareStopped = () => {
      console.log('Received screenShareStopped. Cleaning up.');
      setIsViewing(false);
      setScreenStream(null);
      peerConnections.forEach((pc) => pc.close());
      peerConnections.clear();
      candidateQueue.current.clear(); // Also clear the queue on stop
    };

    socket.on('initiate-webrtc-peer', handleInitiatePeer);
    socket.on('screenShareStarted', handleScreenShareStarted);
    socket.on('webrtc-offer', handleWebRTCOffer);
    socket.on('webrtc-answer', handleWebRTCAnswer);
    socket.on('webrtc-ice-candidate', handleWebRTCIceCandidate);
    socket.on('screenShareStopped', handleScreenShareStopped);

    return () => {
      socket.off('initiate-webrtc-peer', handleInitiatePeer);
      socket.off('screenShareStarted', handleScreenShareStarted);
      socket.off('webrtc-offer', handleWebRTCOffer);
      socket.off('webrtc-answer', handleWebRTCAnswer);
      socket.off('webrtc-ice-candidate', handleWebRTCIceCandidate);
      socket.off('screenShareStopped', handleScreenShareStopped);
    };
  }, [createPeerConnection]);

  return { isSharing, isViewing, screenStream, localStream, startSharing, stopSharing };
}