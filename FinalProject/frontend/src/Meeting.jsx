import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Rnd } from "react-rnd";
import "./meeting.css";
import "bootstrap/dist/css/bootstrap.min.css";

import Camera from "./Camera";
import Mic from "./Mic";

const Meeting = () => {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const localStream = useRef();
  const peerConnection = useRef();
  const serverConnection = useRef();
  const [isHidden, setHidden] = useState(true);
  const [cameraOn, setCameraOn] = useState(false);
  const uuid = createUUID();
  const navigate = useNavigate();

  const peerConnectionConfig = {
    iceServers: [
      { urls: "stun:stun.stunprotocol.org:3478" },
      { urls: "stun:stun.l.google.com:19302" },
    ],
  };

  useEffect(() => {
    pageReady();

    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      if (serverConnection.current) {
        serverConnection.current.close();
      }
      stopCamera(); // Ensure the camera is stopped when the component unmounts
    };
  }, []);

  async function pageReady() {
    const constraints = {
      video: true,
      audio: true, // ensure audio is true
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStream.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Use the Railway domain for the WebSocket connection
      const domain = "work-rtc-production.up.railway.app";
      serverConnection.current = new WebSocket(`wss://${domain}`);
      serverConnection.current.onmessage = gotMessageFromServer;

      start(true);
    } catch (error) {
      errorHandler(error);
    }
  }

  function start(isCaller) {
    if (
      !serverConnection.current ||
      serverConnection.current.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    peerConnection.current = new RTCPeerConnection(peerConnectionConfig);
    peerConnection.current.onicecandidate = gotIceCandidate;
    peerConnection.current.ontrack = gotRemoteStream;

    localStream.current.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, localStream.current);
    });

    if (isCaller) {
      peerConnection.current
        .createOffer()
        .then(createdDescription)
        .catch(errorHandler);
    }
  }

  function gotMessageFromServer(message) {
    if (!peerConnection.current) start(false);

    const signal = JSON.parse(message.data);

    if (signal.uuid === uuid) return;

    if (signal.sdp) {
      peerConnection.current
        .setRemoteDescription(new RTCSessionDescription(signal.sdp))
        .then(() => {
          if (signal.sdp.type !== "offer") return;

          peerConnection.current
            .createAnswer()
            .then(createdDescription)
            .catch(errorHandler);
        })
        .catch(errorHandler);
    } else if (signal.ice) {
      peerConnection.current
        .addIceCandidate(new RTCIceCandidate(signal.ice))
        .catch(errorHandler);
    }
  }

  function gotIceCandidate(event) {
    if (event.candidate) {
      serverConnection.current.send(
        JSON.stringify({ ice: event.candidate, uuid: uuid })
      );
    }
  }

  function createdDescription(description) {
    console.log("Got description");

    peerConnection.current
      .setLocalDescription(description)
      .then(() => {
        serverConnection.current.send(
          JSON.stringify({
            sdp: peerConnection.current.localDescription,
            uuid: uuid,
          })
        );
      })
      .catch(errorHandler);
  }

  function gotRemoteStream(event) {
    console.log("Got remote stream");
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = event.streams[0];
    }
  }

  function errorHandler(error) {
    console.error("Error: ", error);
  }

  function createUUID() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }

    return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4() + s4() + s4()}`;
  }

  function muteMic() {
    const audioTrack = localStream.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
    }
  }

  function muteCam() {
    setHidden(!isHidden);
    const videoTrack = localStream.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
    }
  }

  function handleDisconnect() {
    localStream.current.getTracks().forEach((track) => track.stop());

    // Close peer and socket connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (serverConnection.current) {
      serverConnection.current.close();
      serverConnection.current = null;
    }

    navigate("/");
  }

  // New function to start the pose estimation camera
  const startCamera = async () => {
    await fetch("/start_camera", { method: "POST" });
    setCameraOn(true);
  };

  // New function to stop the pose estimation camera
  const stopCamera = async () => {
    await fetch("/stop_camera", { method: "POST" });
    setCameraOn(false);
  };

  return (
    <div className="container-fluid mx-auto room-height">
      <div className="row text-center py-2 border border-start-0 border-[#B9B9B9] sticky-top">
        <p className="mb-0">
          Currently in session with: Dr. Juan Dela Cruz and Cassandra Eunice
        </p>
      </div>
      <div className="my-3 room-videos">
        <Rnd
          default={{
            x: 0,
            y: 105,
            width: "45vw",
            height: "55vh",
          }}
          minWidth={"280px"}
          minHeight={"200px"}
          bounds=".room-videos"
          className={isHidden ? `drag bg-black-subtle` : `drag`}
        >
          <video
            muted
            ref={localVideoRef}
            className="mx-auto video-local bg-warning-subtle"
            autoPlay
          />
        </Rnd>
        <video
          className="bg-black video-remote mx-auto"
          ref={remoteVideoRef}
          autoPlay
          playsInline
        ></video>
      </div>

      <div className="row bg-white border border-start-0 border-[#B9B9B9] fixed-bottom">
        <div className="d-flex align-items-center justify-content-center">
          <div className="p-2">
            <div style={{ marginTop: "10px" }}>
              <input
                type="button"
                id="start"
                value="Start WebRTC"
                onClick={() => start(true)}
              ></input>
              <input
                type="button"
                id="muteCam"
                value="Mute Cam"
                onClick={muteCam}
              ></input>
              <input
                type="button"
                id="muteMic"
                value="Mute Mic"
                onClick={muteMic}
              ></input>
              <input
                type="button"
                id="disconnect"
                value="Disconnect"
                onClick={handleDisconnect}
              ></input>
              {/* New button to start/stop the pose estimation camera */}
              <input
                type="button"
                id="toggleCamera"
                value={
                  cameraOn ? "Stop Pose Estimation" : "Start Pose Estimation"
                }
                onClick={cameraOn ? stopCamera : startCamera}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Meeting;
