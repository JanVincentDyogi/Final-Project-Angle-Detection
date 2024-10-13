import React, { useState } from 'react';

const CameraComponent = () => {
    const [cameraOn, setCameraOn] = useState(false);

    const startCamera = async () => {
        await fetch('/start_camera', { method: 'POST' });
        setCameraOn(true);
    };

    const stopCamera = async () => {
        await fetch('/stop_camera', { method: 'POST' });
        setCameraOn(false);
    };

    return (
        <div>
            <button onClick={cameraOn ? stopCamera : startCamera}>
                {cameraOn ? 'Stop Camera' : 'Start Camera'}
            </button>
            {cameraOn && <img src="/video_feed" alt="Camera Feed" />}
        </div>
    );
};

export default CameraComponent;